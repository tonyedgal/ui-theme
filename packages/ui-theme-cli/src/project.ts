import { readFile, access, readdir } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname, join, relative, isAbsolute } from 'node:path';
import ts from 'typescript';
import semver from 'semver';
import { readConfig, relativeProjectPath, isRecord } from './config.ts';
import type { Framework, ProjectOverrides, ProjectProfile } from './types.ts';

const exists = async (p: string) =>
  access(p).then(
    () => true,
    () => false
  );

interface AppJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  packageManager?: string;
  style?: string;
  aliases?: { components?: string; ui?: string };
  tailwind?: { css?: string; config?: string };
}

// Choose the React base from the primitives that the app already installs.
// When the app has both or neither, a shadcn `base-*` style selects Base UI and
// any other shadcn style selects Radix. Without either signal, use Base UI.
function installedReactBase(
  dependencies: Record<string, string>,
  style: string | undefined
): 'base-ui' | 'radix' {
  const names = Object.keys(dependencies);

  const radix = names.some(
    (name) => name === 'radix-ui' || name.startsWith('@radix-ui/')
  );

  const baseUi = names.some(
    (name) => name === '@base-ui/react' || name === '@base-ui-components/react'
  );

  if (radix !== baseUi) return radix ? 'radix' : 'base-ui';

  if (style && !style.startsWith('aria-'))
    return style.startsWith('base-') ? 'base-ui' : 'radix';

  return 'base-ui';
}

async function json(path: string): Promise<AppJson | undefined> {
  try {
    const result = ts.parseConfigFileTextToJson(
      path,
      await readFile(path, 'utf8')
    );

    if (result.error || !isRecord(result.config))
      throw new Error(`Invalid JSON: ${path}`);

    // SAFETY: JSON object is read as package or components configuration only
    return result.config as AppJson;
  } catch (error) {
    if (isRecord(error) && error.code === 'ENOENT') return;
    throw error;
  }
}

async function configs(
  path: string,
  seen = new Set<string>()
): Promise<ts.ParsedCommandLine[]> {
  if (seen.has(path) || !(await exists(path))) return [];
  seen.add(path);

  const value = ts.getParsedCommandLineOfConfigFile(
    path,
    {},
    {
      ...ts.sys,
      realpath: (path) => path,
      onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
        throw new Error(
          ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
        );
      },
    }
  );

  if (!value) throw new Error(`Invalid TypeScript configuration: ${path}`);

  const broken = value.errors.filter(
    (error) => ![18003, 18002].includes(error.code)
  );

  if (broken.length)
    throw new Error(
      ts.flattenDiagnosticMessageText(broken[0].messageText, '\n')
    );
  const result = [value];

  for (const ref of value.projectReferences ?? []) {
    let target = ref.path;

    if (!target.endsWith('.json')) target = join(target, 'tsconfig.json');
    result.push(...(await configs(target, seen)));
  }

  return result;
}

async function cssFiles(root: string, depth = 0): Promise<string[]> {
  if (depth > 5) return [];
  const result: string[] = [];

  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (['node_modules', '.git', '.next', 'dist', '.nuxt'].includes(entry.name))
      continue;
    const path = join(root, entry.name);

    if (entry.isDirectory()) result.push(...(await cssFiles(path, depth + 1)));
    else if (entry.name.endsWith('.css')) result.push(path);
  }

  return result.sort();
}

export async function detectProject(
  overrides: ProjectOverrides = {}
): Promise<ProjectProfile> {
  const cwd = resolve(overrides.cwd ?? process.cwd()),
    pkg = await json(join(cwd, 'package.json'));

  if (!pkg) throw new Error(`No package.json in selected app: ${cwd}`);

  const saved = await readConfig(cwd),
    existing = await json(join(cwd, 'components.json'));

  const dependencies = { ...pkg.devDependencies, ...pkg.dependencies };
  const require = createRequire(join(cwd, 'package.json'));

  const version = (name: string) => {
    try {
      const installed: unknown = require(`${name}/package.json`);

      // eslint-disable-next-line anti-slop/no-runtime-typeof -- parse the installed package JSON version
      if (isRecord(installed) && typeof installed.version === 'string')
        return installed.version;

      return dependencies[name];
    } catch {
      return dependencies[name];
    }
  };

  const nuxtVersion = version('nuxt');

  if (nuxtVersion && semver.minVersion(nuxtVersion)?.major !== 4)
    throw new Error('Nuxt 3 is unsupported; automatic setup requires Nuxt 4');
  const choices: Framework[] = [];

  if (dependencies.next) choices.push('next');

  if (dependencies['@tanstack/react-start']) choices.push('tanstack');

  if (dependencies.nuxt) choices.push('nuxt');

  if (dependencies.vite && !choices.length) {
    if (dependencies.react) choices.push('vite-react');

    if (dependencies.vue) choices.push('vite-vue');
  }

  const framework =
    overrides.framework ??
    saved?.framework ??
    (choices.length === 1 ? choices[0] : undefined);

  if (!framework)
    throw new Error(
      choices.length
        ? 'Framework detection is ambiguous; select framework explicitly'
        : 'Unable to detect framework; select framework explicitly'
    );

  const frameworkPackage = {
    next: 'next',
    tanstack: '@tanstack/react-start',
    nuxt: 'nuxt',
    'vite-react': 'vite',
    'vite-vue': 'vite',
  }[framework];

  const frameworkVersion = version(frameworkPackage);

  if (!frameworkVersion)
    throw new Error(`Selected framework is not installed: ${frameworkPackage}`);

  if (
    framework === 'tanstack' &&
    semver.minVersion(frameworkVersion)?.major !== 1
  )
    throw new Error('Unsupported TanStack Start version');

  if (
    framework === 'next' &&
    !(await exists(join(cwd, 'app'))) &&
    !(await exists(join(cwd, 'src/app')))
  )
    throw new Error('Next App Router is required');

  const tailwindVersion = version('tailwindcss'),
    detectedMajor =
      tailwindVersion && semver.minVersion(tailwindVersion)?.major;

  const tailwind = overrides.tailwind ?? saved?.tailwind ?? detectedMajor;

  if (tailwind !== 3 && tailwind !== 4)
    throw new Error('Existing Tailwind 3.4 or 4 configuration is required');

  if (detectedMajor !== tailwind)
    throw new Error(
      'Selected Tailwind major does not match installed Tailwind'
    );

  if (
    tailwind === 3 &&
    !semver.satisfies(semver.minVersion(tailwindVersion!)!, '>=3.4.0 <4')
  )
    throw new Error('Tailwind 3.4 or newer is required');
  const hasTypeScriptConfig = await exists(join(cwd, 'tsconfig.json'));

  const tsconfigs = await configs(
    join(cwd, hasTypeScriptConfig ? 'tsconfig.json' : 'jsconfig.json')
  );

  const paths: Record<string, string[]> = {};

  for (const config of [...tsconfigs].reverse()) {
    // SAFETY: TypeScript stores the originating paths directory on parsed options
    const options = config.options as ts.CompilerOptions & {
      pathsBasePath?: string;
    };

    for (const [alias, targets] of Object.entries(options.paths ?? {}))
      paths[alias] = targets.map((target) =>
        resolve(
          options.baseUrl ??
            options.pathsBasePath ??
            dirname(String(options.configFilePath)),
          target
        )
      );
  }

  const aliasKey = Object.keys(paths).find((key) => key.endsWith('/*'));

  const aliasPrefix =
    overrides.aliasPrefix ??
    saved?.aliasPrefix ??
    existing?.aliases?.components?.replace(/\/components.*$/, '') ??
    aliasKey?.slice(0, -2) ??
    '@';

  let aliasTarget = paths[`${aliasPrefix}/*`]?.[0]?.replace(/\/\*$/, '');

  if (aliasTarget) {
    const local = relative(realpathSync(cwd), aliasTarget);

    if (local !== '..' && !local.startsWith('../') && !isAbsolute(local))
      aliasTarget = resolve(cwd, local);
  }

  const explicitComponents =
    overrides.componentsDir ??
    saved?.componentsDir ??
    (existing?.aliases?.ui && aliasTarget
      ? existing.aliases.ui.replace(`${aliasPrefix}/`, `${aliasTarget}/`)
      : undefined);

  const componentsDir =
    explicitComponents ??
    join(
      aliasTarget ?? ((await exists(join(cwd, 'src'))) ? 'src' : ''),
      'components/ui'
    );

  const candidates = await cssFiles(cwd),
    configured = [];

  for (const file of candidates) {
    const text = await readFile(file, 'utf8');

    if (
      /@(?:import\s+["']tailwindcss|tailwind\s+(?:base|utilities))/.test(text)
    )
      configured.push(file);
  }

  const cssFile =
    overrides.cssFile ??
    saved?.cssFile ??
    existing?.tailwind?.css ??
    (configured.length === 1 ? configured[0] : undefined);

  if (!cssFile)
    throw new Error(
      'Select cssFile explicitly; no single configured Tailwind CSS file was found'
    );
  const cssPath = resolve(cwd, cssFile);

  if (!(await exists(cssPath)))
    throw new Error(`CSS file does not exist: ${cssFile}`);
  const css = await readFile(cssPath, 'utf8');

  let workspaceRoot = cwd,
    current = cwd,
    packageManager: ProjectProfile['packageManager'] = 'npm';

  while (true) {
    const parentPkg = await json(join(current, 'package.json'));
    const declared = parentPkg?.packageManager?.split('@')[0];

    if (
      declared === 'npm' ||
      declared === 'pnpm' ||
      declared === 'yarn' ||
      declared === 'bun'
    ) {
      packageManager = declared;
      workspaceRoot = current;
    }

    for (const [lock, manager] of [
      ['pnpm-lock.yaml', 'pnpm'],
      ['yarn.lock', 'yarn'],
      ['bun.lock', 'bun'],
      ['package-lock.json', 'npm'],
    ] as const) {
      if (await exists(join(current, lock))) {
        workspaceRoot = current;

        if (!declared) packageManager = manager;
      }
    }

    const parent = dirname(current);

    if (parent === current) break;
    current = parent;
  }

  const base =
    overrides.base ??
    saved?.base ??
    (framework === 'nuxt' || framework === 'vite-vue'
      ? 'reka'
      : installedReactBase(dependencies, existing?.style));

  if (
    framework === 'nuxt' || framework === 'vite-vue'
      ? base !== 'reka'
      : base === 'reka'
  )
    throw new Error('Component base is incompatible with selected framework');

  const tailwindConfigFile =
    overrides.tailwindConfigFile ??
    saved?.tailwindConfigFile ??
    existing?.tailwind?.config ??
    (
      await Promise.all(
        ['ts', 'js', 'cjs', 'mjs'].map(async (ext) =>
          (await exists(join(cwd, `tailwind.config.${ext}`)))
            ? `tailwind.config.${ext}`
            : undefined
        )
      )
    ).find(Boolean);

  if (tailwind === 3 && !tailwindConfigFile)
    throw new Error('Tailwind 3 configuration file is required');

  for (const file of [cssPath, componentsDir, tailwindConfigFile].filter(
    (file): file is string => file !== undefined
  ))
    relativeProjectPath(
      cwd,
      file,
      file === componentsDir && explicitComponents ? workspaceRoot : cwd
    );

  return {
    cwd,
    workspaceRoot,
    framework,
    frameworkVersion,
    language:
      overrides.language ??
      saved?.language ??
      (hasTypeScriptConfig ? 'ts' : 'js'),
    packageManager:
      overrides.packageManager ?? saved?.packageManager ?? packageManager,
    tailwind,
    cssFile: cssPath,
    tailwindConfigFile: tailwindConfigFile
      ? resolve(cwd, tailwindConfigFile)
      : undefined,
    componentsDir: resolve(cwd, componentsDir),
    aliasPrefix,
    base,
    colorFormat:
      overrides.colorFormat ??
      saved?.colorFormat ??
      (/--[\w-]+:\s*[\d.]+\s+[\d.]+%\s+[\d.]+%/.test(css)
        ? 'hsl-channels'
        : 'css'),
    configFile: join(cwd, 'uitheme.json'),
  };
}
