/* eslint-disable anti-slop/no-runtime-typeof, anti-slop/no-unknown-parameters, anti-slop/no-unsafe-dictionary-type -- parse untrusted JSON and HTTP input at this boundary */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import type { ProjectProfile, SavedConfig } from './types.ts';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateConfig(value: unknown): SavedConfig {
  const invalid = () => {
    throw new Error('Invalid uitheme.json configuration');
  };

  if (!isRecord(value) || value.schemaVersion !== 1) return invalid();

  const enums = {
    framework: ['vite-react', 'vite-vue', 'next', 'tanstack', 'nuxt'],
    language: ['ts', 'js'],
    packageManager: ['npm', 'pnpm', 'yarn', 'bun'],
    tailwind: [3, 4],
    base: ['base-ui', 'radix', 'reka'],
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

      if (!allowed?.some((option) => option === field)) invalid();
    } else if (strings.includes(key)) {
      if (
        typeof field !== 'string' ||
        !field.trim() ||
        Array.from(field).some((char) => char.charCodeAt(0) < 32)
      )
        invalid();
    } else if (!['schemaVersion', 'revision', 'installed'].includes(key))
      invalid();
  }

  for (const key of ['cssFile', 'tailwindConfigFile', 'componentsDir']) {
    const path = value[key];

    if (
      typeof path === 'string' &&
      (isAbsolute(path) || path.includes('\\') || /^[a-z]:/i.test(path))
    )
      invalid();

    if (
      key !== 'componentsDir' &&
      typeof path === 'string' &&
      path.split('/').includes('..')
    )
      invalid();
  }

  if (
    value.revision !== undefined &&
    (typeof value.revision !== 'string' ||
      !/^\w[\w-]{7,127}$/.test(value.revision))
  )
    invalid();

  if (value.installed !== undefined) {
    if (!isRecord(value.installed)) return invalid();

    for (const [name, record] of Object.entries(value.installed)) {
      if (
        !/^[a-z][a-z0-9-]*$/.test(name) ||
        !isRecord(record) ||
        typeof record.revision !== 'string' ||
        !/^\w[\w-]{7,127}$/.test(record.revision) ||
        !Array.isArray(record.files)
      )
        return invalid();
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
          return invalid();
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

  return validateConfig(JSON.parse(source));
}

export function relativeProjectPath(
  cwd: string,
  path: string,
  approvedRoot = cwd
): string {
  const absolute = resolve(cwd, path),
    within = relative(approvedRoot, absolute);

  if (within === '..' || within.startsWith('../') || isAbsolute(within))
    throw new Error(`Path is outside the approved workspace: ${path}`);

  return relative(cwd, absolute).replaceAll('\\', '/');
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
  await writeFile(configFile, `${JSON.stringify(value, null, 2)}\n`);
}
