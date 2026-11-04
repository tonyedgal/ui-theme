import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { afterEach, expect, test } from 'vitest';
import { runMigration } from '../src/commands/migrate.ts';

const roots: string[] = [];

async function fixture(files: Record<string, string>) {
  const root = await mkdtemp(join(tmpdir(), 'uitheme-migrate-'));
  roots.push(root);

  for (const [name, content] of Object.entries(files)) {
    await mkdir(dirname(join(root, name)), { recursive: true });
    await writeFile(join(root, name), content);
  }

  return root;
}

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
  );
});

const hash = (text: string) => createHash('sha256').update(text).digest('hex');

test('preview reports migration without changing files or unrelated string literals', async () => {
  const source = `// '@ui-theme/web/react'\nimport { useTheme } from '@ui-theme/web/react';\nconst example = '@ui-theme/web/react';\n`;

  const root = await fixture({
    'package.json':
      '{"dependencies":{"@ui-theme/web":"^1.0.0","uitheme-vue":"^1.0.0"}}\n',
    'src.ts': source,
  });

  const output: string[] = [];
  expect(
    await runMigration(['--cwd', root, '--dry-run'], {
      stdout: (text) => output.push(text),
    })
  ).toBe(0);
  expect(output.join('\n')).toContain('src.ts');
  expect(await readFile(join(root, 'src.ts'), 'utf8')).toBe(source);
  expect(await runMigration(['--cwd', root, '--yes'], {})).toBe(0);
  expect(await readFile(join(root, 'src.ts'), 'utf8')).toBe(
    source.replace("from '@ui-theme/web/react'", "from 'uitheme-web/react'")
  );
  expect(
    JSON.parse(await readFile(join(root, 'package.json'), 'utf8')).dependencies
  ).toEqual({ 'uitheme-web': '^2.0.0' });
});

test('Vue SFC imports and Nuxt module entries migrate while template text and comments remain exact', async () => {
  const source = `<script setup lang="ts">\n// keep uitheme-vue here\nimport { useTheme } from 'uitheme-vue';\nimport { getThemeScript } from 'uitheme-vue/bootstrap';\n</script>\n<template><p>uitheme-vue</p></template>\n`;

  const root = await fixture({
    'package.json': '{\n  "dependencies": { "uitheme-vue": "^1.0.0" }\n}\n',
    'App.vue': source,
    'nuxt.config.ts': `export default defineNuxtConfig({ modules: ['uitheme-vue/nuxt'] });\n`,
  });

  expect(await runMigration(['--cwd', root, '--yes'], {})).toBe(0);
  expect(await readFile(join(root, 'App.vue'), 'utf8')).toBe(
    source
      .replace("from 'uitheme-vue'", "from 'uitheme-web/vue'")
      .replace(
        "from 'uitheme-vue/bootstrap'",
        "from 'uitheme-web/vue/bootstrap'"
      )
  );
  expect(await readFile(join(root, 'nuxt.config.ts'), 'utf8')).toContain(
    "'uitheme-web/nuxt'"
  );
  expect(
    JSON.parse(await readFile(join(root, 'package.json'), 'utf8')).dependencies
  ).toEqual({ 'uitheme-web': '^2.0.0' });
});

test('missing local controls and custom props stop all writes with actionable manual status', async () => {
  const source = `import { UIThemeProvider, UIThemeSwitcher } from 'uitheme-web/react';\nexport const App = () => <UIThemeProvider><UIThemeSwitcher duration={500} /></UIThemeProvider>;\n`;
  const manifest = '{"dependencies":{"uitheme-web":"^1.0.0"}}';
  const root = await fixture({ 'package.json': manifest, 'App.tsx': source });
  const errors: string[] = [];
  expect(
    await runMigration(['--cwd', root, '--yes'], {
      stderr: (text) => errors.push(text),
    })
  ).toBe(2);
  expect(errors.join('\n')).toMatch(/manual-required/);
  expect(errors.join('\n')).toMatch(/UIThemeSwitcher/);
  expect(errors.join('\n')).toMatch(/install uitheme-web@latest/i);
  expect(await readFile(join(root, 'package.json'), 'utf8')).toBe(manifest);
  expect(await readFile(join(root, 'App.tsx'), 'utf8')).toBe(source);
});

test('bare controls use verified installed controls and preserve local identifiers', async () => {
  const local = `export function ThemeSelector() { return null; }\n`;
  const source = `import { UIThemeProvider, UIThemeSwitcher as Switcher } from 'uitheme-web/react';\nexport const App = () => <UIThemeProvider><Switcher /></UIThemeProvider>;\n`;

  const root = await fixture({
    'package.json': '{"dependencies":{"uitheme-web":"^1.0.0"}}',
    'App.tsx': source,
    'components/ui/theme-selector.tsx': local,
    'uitheme.json': JSON.stringify({
      schemaVersion: 1,
      installed: {
        'theme-selector': {
          revision: 'a'.repeat(64),
          files: [
            {
              path: 'components/ui/theme-selector.tsx',
              hash: hash(local),
            },
          ],
        },
      },
    }),
  });

  expect(await runMigration(['--cwd', root, '--yes'], {})).toBe(0);
  const migrated = await readFile(join(root, 'App.tsx'), 'utf8');
  expect(migrated).toContain(
    `import { ThemeSelector as Switcher } from './components/ui/theme-selector';`
  );
  expect(migrated).toContain('<Switcher />');
  expect(migrated).not.toContain('UIThemeSwitcher');
  expect(
    await readFile(join(root, 'components/ui/theme-selector.tsx'), 'utf8')
  ).toBe(local);
});

test('--yes never accepts a modified installed control as a known mapping', async () => {
  const source = `import { UIThemeProvider, UIThemeSwitcher } from 'uitheme-web/react';\nexport const App = () => <UIThemeProvider><UIThemeSwitcher /></UIThemeProvider>;`;

  const root = await fixture({
    'package.json': '{}',
    'App.tsx': source,
    'components/ui/theme-selector.tsx': 'edited',
    'uitheme.json': JSON.stringify({
      schemaVersion: 1,
      installed: {
        'theme-selector': {
          revision: 'a'.repeat(64),
          files: [
            {
              path: 'components/ui/theme-selector.tsx',
              hash: hash('original'),
            },
          ],
        },
      },
    }),
  });

  expect(await runMigration(['--cwd', root, '--yes'], {})).toBe(2);
  expect(await readFile(join(root, 'App.tsx'), 'utf8')).toBe(source);
});
