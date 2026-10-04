import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { blue, bold, cyan, dim, green, yellow } from 'kleur/colors';
import {
  NEW_NAME,
  OLD_NAME,
  rewritePackageJson,
  rewriteSource,
} from './rewrite';

/** File types that can hold an import or a Tailwind source path. */
const SOURCE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.mts',
  '.cts',
  '.css',
]);

/** Directories that never hold consumer source. */
const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  '.next',
  '.output',
  '.svelte-kit',
  '.turbo',
  '.vercel',
  '.cache',
  'build',
  'coverage',
  'dist',
  'out',
]);

/** Guards against a very deep or unexpected tree. */
const MAX_DEPTH = 12;

export interface MigrateOptions {
  /** Project directory. Defaults to the current working directory. */
  cwd: string;
  /** Write without asking. */
  yes: boolean;
}

interface Change {
  file: string;
  before: string;
  after: string;
}

interface PackageJsonChange {
  file: string;
  before: string;
  after: string;
  keptRange: boolean;
}

/**
 * Reads the version of the package that ships this command, so the rewritten
 * dependency range names a version that exists.
 *
 * The command runs from `dist/cli/index.js`, so the manifest is two levels up.
 */
async function readOwnVersion(): Promise<string | null> {
  try {
    const manifestUrl = new URL('../../package.json', import.meta.url);

    const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'));

    const version = String(manifest.version ?? '');

    return /^\d+\.\d+\.\d+(?:[-+][a-zA-Z0-9.-]+)?$/.test(version)
      ? version
      : null;
  } catch {
    return null;
  }
}

async function collectSourceFiles(
  root: string,
  directory: string,
  depth: number
): Promise<string[]> {
  if (depth > MAX_DEPTH) {
    return [];
  }

  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const full = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }

      files.push(...(await collectSourceFiles(root, full, depth + 1)));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(full);
    }
  }

  return files;
}

async function planSourceChanges(root: string): Promise<Change[]> {
  const changes: Change[] = [];

  for (const file of await collectSourceFiles(root, root, 0)) {
    const before = await readFile(file, 'utf8');
    const after = rewriteSource(before);

    if (after !== before) {
      changes.push({ file, before, after });
    }
  }

  return changes;
}

async function planPackageJsonChange(
  root: string,
  version: string | null
): Promise<PackageJsonChange | null> {
  const file = path.join(root, 'package.json');

  let before: string;

  try {
    before = await readFile(file, 'utf8');
  } catch {
    return null;
  }

  const {
    text: after,
    changed,
    keptRange,
  } = rewritePackageJson(before, version);

  if (!changed) {
    return null;
  }

  return { file, before, after, keptRange };
}

async function confirm(question: string): Promise<boolean> {
  const prompt = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answer = await prompt.question(question);

    return /^y(es)?$/i.test(answer.trim());
  } finally {
    prompt.close();
  }
}

function reportPlan(
  root: string,
  source: Change[],
  manifest: PackageJsonChange | null
): void {
  process.stdout.write('\n');

  if (source.length === 0 && manifest === null) {
    process.stdout.write(
      `${green('Nothing to do.')} No file mentions ${OLD_NAME}.\n\n`
    );

    return;
  }

  process.stdout.write(
    `The migration will rewrite ${bold(String(source.length + (manifest ? 1 : 0)))} file(s):\n\n`
  );

  for (const change of source) {
    process.stdout.write(`  ${blue(path.relative(root, change.file))}\n`);
  }

  if (manifest) {
    process.stdout.write(`  ${blue(path.relative(root, manifest.file))}\n`);
  }

  process.stdout.write(`\n${OLD_NAME} becomes ${NEW_NAME}.\n`);
  process.stdout.write(
    `${dim('Entry points keep their names: /core, /react and /tanstack.')}\n\n`
  );
}

async function applyChange(change: {
  file: string;
  after: string;
}): Promise<void> {
  await writeFile(change.file, change.after, 'utf8');
}

export async function runMigrate(options: MigrateOptions): Promise<number> {
  const root = path.resolve(options.cwd);

  const version = await readOwnVersion();
  const source = await planSourceChanges(root);
  const manifest = await planPackageJsonChange(root, version);

  reportPlan(root, source, manifest);

  if (source.length === 0 && manifest === null) {
    return 0;
  }

  if (!options.yes) {
    const proceed = await confirm(`Rewrite these files? ${dim('[y/N]')} `);

    if (!proceed) {
      process.stdout.write(`\n${yellow('Cancelled.')} No file was changed.\n`);

      return 0;
    }
  }

  for (const change of source) {
    await applyChange(change);
  }

  if (manifest) {
    await applyChange(manifest);
  }

  const total = source.length + (manifest ? 1 : 0);
  process.stdout.write(
    `\n${green('Done.')} Rewrote ${bold(String(total))} file(s).\n`
  );
  process.stdout.write(
    `Install the new package with ${cyan(`${bold(NEW_NAME)}`)} and run your package manager.\n\n`
  );

  if (manifest?.keptRange) {
    process.stdout.write(
      `${yellow('Note.')} The command could not read its own version, so the dependency range in package.json was left as it was. Set it to ^${NEW_NAME}'s current version by hand.\n\n`
    );
  }

  return 0;
}
