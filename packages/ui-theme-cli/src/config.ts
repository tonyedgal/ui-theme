/* eslint-disable anti-slop/no-runtime-typeof, anti-slop/no-unknown-parameters, anti-slop/no-unsafe-dictionary-type -- parse untrusted JSON and HTTP input at this boundary */
import { randomBytes } from 'node:crypto';
import { chmod, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve, isAbsolute } from 'node:path';
import nodePath from 'node:path';
import { isInside } from './paths.ts';
import type { PathApi } from './paths.ts';
import { baseIds } from './bases.ts';
import type { ProjectProfile, SavedConfig } from './types.ts';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function writeFileAtomic(
  path: string,
  content: string | Uint8Array,
  move: typeof rename = rename
): Promise<void> {
  const temporary = join(
    dirname(path),
    `.${basename(path)}.${randomBytes(6).toString('hex')}.tmp`
  );

  let mode: number | undefined;

  try {
    mode = (await stat(path)).mode & 0o7777;
  } catch (error) {
    if (!(isRecord(error) && error.code === 'ENOENT')) throw error;
  }

  try {
    await writeFile(temporary, content, { flag: 'wx' });

    if (mode !== undefined) await chmod(temporary, mode);
    await moveOntoTarget(temporary, path, content, move);
  } finally {
    await rm(temporary, { force: true });
  }
}

const busyCodes = new Set(['EPERM', 'EBUSY', 'EACCES']);

const pause = (ms: number) => new Promise((done) => setTimeout(done, ms));

/**
 * Windows refuses to rename over a file that an antivirus scanner, a sync
 * client, an editor or a dev server holds open. Retry a few times, then write
 * the target directly.
 */
async function moveOntoTarget(
  temporary: string,
  path: string,
  content: string | Uint8Array,
  move: typeof rename
): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await move(temporary, path);
    } catch (error) {
      if (!(isRecord(error) && busyCodes.has(String(error.code)))) throw error;

      if (attempt === 3) break;
      await pause(25 * attempt);
    }
  }

  await writeFile(path, content);
}

export function validateConfig(value: unknown): SavedConfig {
  const invalid = (field = 'the file', reason = 'is not valid'): never => {
    throw new Error(`Invalid uitheme.json configuration: ${field} ${reason}`);
  };

  if (!isRecord(value)) return invalid('the file', 'must be a JSON object');

  if (value.schemaVersion !== 1)
    return invalid('schemaVersion', 'must be the number 1');

  const enums = {
    framework: ['vite-react', 'vite-vue', 'next', 'tanstack', 'nuxt'],
    language: ['ts', 'js'],
    packageManager: ['npm', 'pnpm', 'yarn', 'bun'],
    tailwind: [3, 4],
    base: baseIds(),
    colorFormat: ['css', 'hsl-channels'],
  } satisfies Record<string, readonly unknown[]>;

  const strings = [
    'frameworkVersion',
    'aliasPrefix',
    'cssFile',
    'tailwindConfigFile',
    'componentsDir',
  ];

  for (const [key, field] of Object.entries(value)) {
    if (field === undefined) continue;

    if (Object.hasOwn(enums, key)) {
      const allowed = Object.entries(enums).find(([name]) => name === key)?.[1];

      if (!allowed?.some((option) => option === field))
        invalid(key, `must be one of ${allowed?.join(', ')}`);
    } else if (strings.includes(key)) {
      if (
        typeof field !== 'string' ||
        !field.trim() ||
        Array.from(field).some((char) => char.charCodeAt(0) < 32)
      )
        invalid(key, 'must be a non-empty string without control characters');
    } else if (!['schemaVersion', 'revision', 'installed'].includes(key))
      invalid(key, 'is not a known field');
  }

  const examples = {
    cssFile: 'src/app/globals.css',
    tailwindConfigFile: 'tailwind.config.ts',
    componentsDir: 'src/components/ui',
  } as const;

  for (const key of [
    'cssFile',
    'tailwindConfigFile',
    'componentsDir',
  ] as const) {
    const path = value[key];

    if (
      typeof path === 'string' &&
      (isAbsolute(path) || path.includes('\\') || /^[a-z]:/i.test(path))
    )
      invalid(
        key,
        `must be a relative path that uses "/" (for example "${examples[key]}"), not "${path}"`
      );

    if (
      key !== 'componentsDir' &&
      typeof path === 'string' &&
      path.split('/').includes('..')
    )
      invalid(key, 'must stay inside the project and not contain ".."');
  }

  if (
    value.revision !== undefined &&
    (typeof value.revision !== 'string' ||
      !/^\w[\w-]{7,127}$/.test(value.revision))
  )
    invalid('revision', 'must be a revision identifier');

  if (value.installed !== undefined) {
    if (!isRecord(value.installed))
      return invalid('installed', 'must be an object');

    for (const [name, record] of Object.entries(value.installed)) {
      if (
        !/^[a-z][a-z0-9-]*$/.test(name) ||
        !isRecord(record) ||
        typeof record.revision !== 'string' ||
        !/^\w[\w-]{7,127}$/.test(record.revision) ||
        !Array.isArray(record.files)
      )
        return invalid(`installed.${name}`, 'is not a valid record');
      const seen = new Set<string>();

      for (const file of record.files) {
        if (
          !isRecord(file) ||
          typeof file.path !== 'string' ||
          !file.path ||
          isAbsolute(file.path) ||
          file.path.includes('\\') ||
          /^[a-z]:/i.test(file.path) ||
          Array.from(file.path).some((char) => char.charCodeAt(0) < 32) ||
          typeof file.hash !== 'string' ||
          !/^[a-f0-9]{64}$/.test(file.hash) ||
          seen.has(file.path)
        )
          return invalid(
            `installed.${name}.files`,
            'needs a unique relative "path" that uses "/" and a sha256 "hash"'
          );
        seen.add(file.path);
      }
    }
  }

  // SAFETY: all required fields and nested values were validated above
  return Object.assign({ schemaVersion: 1 as const }, value);
}

export async function readConfig(
  cwd: string
): Promise<SavedConfig | undefined> {
  let source: string;

  try {
    source = await readFile(resolve(cwd, 'uitheme.json'), 'utf8');
  } catch (error) {
    if (isRecord(error) && error.code === 'ENOENT') return;
    throw error;
  }

  return validateConfig(JSON.parse(source.replace(/^\uFEFF/, '')));
}

export function relativeProjectPath(
  cwd: string,
  path: string,
  approvedRoot = cwd,
  pathApi: PathApi = nodePath
): string {
  const absolute = pathApi.resolve(cwd, path);

  if (!isInside(approvedRoot, absolute, pathApi))
    throw new Error(`Path is outside the approved workspace: ${path}`);

  return pathApi.relative(cwd, absolute).replaceAll('\\', '/');
}

export async function writeConfig(
  profile: ProjectProfile,
  extra: Partial<SavedConfig> = {}
): Promise<void> {
  const { cwd, workspaceRoot, configFile, ...fields } = profile;
  const value: SavedConfig = { ...fields, ...extra, schemaVersion: 1 };

  for (const key of ['cssFile', 'tailwindConfigFile', 'componentsDir'] as const)
    if (value[key])
      value[key] = relativeProjectPath(
        cwd,
        value[key],
        key === 'componentsDir' ? workspaceRoot : cwd
      );
  validateConfig(value);
  await writeFileAtomic(configFile, `${JSON.stringify(value, null, 2)}\n`);
}
