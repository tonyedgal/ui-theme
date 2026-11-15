// A base added only to the manifest reaches the registry build and the CLI.
// The fake base supports React and Vue and has no shadcn style.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRegistry, controls, shadcnStylesFor } from '../src/build.ts';
import {
  baseFlagHint,
  baseManifest,
  setBaseManifest,
  type BaseDefinition,
} from '../../ui-theme-cli/src/bases.ts';
import { runCli } from '../../ui-theme-cli/src/commands/index.ts';
import { detectProject } from '../../ui-theme-cli/src/project.ts';

const templates = fileURLToPath(new URL('../src/templates', import.meta.url));

const fake: BaseDefinition = {
  id: 'fake-kit',
  displayName: 'Fake Kit',
  shortName: 'Fake',
  frameworks: {
    react: { templates: 'react/fake-kit', packages: ['@fake-kit/react'] },
    vue: { templates: 'vue/fake-kit', packages: ['@fake-kit/vue'] },
  },
};

const bases = [...baseManifest(), fake];

async function app(root: string, dependencies: Record<string, string>) {
  await mkdir(join(root, 'src'), { recursive: true });
  await writeFile(
    join(root, 'package.json'),
    JSON.stringify({
      name: 'consumer',
      dependencies: { ...dependencies, tailwindcss: '4.1.0' },
    })
  );
  await writeFile(join(root, 'src/style.css'), '@import "tailwindcss";\n');

  return root;
}

test('the registry build emits a base that only the manifest adds', async () => {
  // The Vue JavaScript transform resolves imports from the template folder,
  // so the copy stays inside this package.
  const cache = fileURLToPath(
    new URL('../node_modules/.cache/', import.meta.url)
  );

  await mkdir(cache, { recursive: true });
  const root = await mkdtemp(join(cache, 'uitheme-manifest-'));

  try {
    const sourceDir = join(root, 'templates');
    await cp(templates, sourceDir, { recursive: true });
    // The fake base reuses existing templates.
    await cp(
      join(templates, 'react/base-ui'),
      join(sourceDir, 'react/fake-kit'),
      {
        recursive: true,
      }
    );
    await cp(join(templates, 'vue/reka'), join(sourceDir, 'vue/fake-kit'), {
      recursive: true,
    });

    const result = await buildRegistry({
      sourceDir,
      outDir: join(root, 'dist'),
      releaseDir: join(root, 'no-releases'),
      bases,
    });

    for (const framework of ['react', 'vue'])
      assert.equal(
        result.index.items.filter(
          (item) =>
            item.meta.uiTheme.base === 'fake-kit' &&
            item.meta.uiTheme.framework === framework
        ).length,
        controls.length * 2 * 2,
        framework
      );

    // No shadcn style selects the fake base.
    assert.ok(![...shadcnStylesFor(bases).values()].includes('fake-kit'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('the CLI accepts, lists, and detects a base that only the manifest adds', async () => {
  const root = await mkdtemp(join(tmpdir(), 'uitheme-manifest-cli-'));
  const restore = setBaseManifest(bases);

  try {
    const output: string[] = [];
    await runCli(['--help'], { stdout: (line) => output.push(line) });
    assert.ok(
      output
        .join('\n')
        .includes(`--base <${bases.map((base) => base.id).join('|')}>`)
    );

    const react = await app(join(root, 'react'), {
      vite: '7',
      react: '19',
      '@fake-kit/react': '1.0.0',
    });

    const vue = await app(join(root, 'vue'), {
      vite: '7',
      vue: '3',
      '@fake-kit/vue': '1.0.0',
    });

    assert.equal((await detectProject({ cwd: react })).base, 'fake-kit');
    assert.equal((await detectProject({ cwd: vue })).base, 'fake-kit');

    const plain = await app(join(root, 'plain-vue'), { vite: '7', vue: '3' });
    assert.equal((await detectProject({ cwd: plain })).base, 'reka');

    const info: string[] = [];
    assert.equal(
      await runCli(['info', '--cwd', plain, '--base', 'fake-kit'], {
        stdout: (line) => info.push(line),
      }),
      0
    );
    assert.equal(JSON.parse(info.join('\n')).base, 'fake-kit');

    // Vue now has two bases, so init asks which one to use.
    const prompts: [string, string[]][] = [];
    await runCli(['init', '--cwd', plain], {
      stdout: () => {},
      stderr: () => {},
      select: async (message, choices) => {
        prompts.push([message, choices]);
        throw new Error('stop after the prompt');
      },
    });
    assert.deepEqual(prompts, [
      ['Select the Vue component base', ['reka', 'ui-sdk', 'fake-kit']],
    ]);

    const errors: string[] = [];
    await runCli(['info', '--cwd', react, '--base', 'reka'], {
      stderr: (line) => errors.push(line),
    });
    assert.ok(errors.join('\n').includes(`Use ${baseFlagHint('react')}.`));
  } finally {
    restore();
    await rm(root, { recursive: true, force: true });
  }
});
