import { createHash } from 'node:crypto';
import { lstat, readdir, readFile, writeFile } from 'node:fs/promises';
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  relative,
  resolve,
} from 'node:path';
import { parseArgs } from 'node:util';
import type { CliIO } from './index.ts';
import { readConfig } from '../config.ts';
import {
  rewriteManifest,
  rewriteSource,
  type LocalControls,
} from '../migrate/rewrite.ts';

const ignored = new Set([
  'node_modules',
  '.git',
  '.next',
  '.nuxt',
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

const extensions = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.mts',
  '.cts',
  '.css',
  '.vue',
]);

interface Change {
  file: string;
  before: string;
  after: string;
}

const hash = (text: string) => createHash('sha256').update(text).digest('hex');

async function sourceFiles(directory: string): Promise<string[]> {
  const files: string[] = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = resolve(directory, entry.name);

    if (entry.isDirectory() && !ignored.has(entry.name))
      files.push(...(await sourceFiles(file)));
    else if (entry.isFile() && extensions.has(extname(file))) files.push(file);
  }

  return files;
}

async function localControls(root: string): Promise<LocalControls> {
  const saved = await readConfig(root);
  const controls: LocalControls = {};

  for (const [old, component, exported] of [
    ['UIThemeSwitcher', 'appearance-selector', 'AppearanceSelector'],
    ['UIThemeSelector', 'color-theme-selector', 'ColorThemeSelector'],
  ]) {
    const record = saved?.installed?.[component];

    if (!record?.files.length) continue;
    let valid = true;
    let control: string | undefined;

    for (const entry of record.files) {
      const file = resolve(root, entry.path);
      const local = relative(root, file);

      if (
        !local ||
        local === '..' ||
        local.startsWith('../') ||
        isAbsolute(local)
      ) {
        valid = false;
        break;
      }

      try {
        for (let part = file; part !== root; part = dirname(part))
          if ((await lstat(part)).isSymbolicLink())
            throw new Error('Symlink control');

        if (hash(await readFile(file, 'utf8')) !== entry.hash) {
          valid = false;
          break;
        }

        if (
          basename(file) === `${component}.tsx` ||
          basename(file) === `${component}.jsx`
        )
          control = file;
      } catch {
        valid = false;
        break;
      }
    }

    if (valid && control)
      controls[old] = { file: control, exportName: exported };
  }

  return controls;
}

export async function runMigration(
  args: string[],
  io: CliIO = {}
): Promise<number> {
  const stdout = io.stdout ?? console.log;
  const stderr = io.stderr ?? console.error;

  try {
    const { values } = parseArgs({
      args,
      options: {
        cwd: { type: 'string', short: 'c' },
        yes: { type: 'boolean', short: 'y' },
        'dry-run': { type: 'boolean' },
        preview: { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
        json: { type: 'boolean' },
      },
    });

    if (values.help) {
      stdout(
        'uitheme migrate [--cwd <app>] [--dry-run|--preview] [--yes]\nPreview or apply package/import migration to uitheme-web v2. Custom styled controls require manual migration.'
      );

      return 0;
    }

    const root = resolve(values.cwd ?? process.cwd());
    const known = await localControls(root);
    const changes: Change[] = [];
    const diagnostics: string[] = [];
    const manifestFile = resolve(root, 'package.json');
    const manifest = await readFile(manifestFile, 'utf8');
    const nextManifest = rewriteManifest(manifest);

    if (nextManifest !== manifest)
      changes.push({
        file: manifestFile,
        before: manifest,
        after: nextManifest,
      });

    for (const file of await sourceFiles(root)) {
      const before = await readFile(file, 'utf8');
      const controls: LocalControls = {};

      for (const [name, control] of Object.entries(known))
        if (control) {
          let local = relative(dirname(file), control.file)
            .replaceAll('\\', '/')
            .replace(/\.[jt]sx$/, '');

          if (!local.startsWith('.')) local = './' + local;
          controls[name] = { ...control, file: local };
        }

      const result = rewriteSource(before, file, controls);
      diagnostics.push(
        ...result.diagnostics.map(
          (message) => `${relative(root, file)}: ${message}`
        )
      );

      if (result.text !== before)
        changes.push({ file, before, after: result.text });
    }

    const status = diagnostics.length
      ? 'manual-required'
      : values['dry-run'] || values.preview || !values.yes
        ? 'preview'
        : 'ready';

    const report = {
      status,
      files: changes.map((change) => ({
        path: relative(root, change.file),
        before: change.before,
        after: change.after,
      })),
      dependencies: changes.some((change) => change.file === manifestFile)
        ? ['uitheme-web@^2.0.0']
        : [],
      diagnostics,
    };

    stdout(
      values.json
        ? JSON.stringify(report, null, 2)
        : [
            `Migration status: ${status}.`,
            ...changes.map(
              (change) =>
                `--- ${relative(root, change.file)}\n${change.before}\n+++ ${relative(root, change.file)}\n${change.after}`
            ),
            ...(report.dependencies.length
              ? [
                  'Dependency: uitheme-web@^2.0.0. Run your package manager after migration to update the lockfile.',
                ]
              : []),
          ].join('\n')
    );

    if (diagnostics.length) {
      stderr(
        `Migration status: manual-required. No files changed.\n${diagnostics.join('\n')}\nUpgrade uitheme-web to ^2.0.0 with your package manager on a migration branch before running uitheme add appearance-selector color-theme-selector. Then review custom props and provider setup, and run migrate again. Complete the source migration before building or deploying the app.`
      );

      return 2;
    }

    if (values['dry-run'] || values.preview || !values.yes) {
      if (!values.json)
        stdout('Preview only. Run migrate with --yes to apply this plan.');

      return 0;
    }

    for (const change of changes) {
      if (
        (await lstat(change.file)).isSymbolicLink() ||
        (await readFile(change.file, 'utf8')) !== change.before
      )
        throw new Error(
          `File changed during migration planning: ${change.file}. Run the preview again.`
        );
    }

    const touched: Change[] = [];

    try {
      for (const change of changes) {
        touched.push(change);
        await writeFile(change.file, change.after, 'utf8');
      }
    } catch (error) {
      for (const change of touched.reverse())
        await writeFile(change.file, change.before, 'utf8');
      throw error;
    }

    stdout(
      `Migration complete. Rewrote ${changes.length} file(s). Install dependencies and verify the application.`
    );

    return 0;
  } catch (error) {
    stderr(error instanceof Error ? error.message : String(error));

    return 1;
  }
}
