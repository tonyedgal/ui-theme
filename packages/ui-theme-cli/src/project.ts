import { readFile, access, readdir } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import nodePath from 'node:path';
import { resolve, dirname, join } from 'node:path';
import semver from 'semver';
import {
  baseFlagHint,
  detectBase,
  findBase,
  registryFramework,
  supportsFramework,
  unmetRequirement,
} from './bases.ts';
import { readConfig, relativeProjectPath, isRecord } from './config.ts';
import { parseJsonc } from './jsonc.ts';
import { isInside, stripWildcard } from './paths.ts';
import type { PathApi } from './paths.ts';
import { readProjectConfigs } from './tsconfig.ts';
import type {
  Base,
  Framework,
  ProjectOverrides,
  ProjectProfile,
} from './types.ts';

/** The saved or selected component base does not fit the framework. */
export class BaseMismatchError extends Error {
  readonly framework: Framework;
  readonly base: Base;

  constructor(message: string, framework: Framework, base: Base) {
    super(message);
    this.framework = framework;
    this.base = base;
  }
}

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

async function json(path: string): Promise<AppJson | undefined> {
  try {
    const source = await readFile(path, 'utf8');
    let config: unknown;

    try {
      config = parseJsonc(source);
    } catch {
      throw new Error(`Invalid JSON: ${path}`);
    }

    if (!isRecord(config)) throw new Error(`Invalid JSON: ${path}`);

    // SAFETY: JSON object is read as package or components configuration only
    return config as AppJson;
  } catch (error) {
    if (isRecord(error) && error.code === 'ENOENT') return;
    throw error;
  }
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

/**
 * The directory that an `@/*` style alias names. `target` is a resolved
 * tsconfig `paths` target with native separators, so the wildcard is stripped
 * for the platform. A target below the real project root is written under
 * `cwd`, which keeps symlinked project paths.
 */
export function aliasDirectory(
  cwd: string,
  realCwd: string,
  target: string | undefined,
  path: PathApi = nodePath
): string | undefined {
  if (!target) return;
  const directory = stripWildcard(target, path);

  if (!isInside(realCwd, directory, path)) return directory;

  return path.resolve(cwd, path.relative(realCwd, directory));
}

/** Map an alias import path, such as `@/components/ui`, to a directory. */
export function aliasPath(
  alias: string,
  aliasPrefix: string,
  directory: string,
  path: PathApi = nodePath
): string {
  const prefix = `${aliasPrefix}/`;

  return alias.startsWith(prefix)
    ? path.join(directory, alias.slice(prefix.length))
    : alias;
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

  const tsconfigs = readProjectConfigs(
    join(cwd, hasTypeScriptConfig ? 'tsconfig.json' : 'jsconfig.json')
  );

  const paths: Record<string, string[]> = {};

  for (const config of [...tsconfigs].reverse())
    Object.assign(paths, config.paths);

  const aliasKey = Object.keys(paths).find((key) => key.endsWith('/*'));

  const aliasPrefix =
    overrides.aliasPrefix ??
    saved?.aliasPrefix ??
    existing?.aliases?.components?.replace(/\/components.*$/, '') ??
    aliasKey?.slice(0, -2) ??
    '@';

  const aliasTarget = aliasDirectory(
    cwd,
    realpathSync(cwd),
    paths[`${aliasPrefix}/*`]?.[0]
  );

  const explicitComponents =
    overrides.componentsDir ??
    saved?.componentsDir ??
    (existing?.aliases?.ui && aliasTarget
      ? aliasPath(existing.aliases.ui, aliasPrefix, aliasTarget)
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
    detectBase(registryFramework(framework), dependencies, existing?.style);

  if (!supportsFramework(base, registryFramework(framework))) {
    const fits = baseFlagHint(registryFramework(framework));

    throw new BaseMismatchError(
      overrides.base
        ? `--base ${base} does not work with ${framework}. Use ${fits}.`
        : `uitheme.json saves the ${base} base, which does not work with ${framework}. Run again with ${fits} to switch.`,
      framework,
      base
    );
  }

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

/** The unmet requirement of the profile's base, as a one-line message. */
export async function baseRequirementError(
  profile: ProjectProfile
): Promise<string | undefined> {
  const framework = registryFramework(profile.framework),
    name = findBase(profile.base)?.frameworks[framework]?.requires?.package;

  if (!name) return;

  const pkg = await json(join(profile.cwd, 'package.json'));
  let installed: string | undefined;

  try {
    const manifest: unknown = createRequire(join(profile.cwd, 'package.json'))(
      `${name}/package.json`
    );

    // eslint-disable-next-line anti-slop/no-runtime-typeof -- parse the installed package JSON version
    if (isRecord(manifest) && typeof manifest.version === 'string')
      installed = manifest.version;
  } catch {
    installed = undefined;
  }

  return unmetRequirement(profile.base, framework, {
    installed,
    declared: pkg?.dependencies?.[name] ?? pkg?.devDependencies?.[name],
  });
}
