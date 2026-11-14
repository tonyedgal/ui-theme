// A base can require an app package version and a CSS layer. The fake base
// reaches the CLI through the manifest alone.
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  baseManifest,
  setBaseManifest,
  unmetRequirement,
  type BaseDefinition,
} from '../src/bases';
import { runCli } from '../src/commands/index';
import { declareLayer } from '../src/tailwind/index';
import type { RegistryGraph } from '../src/types';

const fake: BaseDefinition = {
  id: 'fake-kit',
  displayName: 'Fake Kit',
  shortName: 'Fake',
  frameworks: {
    react: {
      templates: 'react/fake-kit',
      packages: ['@fake-kit/react'],
      requires: {
        package: 'fake-peer',
        range: '>=19',
        note: 'Update fake-peer first.',
      },
      css: { layer: 'fake-kit' },
    },
  },
};

const roots: string[] = [];

let restore: () => void;

beforeEach(() => {
  restore = setBaseManifest([...baseManifest(), fake]);
});

afterEach(async () => {
  restore();
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
  );
});

const message = (found: string) =>
  `Fake Kit requires fake-peer >=19; found ${found}. Update fake-peer first.`;

describe('base requirements', () => {
  it.each([
    [{ installed: '19.1.0' }, undefined],
    [{ installed: '19.0.0-rc.1' }, undefined],
    [{ installed: '18.3.1', declared: '^19.0.0' }, message('fake-peer 18.3.1')],
    [{ declared: '^19.0.0' }, undefined],
    [{ declared: '^18.2.0' }, message('fake-peer ^18.2.0')],
    [{ declared: '^18 || ^19' }, undefined],
    [{ declared: 'workspace:*' }, undefined],
    [{ declared: 'workspace:^18.0.0' }, message('fake-peer ^18.0.0')],
    [{ declared: 'latest' }, undefined],
    [{}, message('no fake-peer')],
  ])('%j gives %s', (app, expected) => {
    expect(unmetRequirement('fake-kit', 'react', app)).toBe(expected);
  });

  it('ignores a base without requirements', () => {
    expect(unmetRequirement('base-ui', 'react', {})).toBeUndefined();
  });
});

describe('base CSS layers', () => {
  it.each([
    ['@import "tailwindcss";\n', '@layer fake-kit;\n@import "tailwindcss";\n'],
    [
      '@tailwind base;\n@tailwind components;\n',
      '@layer fake-kit;\n@tailwind base;\n@tailwind components;\n',
    ],
    [
      '@charset "utf-8";\n@import "tailwindcss";\n',
      '@charset "utf-8";\n@layer fake-kit;\n@import "tailwindcss";\n',
    ],
    [
      '@layer theme, base;\n@import "tailwindcss";\n',
      '@layer fake-kit;\n@layer theme, base;\n@import "tailwindcss";\n',
    ],
    ['@layer base, fake-kit;\n', '@layer base, fake-kit;\n'],
  ])('declares the layer first in %j', (source, expected) => {
    const once = declareLayer(source, 'fake-kit');

    expect(once).toBe(expected);
    expect(declareLayer(once, 'fake-kit')).toBe(once);
  });
});

async function app(peer?: string) {
  const cwd = await mkdtemp(join(tmpdir(), 'uitheme-base-'));
  roots.push(cwd);
  await mkdir(join(cwd, 'src'), { recursive: true });
  await writeFile(
    join(cwd, 'package.json'),
    JSON.stringify({
      name: 'consumer',
      dependencies: {
        vite: '7',
        react: '19',
        tailwindcss: '4.1.0',
        '@fake-kit/react': '1.0.0',
      },
    })
  );
  await writeFile(join(cwd, 'src/style.css'), '@import "tailwindcss";\n');
  await writeFile(
    join(cwd, 'tsconfig.json'),
    '{"compilerOptions":{"paths":{"@/*":["./src/*"]}}}'
  );
  await writeFile(
    join(cwd, 'src/main.tsx'),
    `import {createRoot} from 'react-dom/client';\nimport App from './App';\ncreateRoot(document.getElementById('root')!).render(<App />);`
  );

  for (const [name, version] of [
    ['uitheme-web', '2.0.0'],
    ...(peer ? [['fake-peer', peer]] : []),
  ]) {
    await mkdir(join(cwd, 'node_modules', name), { recursive: true });
    await writeFile(
      join(cwd, 'node_modules', name, 'package.json'),
      JSON.stringify({ name, version })
    );
  }

  return cwd;
}

function io() {
  let output = '';

  const write = (text: string) => {
    output += text + '\n';
  };

  return { stdout: write, stderr: write, output: () => output };
}

function registry(base: string) {
  const graph: RegistryGraph = {
    manifest: {
      schemaVersion: 1,
      stable: {
        revision: 'abc12345',
        index: '/r/v1/abc12345/registry.json',
        webVersion: '^2.0.0',
        cliVersion: '^1.0.0',
      },
    },
    items: [
      {
        name: 'theme-toggle',
        type: 'registry:ui',
        title: 'Theme toggle',
        description: '',
        dependencies: [],
        registryDependencies: [],
        files: [
          {
            path: 'theme-toggle.tsx',
            content: 'export const ThemeToggle = () => null;',
            type: 'registry:ui',
          },
        ],
        meta: {
          uiTheme: {
            schemaVersion: 1,
            revision: 'abc12345',
            component: 'theme-toggle',
            framework: 'react',
            base,
            tailwind: 4,
            language: 'ts',
            webVersion: '^2.0.0',
            cliVersion: '^1.0.0',
          },
        },
      },
    ],
  };

  return {
    manifest: async () => graph.manifest,
    list: async () => graph.items,
    resolve: async () => graph,
  };
}

const runInstall = async () => {};

describe('CLI with a base that has requirements', () => {
  it('refuses init, add and diff before any write when the requirement fails', async () => {
    for (const peer of ['18.3.1', undefined]) {
      const cwd = await app(peer);
      const css = await readFile(join(cwd, 'src/style.css'), 'utf8');

      for (const args of [
        ['init'],
        ['add', 'theme-toggle'],
        ['diff', 'theme-toggle'],
      ]) {
        const out = io();

        expect(
          await runCli([...args, '--cwd', cwd, '--yes'], {
            ...out,
            runInstall,
            registry: registry('fake-kit'),
          })
        ).toBe(1);
        expect(out.output()).toContain(
          message(peer ? `fake-peer ${peer}` : 'no fake-peer')
        );
      }

      expect(await readFile(join(cwd, 'src/style.css'), 'utf8')).toBe(css);
      await expect(readFile(join(cwd, 'uitheme.json'))).rejects.toThrow();
    }
  });

  it('reports the unmet requirement in info without failing', async () => {
    const cwd = await app('18.3.1'),
      out = io();

    expect(await runCli(['info', '--cwd', cwd], out)).toBe(0);
    expect(JSON.parse(out.output())).toMatchObject({
      base: 'fake-kit',
      unmetRequirement: message('fake-peer 18.3.1'),
    });
  });

  it('declares the layer once through init and add', async () => {
    const cwd = await app('19.0.0');

    expect(
      await runCli(['init', '--cwd', cwd, '--yes'], { ...io(), runInstall })
    ).toBe(0);

    const css = await readFile(join(cwd, 'src/style.css'), 'utf8');
    expect(css.startsWith('@layer fake-kit;\n@import "tailwindcss";')).toBe(
      true
    );

    await writeFile(
      join(cwd, 'src/style.css'),
      css.replace('@layer fake-kit;\n', '')
    );

    const out = io();
    expect(
      await runCli(['add', 'theme-toggle', '--cwd', cwd, '--dry-run'], {
        ...out,
        registry: registry('fake-kit'),
      })
    ).toBe(0);
    expect(out.output()).toContain('src/style.css');

    expect(
      await runCli(['add', 'theme-toggle', '--cwd', cwd, '--yes'], {
        ...io(),
        runInstall,
        registry: registry('fake-kit'),
      })
    ).toBe(0);
    expect(await readFile(join(cwd, 'src/style.css'), 'utf8')).toBe(css);

    const again = io();
    expect(
      await runCli(['diff', 'theme-toggle', '--cwd', cwd], {
        ...again,
        registry: registry('fake-kit'),
      })
    ).toBe(0);
    expect(again.output()).not.toContain('style.css');
  });

  it('leaves the stylesheet of a base without a layer alone', async () => {
    const cwd = await app();

    expect(
      await runCli(['init', '--cwd', cwd, '--base', 'base-ui', '--yes'], {
        ...io(),
        runInstall,
      })
    ).toBe(0);

    const css = await readFile(join(cwd, 'src/style.css'), 'utf8');
    expect(css).not.toContain('@layer');

    expect(
      await runCli(['add', 'theme-toggle', '--cwd', cwd, '--yes'], {
        ...io(),
        runInstall,
        registry: registry('base-ui'),
      })
    ).toBe(0);
    expect(await readFile(join(cwd, 'src/style.css'), 'utf8')).toBe(css);
  });
});
