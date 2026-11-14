/* eslint-disable anti-slop/no-runtime-typeof, anti-slop/no-unsafe-dictionary-type -- parse untrusted project configuration at this boundary */
import { readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import {
  createPathsMatcher,
  findTsconfig,
  parseTsconfig,
  type TsConfigResult,
} from 'get-tsconfig';
import { resolveExports, type PathConditions } from 'resolve-pkg-maps';
import { isRecord } from './config.ts';
import { parseJsonc } from './jsonc.ts';

export type PathsMatcher = (specifier: string) => string[];

export interface ProjectConfig {
  path: string;
  /** `paths` with absolute targets, resolved from the config that set them. */
  paths: Record<string, string[]>;
  matcher: PathsMatcher | undefined;
}

const isFile = (path: string) =>
  statSync(path, { throwIfNoEntry: false })?.isFile() ?? false;

function raw(path: string): Record<string, unknown> {
  let value: unknown;

  try {
    value = parseJsonc(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(
      `Invalid TypeScript configuration: ${path}${error instanceof SyntaxError ? ` (${error.message})` : ''}`
    );
  }

  if (!isRecord(value))
    throw new Error(`Invalid TypeScript configuration: ${path}`);

  return value;
}

export function readProjectConfig(path: string): ProjectConfig {
  raw(path);
  const result: TsConfigResult = { path, config: parseTsconfig(path) };
  const matcher = createPathsMatcher(result) ?? undefined;
  const paths: Record<string, string[]> = {};

  // a key matches itself, so the matcher returns its targets with `*` kept
  if (matcher)
    for (const alias of Object.keys(result.config.compilerOptions?.paths ?? {}))
      paths[alias] = matcher(alias).map((target) => resolve(target));

  return { path, paths, matcher };
}

/** The config and its project references, depth first, each once. */
export function readProjectConfigs(
  path: string,
  seen = new Set<string>()
): ProjectConfig[] {
  if (seen.has(path) || !isFile(path)) return [];
  seen.add(path);

  const result = [readProjectConfig(path)];
  const references = raw(path).references;

  for (const reference of Array.isArray(references) ? references : []) {
    if (!isRecord(reference) || typeof reference.path !== 'string') continue;
    let target = resolve(dirname(path), reference.path);

    if (!target.endsWith('.json')) target = join(target, 'tsconfig.json');
    result.push(...readProjectConfigs(target, seen));
  }

  return result;
}

/** The nearest tsconfig.json, or else jsconfig.json, at or above `cwd`. */
export function nearestProjectConfig(cwd: string): ProjectConfig | undefined {
  const path =
    findTsconfig(cwd, 'tsconfig.json') ?? findTsconfig(cwd, 'jsconfig.json');

  return path ? readProjectConfig(path) : undefined;
}

const extensions = ['.ts', '.tsx', '.mts', '.d.ts', '.js', '.jsx', '.mjs'];

/**
 * The file a module path names: the exact file, a TypeScript source behind a
 * `.js` path, the path with a source extension, or its index file.
 */
export function probeModule(base: string): string | undefined {
  const candidates = [base];
  const javascript = /\.(m|c)?js(x?)$/.exec(base);

  if (javascript)
    candidates.push(
      base.slice(0, javascript.index) +
        `.${javascript[1] ?? ''}ts${javascript[2]}`
    );

  candidates.push(
    ...extensions.map((extension) => base + extension),
    ...extensions.map((extension) => join(base, `index${extension}`))
  );

  return candidates.find(isFile);
}

// the package's real directory, written under the same path prefix as `from`
function realPackage(root: string, from: string): string {
  const real = realpathSync(root);

  for (let directory = from; ; directory = dirname(directory)) {
    const prefix = realpathSync(directory);

    if (real === prefix || real.startsWith(prefix + sep))
      return directory + real.slice(prefix.length);

    if (dirname(directory) === directory) return real;
  }
}

// source-first condition sets; a later set only runs when the earlier ones find no file
const conditionSets = [
  ['source', 'development', 'import', 'module', 'default'],
  ['require', 'node', 'default'],
  ['types', 'default'],
];

export interface PackageModule {
  /** The resolved file, or undefined when the package has no such subpath. */
  file: string | undefined;
  /** The package's real directory is outside every node_modules directory. */
  workspace: boolean;
}

/**
 * Resolve a bare specifier through node_modules above `from`, following the
 * package symlink and its `exports`, or probing files when it has none.
 */
export function resolvePackage(
  specifier: string,
  from: string
): PackageModule | undefined {
  const match = /^((?:@[^/]+\/)?[^/@.][^/]*)(\/.*)?$/.exec(specifier);

  if (!match) return;
  const [, name, rest = ''] = match;

  for (let directory = from; ; directory = dirname(directory)) {
    const root = join(directory, 'node_modules', name);
    const manifestPath = join(root, 'package.json');

    if (isFile(manifestPath)) {
      const real = realPackage(root, from);
      const workspace = !real.split(sep).includes('node_modules');
      let manifest: Record<string, unknown> = {};

      try {
        const parsed = JSON.parse(readFileSync(manifestPath, 'utf8'));

        if (isRecord(parsed)) manifest = parsed;
      } catch {
        // an unreadable manifest resolves like one without exports
      }

      if (manifest.exports === undefined || manifest.exports === null)
        return { file: probeModule(join(real, rest)), workspace };

      const found: string[] = [];

      for (const conditions of conditionSets) {
        let targets: string[] = [];

        try {
          // SAFETY: resolveExports validates the exports shape and throws on an invalid one
          targets = resolveExports(
            manifest.exports as PathConditions,
            rest.slice(1),
            conditions
          );
        } catch {
          continue;
        }

        for (const target of targets) {
          const file = probeModule(resolve(real, target));

          if (file && !/\.d\.[cm]?ts$/.test(file)) return { file, workspace };

          if (file) found.push(file);
        }
      }

      return { file: found[0], workspace };
    }

    if (dirname(directory) === directory) return;
  }
}
