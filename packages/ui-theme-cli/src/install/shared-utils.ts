/* eslint-disable anti-slop/no-runtime-typeof -- validate project configuration at this boundary */
import { dirname, join, resolve, extname, relative, sep } from 'node:path';
import ts from 'typescript';
import { isRecord } from '../config.ts';
import type { ProjectProfile } from '../types.ts';
import { componentOwner, planFile, readOptional } from './index.ts';
import type { PlanOptions } from './index.ts';

async function jsonFile(path: string) {
  const source = await readOptional(path);

  if (!source) return {};
  const parsed = ts.parseConfigFileTextToJson(path, source);

  if (parsed.error || !isRecord(parsed.config))
    throw new Error(`Invalid configuration: ${path}`);

  return parsed.config;
}

function compilerOptions(cwd: string): ts.CompilerOptions {
  const path =
    ts.findConfigFile(cwd, ts.sys.fileExists, 'tsconfig.json') ??
    ts.findConfigFile(cwd, ts.sys.fileExists, 'jsconfig.json');

  if (!path) return {};
  const config = ts.readConfigFile(path, ts.sys.readFile);

  if (config.error) throw new Error(`Cannot read configuration: ${path}`);

  return ts.parseJsonConfigFileContent(config.config, ts.sys, dirname(path))
    .options;
}

function hasCnExport(path: string, options: ts.CompilerOptions) {
  const program = ts.createProgram([path], {
    ...options,
    allowJs: true,
    noEmit: true,
    skipLibCheck: true,
  });

  const source = program.getSourceFile(path);

  if (source && program.getSyntacticDiagnostics(source).length) return false;
  const checker = program.getTypeChecker();
  const module = source && checker.getSymbolAtLocation(source);

  const exported =
    module &&
    checker.getExportsOfModule(module).find((symbol) => symbol.name === 'cn');

  if (!exported || !source) return false;

  const binding =
    exported.flags & ts.SymbolFlags.Alias
      ? checker.getAliasedSymbol(exported)
      : exported;

  const type = checker.getTypeOfSymbolAtLocation(binding, source);

  if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown))
    throw new Error(
      `Cannot validate cn in ${path}. Install its dependencies and check its imports before replacing this file.`
    );

  return type.getCallSignatures().length > 0;
}

export async function planSharedUtils(
  profile: ProjectProfile,
  options: PlanOptions = {}
) {
  const owner = await componentOwner(profile);
  const config = await jsonFile(join(owner.cwd, 'components.json'));

  const appConfig =
    owner.cwd === profile.cwd
      ? config
      : await jsonFile(join(profile.cwd, 'components.json'));

  const aliases = isRecord(config.aliases)
    ? config.aliases
    : isRecord(appConfig.aliases)
      ? appConfig.aliases
      : {};

  const importPath =
    typeof aliases.utils === 'string'
      ? aliases.utils
      : `${profile.aliasPrefix}/lib/utils`;

  const compiler = compilerOptions(owner.cwd);

  const resolved = ts.resolveModuleName(
    importPath,
    join(owner.cwd, '__uitheme__.ts'),
    {
      ...compiler,
      moduleResolution:
        compiler.moduleResolution ?? ts.ModuleResolutionKind.Bundler,
    },
    ts.sys
  ).resolvedModule;

  if (resolved && /\.d\.[cm]?ts$/.test(resolved.resolvedFileName))
    throw new Error(
      `Utils alias ${importPath} resolves to a declaration. Configure an alias to its source file before installing.`
    );

  let utility = resolved?.resolvedFileName;

  if (!utility) {
    for (const [alias, targets] of Object.entries(compiler.paths ?? {})) {
      const [prefix, suffix] = alias.split('*');

      if (
        alias.includes('*')
          ? !importPath.startsWith(prefix) || !importPath.endsWith(suffix)
          : alias !== importPath
      )
        continue;

      const capture = alias.includes('*')
        ? importPath.slice(
            prefix.length,
            suffix.length ? -suffix.length : undefined
          )
        : '';

      const target = targets[0]?.replace('*', capture);

      if (target)
        utility = resolve(
          compiler.baseUrl ??
            (typeof compiler.pathsBasePath === 'string'
              ? compiler.pathsBasePath
              : owner.cwd),
          target
        );
      break;
    }
  }

  if (!utility && typeof aliases.utils === 'string') {
    const manifest = await jsonFile(join(owner.cwd, 'package.json'));

    if (
      typeof manifest.name === 'string' &&
      importPath.startsWith(`${manifest.name}/`)
    ) {
      const subpath = `.${importPath.slice(manifest.name.length)}`;
      const exports = isRecord(manifest.exports) ? manifest.exports : {};

      for (const [key, value] of Object.entries(exports)) {
        const [prefix, suffix] = key.split('*');

        if (
          key.includes('*')
            ? !subpath.startsWith(prefix) || !subpath.endsWith(suffix)
            : key !== subpath
        )
          continue;

        const target =
          typeof value === 'string'
            ? value
            : isRecord(value)
              ? [
                  value.source,
                  value.development,
                  value.import,
                  value.default,
                  value.types,
                ].find((target): target is string => typeof target === 'string')
              : undefined;

        if (target)
          utility = resolve(
            owner.cwd,
            target.replace(
              '*',
              subpath.slice(
                prefix.length,
                suffix.length ? -suffix.length : undefined
              )
            )
          );
      }
    }

    if (!utility)
      throw new Error(
        `Cannot resolve utils alias ${importPath}. Configure its path in components.json and the project configuration.`
      );
  }

  utility ??= join(
    owner.cwd,
    relative(owner.cwd, profile.componentsDir).split(sep)[0] === 'src' ||
      ts.sys.directoryExists(join(owner.cwd, 'src'))
      ? 'src/lib/utils'
      : 'lib/utils'
  );

  if (!extname(utility)) {
    const candidates = [utility + '.ts', utility + '.js'];
    utility =
      candidates.find(ts.sys.fileExists) ??
      utility + (profile.language === 'js' ? '.js' : '.ts');
  }

  const planProfile = { ...profile, utilsFile: utility };
  const existing = (await planFile(planProfile, utility, '')).before;

  if (existing !== undefined && hasCnExport(utility, compiler))
    return {
      owner,
      profile: planProfile,
      importPath,
      file: await planFile(planProfile, utility, existing),
      dependencies: [
        ...(/(?:from|import)\s*['"]clsx['"]/.test(existing)
          ? ['clsx@^2.1.1']
          : []),
        ...(/(?:from|import)\s*['"]tailwind-merge['"]/.test(existing)
          ? [`tailwind-merge@^${profile.tailwind === 3 ? '2.6.0' : '3.0.0'}`]
          : []),
      ],
    };

  if (existing !== undefined && !options.overwrite && !options.diff)
    throw new Error(
      `${utility} does not export a callable cn. Export cn from that file, or review a replacement with --overwrite --dry-run before applying --overwrite.`
    );
  const javascript = ['.js', '.jsx', '.mjs'].includes(extname(utility));
  const content = `import { clsx${javascript ? '' : ', type ClassValue'} } from 'clsx';\nimport { twMerge } from 'tailwind-merge';\n\nexport function cn(...inputs${javascript ? '' : ': ClassValue[]'}) {\n  return twMerge(clsx(inputs));\n}\n`;

  return {
    owner,
    profile: planProfile,
    importPath,
    file: await planFile(planProfile, utility, content),
    dependencies: [
      'clsx@^2.1.1',
      `tailwind-merge@${profile.tailwind === 3 ? '^2.6.0' : '^3.0.0'}`,
    ],
  };
}
