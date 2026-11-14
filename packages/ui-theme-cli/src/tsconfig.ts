/* eslint-disable anti-slop/no-runtime-typeof, anti-slop/no-unsafe-dictionary-type -- parse untrusted project configuration at this boundary */
import { readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import {
  createPathsMatcher,
  findTsconfig,
  parseTsconfig,
  type TsConfigResult,
} from 'get-tsconfig';
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
