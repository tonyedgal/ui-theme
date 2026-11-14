/* eslint-disable anti-slop/no-runtime-typeof -- validate project configuration at this boundary */
import { dirname, join, resolve, extname, relative, sep } from 'node:path';
import { readFileSync, statSync } from 'node:fs';
import { isRecord } from '../config.ts';
import { parseJsonc } from '../jsonc.ts';
import { moduleName, parseModule, type t } from '../parse.ts';
import { nearestProjectConfig, probeModule } from '../tsconfig.ts';
import type { ProjectProfile } from '../types.ts';
import {
  componentOwner,
  planFile,
  readOptional,
  settleConflict,
} from './index.ts';
import type { PlanOptions } from './index.ts';

async function jsonFile(path: string) {
  const source = await readOptional(path);

  if (!source) return {};
  let config: unknown;

  try {
    config = parseJsonc(source);
  } catch {
    throw new Error(`Invalid configuration: ${path}`);
  }

  if (!isRecord(config)) throw new Error(`Invalid configuration: ${path}`);

  return config;
}

const reexportDepth = 8;

type Binding =
  | { kind: 'callable' | 'not-callable' }
  | { kind: 'expression'; node: t.Expression }
  | { kind: 'import'; source: string; name: string };

function unwrap(node: t.Expression): t.Expression {
  while (
    node.type === 'TSAsExpression' ||
    node.type === 'TSSatisfiesExpression' ||
    node.type === 'TSNonNullExpression' ||
    node.type === 'TSTypeAssertion' ||
    node.type === 'ParenthesizedExpression'
  )
    node = node.expression;

  return node;
}

const literals = new Set([
  'StringLiteral',
  'NumericLiteral',
  'BigIntLiteral',
  'BooleanLiteral',
  'NullLiteral',
  'RegExpLiteral',
  'TemplateLiteral',
  'ObjectExpression',
  'ArrayExpression',
  'ClassExpression',
]);

/** Whether `name`, exported from the module at `path`, can be called. */
function exportsCallable(
  path: string,
  name: string,
  seen: Set<string>
): boolean {
  const key = `${path}#${name}`;

  if (seen.has(key) || seen.size >= reexportDepth) return false;
  seen.add(key);

  let program: t.Program;

  try {
    program = parseModule(path, readFileSync(path, 'utf8'));
  } catch {
    return false;
  }

  const bindings = new Map<string, Binding>();

  const declare = (declaration: t.Node) => {
    if (declaration.type === 'FunctionDeclaration' && declaration.id)
      bindings.set(declaration.id.name, { kind: 'callable' });
    else if (declaration.type === 'TSDeclareFunction' && declaration.id)
      bindings.set(declaration.id.name, { kind: 'callable' });
    else if (declaration.type === 'ClassDeclaration' && declaration.id)
      bindings.set(declaration.id.name, { kind: 'not-callable' });
    else if (
      (declaration.type === 'TSEnumDeclaration' ||
        declaration.type === 'TSInterfaceDeclaration' ||
        declaration.type === 'TSTypeAliasDeclaration') &&
      declaration.id.type === 'Identifier'
    )
      bindings.set(declaration.id.name, { kind: 'not-callable' });
    else if (declaration.type === 'VariableDeclaration')
      for (const declarator of declaration.declarations)
        if (declarator.id.type === 'Identifier')
          bindings.set(
            declarator.id.name,
            declarator.init
              ? { kind: 'expression', node: declarator.init }
              : { kind: 'callable' }
          );
  };

  for (const statement of program.body) {
    if (statement.type === 'ImportDeclaration')
      for (const specifier of statement.specifiers)
        bindings.set(
          specifier.local.name,
          statement.importKind === 'type' ||
            (specifier.type === 'ImportSpecifier' &&
              specifier.importKind === 'type') ||
            specifier.type === 'ImportNamespaceSpecifier'
            ? { kind: 'not-callable' }
            : {
                kind: 'import',
                source: statement.source.value,
                name:
                  specifier.type === 'ImportSpecifier'
                    ? moduleName(specifier.imported)
                    : 'default',
              }
        );
    else if (
      (statement.type === 'ExportNamedDeclaration' ||
        statement.type === 'ExportDefaultDeclaration') &&
      statement.declaration
    )
      declare(statement.declaration);
    else declare(statement);
  }

  const imported = (source: string, imported: string): boolean => {
    if (!source.startsWith('.')) return true;
    const target = probeModule(resolve(dirname(path), source));

    return !!target && exportsCallable(target, imported, seen);
  };

  const callable = (binding: Binding | undefined, depth = 0): boolean => {
    if (!binding || depth > reexportDepth) return false;

    if (binding.kind === 'import')
      return imported(binding.source, binding.name);

    if (binding.kind !== 'expression') return binding.kind === 'callable';
    const node = unwrap(binding.node);

    if (literals.has(node.type)) return false;

    // a global or a parameter cannot be disproved without types
    if (node.type === 'Identifier')
      return (
        !bindings.has(node.name) || callable(bindings.get(node.name), depth + 1)
      );

    return true;
  };

  const viaStar: string[] = [];

  for (const statement of program.body) {
    if (statement.type === 'ExportDefaultDeclaration' && name === 'default') {
      const declaration = statement.declaration;

      if (
        declaration.type === 'FunctionDeclaration' ||
        declaration.type === 'TSDeclareFunction'
      )
        return true;

      if (declaration.type === 'ClassDeclaration') return false;

      return callable(
        declaration.type === 'Identifier'
          ? (bindings.get(declaration.name) ?? { kind: 'callable' })
          : /Declaration$/.test(declaration.type)
            ? { kind: 'not-callable' }
            : // SAFETY: a default export that is not a declaration is an expression
              { kind: 'expression', node: declaration as t.Expression }
      );
    }

    if (statement.type === 'ExportNamedDeclaration') {
      const typeOnly = statement.exportKind === 'type';
      const declaration = statement.declaration;

      if (declaration) {
        const names =
          declaration.type === 'VariableDeclaration'
            ? declaration.declarations.flatMap((item) =>
                item.id.type === 'Identifier' ? [item.id.name] : []
              )
            : 'id' in declaration &&
                declaration.id &&
                declaration.id.type === 'Identifier'
              ? [declaration.id.name]
              : [];

        if (names.includes(name))
          return !typeOnly && callable(bindings.get(name));
      }

      for (const specifier of statement.specifiers) {
        if (moduleName(specifier.exported) !== name) continue;

        if (
          typeOnly ||
          specifier.type !== 'ExportSpecifier' ||
          specifier.exportKind === 'type'
        )
          return false;

        return statement.source
          ? imported(statement.source.value, moduleName(specifier.local))
          : callable(bindings.get(moduleName(specifier.local)));
      }
    }

    if (
      statement.type === 'ExportAllDeclaration' &&
      statement.exportKind !== 'type' &&
      name !== 'default'
    )
      viaStar.push(statement.source.value);
  }

  return viaStar.some((source) => imported(source, name));
}

function hasCnExport(path: string) {
  return exportsCallable(path, 'cn', new Set());
}

const noSteps: string[] = [];

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

  const compiler = nearestProjectConfig(owner.cwd);

  const targets = /^\.\.?(?:\/|$)/.test(importPath)
    ? [resolve(owner.cwd, importPath)]
    : (compiler?.matcher?.(importPath) ?? []);

  const resolved = targets
    .map(probeModule)
    .find((target): target is string => !!target);

  if (resolved && /\.d\.[cm]?ts$/.test(resolved))
    throw new Error(
      `Utils alias ${importPath} resolves to a declaration. Configure an alias to its source file before installing.`
    );

  let utility = resolved ?? (targets[0] && resolve(targets[0]));

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
      statSync(join(owner.cwd, 'src'), {
        throwIfNoEntry: false,
      })?.isDirectory()
      ? 'src/lib/utils'
      : 'lib/utils'
  );

  if (!extname(utility)) {
    const candidates = [utility + '.ts', utility + '.js'];
    utility =
      candidates.find((candidate) =>
        statSync(candidate, { throwIfNoEntry: false })?.isFile()
      ) ?? utility + (profile.language === 'js' ? '.js' : '.ts');
  }

  const planProfile = { ...profile, utilsFile: utility };
  const existing = (await planFile(planProfile, utility, '')).before;

  if (existing !== undefined && hasCnExport(utility))
    return {
      owner,
      profile: planProfile,
      importPath,
      file: await planFile(planProfile, utility, existing),
      manualSteps: noSteps,
      dependencies: [
        ...(/(?:from|import)\s*['"]clsx['"]/.test(existing)
          ? ['clsx@^2.1.1']
          : []),
        ...(/(?:from|import)\s*['"]tailwind-merge['"]/.test(existing)
          ? [`tailwind-merge@^${profile.tailwind === 3 ? '2.6.0' : '3.0.0'}`]
          : []),
      ],
    };

  const javascript = ['.js', '.jsx', '.mjs'].includes(extname(utility));
  const content = `import { clsx${javascript ? '' : ', type ClassValue'} } from 'clsx';\nimport { twMerge } from 'tailwind-merge';\n\nexport function cn(...inputs${javascript ? '' : ': ClassValue[]'}) {\n  return twMerge(clsx(inputs));\n}\n`;

  const file = await settleConflict(
    planProfile,
    await planFile(planProfile, utility, content),
    'no-cn',
    options
  );

  const local = relative(profile.cwd, utility).replaceAll('\\', '/');

  return {
    owner,
    profile: planProfile,
    importPath,
    file,
    // The controls import cn, so a kept file still needs the export.
    manualSteps: file.kept
      ? [`Export cn from ${local}. The controls import it:\n\n${content}`]
      : [],
    dependencies: [
      'clsx@^2.1.1',
      `tailwind-merge@${profile.tailwind === 3 ? '^2.6.0' : '^3.0.0'}`,
    ],
  };
}
