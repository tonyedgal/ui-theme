import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { detectProject } from '../src/project.ts';

test('rejects ambiguous Vite and Nuxt 3 before writes; explicit cwd selects one app', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'uitheme-detect-'));

  try {
    await writeFile(
      join(cwd, 'package.json'),
      JSON.stringify({
        dependencies: {
          vite: '^7.0.0',
          react: '^19.0.0',
          vue: '^3.5.0',
          tailwindcss: '^4.0.0',
        },
      })
    );
    await mkdir(join(cwd, 'src'));
    await writeFile(join(cwd, 'src/style.css'), '@import "tailwindcss";');
    await assert.rejects(detectProject({ cwd }), /ambiguous/i);
    assert.equal(
      (await detectProject({ cwd, framework: 'vite-vue' })).base,
      'reka'
    );
    await writeFile(
      join(cwd, 'package.json'),
      JSON.stringify({
        dependencies: { nuxt: '^3.15.0', tailwindcss: '^4.0.0' },
      })
    );
    await assert.rejects(detectProject({ cwd }), /Nuxt 3/);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test('reads JSONC references, aliases and workspace package manager without executing configs', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'uitheme-workspace-'));

  try {
    await writeFile(
      join(cwd, 'package.json'),
      JSON.stringify({ packageManager: 'pnpm@9.0.0' })
    );
    const app = join(cwd, 'apps/site');
    await mkdir(join(app, 'src'), { recursive: true });
    await writeFile(
      join(app, 'package.json'),
      JSON.stringify({
        dependencies: { vite: '^7', vue: '^3.5', tailwindcss: '^4' },
      })
    );
    await writeFile(
      join(app, 'tsconfig.json'),
      '{"references":[{"path":"./tsconfig.app.json"}]}'
    );
    await writeFile(
      join(app, 'tsconfig.app.json'),
      '{// app\n"compilerOptions":{"baseUrl":".","paths":{"~/*":["./src/*"],},},}'
    );
    await writeFile(join(app, 'src/style.css'), '@import "tailwindcss";');
    const p = await detectProject({ cwd: app });
    assert.equal(p.aliasPrefix, '~');
    assert.equal(p.packageManager, 'pnpm');
    assert.equal(p.componentsDir, join(app, 'src/components/ui'));
    assert.equal(p.language, 'ts');
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test('flags override saved relative paths and preserve an explicit installed base', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'uitheme-config-'));

  try {
    await writeFile(
      join(cwd, 'package.json'),
      JSON.stringify({
        dependencies: { vite: '^7', react: '^19', tailwindcss: '^4' },
      })
    );
    await writeFile(join(cwd, 'styles.css'), '@import "tailwindcss";');
    await writeFile(
      join(cwd, 'uitheme.json'),
      JSON.stringify({
        schemaVersion: 1,
        framework: 'vite-react',
        base: 'radix',
        cssFile: 'styles.css',
        componentsDir: 'widgets',
        language: 'js',
      })
    );

    const p = await detectProject({
      cwd,
      componentsDir: 'controls',
      language: 'ts',
    });

    assert.equal(p.componentsDir, join(cwd, 'controls'));
    assert.equal(p.language, 'ts');
    assert.equal(p.base, 'radix');
    await assert.rejects(
      detectProject({ cwd, componentsDir: '../outside' }),
      /outside/
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test('resolves package-based tsconfig inheritance and baseUrl from the originating config', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'uitheme-extends-'));

  try {
    await mkdir(join(cwd, 'node_modules/@workspace/tsconfig'), {
      recursive: true,
    });
    await mkdir(join(cwd, 'src'), { recursive: true });
    await writeFile(
      join(cwd, 'package.json'),
      JSON.stringify({
        dependencies: { vite: '^7', react: '^19', tailwindcss: '^4' },
      })
    );
    await writeFile(join(cwd, 'src/style.css'), '@import "tailwindcss";');
    await writeFile(
      join(cwd, 'node_modules/@workspace/tsconfig/package.json'),
      JSON.stringify({ name: '@workspace/tsconfig', tsconfig: 'base.json' })
    );
    await writeFile(
      join(cwd, 'node_modules/@workspace/tsconfig/base.json'),
      JSON.stringify({
        compilerOptions: { baseUrl: '../../../src', paths: { '~/*': ['./*'] } },
      })
    );
    await writeFile(
      join(cwd, 'tsconfig.json'),
      JSON.stringify({ extends: '@workspace/tsconfig' })
    );
    const profile = await detectProject({ cwd });
    assert.equal(profile.aliasPrefix, '~');
    assert.equal(profile.componentsDir, join(cwd, 'src/components/ui'));
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test('rejects malformed saved enum, hash and absolute persisted paths', async () => {
  const { readConfig } = await import('../src/config.ts');
  const cwd = await mkdtemp(join(tmpdir(), 'uitheme-invalid-'));

  try {
    for (const value of [
      { schemaVersion: 1, base: 'hostile' },
      { schemaVersion: 1, cssFile: '/etc/passwd' },
      {
        schemaVersion: 1,
        installed: {
          x: { revision: 'a'.repeat(64), files: [{ path: 'x', hash: 'bad' }] },
        },
      },
    ]) {
      await writeFile(join(cwd, 'uitheme.json'), JSON.stringify(value));
      await assert.rejects(readConfig(cwd), /invalid/i);
    }
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test('explicit shared component directories stay within the detected workspace', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'uitheme-shared-'));

  try {
    const app = join(cwd, 'apps/site');
    await mkdir(join(app, 'src'), { recursive: true });
    await writeFile(
      join(cwd, 'package.json'),
      JSON.stringify({
        packageManager: 'pnpm@9.0.0',
        workspaces: ['apps/*', 'packages/*'],
      })
    );
    await writeFile(
      join(app, 'package.json'),
      JSON.stringify({
        dependencies: { vite: '^7', react: '^19', tailwindcss: '^4' },
      })
    );
    await writeFile(join(app, 'src/style.css'), '@import "tailwindcss";');

    const profile = await detectProject({
      cwd: app,
      componentsDir: '../../packages/ui',
    });

    assert.equal(profile.componentsDir, join(cwd, 'packages/ui'));
    const { writeConfig, readConfig } = await import('../src/config.ts');
    await writeConfig(profile);
    assert.equal((await readConfig(app))?.componentsDir, '../../packages/ui');
    await assert.rejects(
      detectProject({ cwd: app, componentsDir: '../../../escape' }),
      /outside/
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test('detects the React base from installed primitives, then the shadcn style', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'uitheme-base-'));

  const detect = async (primitives: Record<string, string>, style?: string) => {
    await writeFile(
      join(cwd, 'package.json'),
      JSON.stringify({
        dependencies: {
          vite: '^7',
          react: '^19',
          tailwindcss: '^4',
          ...primitives,
        },
      })
    );
    await rm(join(cwd, 'components.json'), { force: true });

    if (style)
      await writeFile(
        join(cwd, 'components.json'),
        JSON.stringify({ style, tailwind: { css: 'styles.css' } })
      );

    return (await detectProject({ cwd })).base;
  };

  try {
    await writeFile(join(cwd, 'styles.css'), '@import "tailwindcss";');

    assert.equal(await detect({}), 'base-ui');
    assert.equal(await detect({ 'radix-ui': '^1.4.3' }), 'radix');
    assert.equal(await detect({ '@radix-ui/react-slot': '^1' }), 'radix');
    assert.equal(await detect({ '@base-ui/react': '^1' }), 'base-ui');

    // the installed primitive wins over the style
    assert.equal(await detect({ 'radix-ui': '^1' }, 'base-nova'), 'radix');

    assert.equal(await detect({}, 'new-york'), 'radix');
    assert.equal(await detect({}, 'base-vega'), 'base-ui');
    assert.equal(await detect({}, 'aria-nova'), 'base-ui');
    assert.equal(
      await detect({ 'radix-ui': '^1', '@base-ui/react': '^1' }, 'base-nova'),
      'base-ui'
    );

    // an explicit base still wins over detection
    assert.equal((await detectProject({ cwd, base: 'radix' })).base, 'radix');
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
