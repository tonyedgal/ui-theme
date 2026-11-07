import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRegistry, javascriptSource, shadcnStyles } from '../src/build.ts';
import {
  mkdtemp,
  mkdir,
  writeFile,
  rm,
  readFile,
  readdir,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('Vue JavaScript variants preserve public prop declarations and typed emits', async () => {
  const js = await javascriptSource(
    '<script setup lang="ts">\nconst props=defineProps<{label?:string}>();\nconst emit=defineEmits<{change:[value:string]}>();\n</script>\n<template><button>{{props.label}}</button></template>',
    'test.vue'
  );

  assert.ok(!js.includes('lang="ts"'));
  assert.match(js, /label/);
  assert.match(js, /String/);
  assert.match(js, /change/);
  assert.ok(!js.includes('defineProps<'));
});

test('builder rejects incomplete sources instead of emitting placeholders', async () => {
  const root = await mkdtemp(join(tmpdir(), 'uitheme-registry-'));

  try {
    await assert.rejects(
      buildRegistry({ sourceDir: root, outDir: join(root, 'out') }),
      /missing|ENOENT|incomplete/i
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('builds all 84 variants reproducibly from sources with only selected base dependencies', async () => {
  const root = await mkdtemp(join(tmpdir(), 'uitheme-registry-all-'));

  try {
    const sourceDir = join(root, 'templates'),
      outDir = join(root, 'dist');

    for (const [framework, base, dep] of [
      ['react', 'base-ui', '@base-ui/react'],
      ['react', 'radix', 'radix-ui@^1.4.3'],
      ['vue', 'reka', 'reka-ui'],
    ]) {
      const dir = join(sourceDir, framework, base);
      await mkdir(dir, { recursive: true });

      const components = Object.fromEntries(
        [
          'theme-toggle',
          'theme-selector',
          'color-theme-selector',
          'icon-theme-toggle',
          'theme-switcher',
          'theme-disclosure',
          'color-theme-disclosure',
        ].map((name) => [
          name,
          {
            title: name,
            description: name,
            files: [
              {
                source: 'control.ts',
                path: `${name}.ts`,
                target: `components/${name}.ts`,
              },
            ],
          },
        ])
      );

      await writeFile(
        join(dir, 'metadata.json'),
        JSON.stringify({
          dependencies: [dep, 'tailwind-merge@{{tailwindMergeVersion}}'],
          compatibleDependencies: {
            'tailwind-merge': '>=2.0.0 <4.0.0',
            'not-installed': '^1.0.0',
          },
          components,
        })
      );
      await writeFile(
        join(dir, 'control.ts'),
        'export const label: string = "Theme";'
      );
    }

    const first = await buildRegistry({ sourceDir, outDir }),
      second = await buildRegistry({ sourceDir, outDir });

    assert.equal(first.revision, second.revision);
    assert.equal(first.index.items.length, 84);

    const react = first.index.items.find(
      (i) =>
        i.meta.uiTheme.base === 'radix' &&
        i.meta.uiTheme.tailwind === 3 &&
        i.meta.uiTheme.language === 'js'
    );

    assert.ok(react.dependencies.includes('radix-ui@^1.4.3'));
    assert.ok(!react.dependencies.includes('reka-ui'));
    assert.ok(react.dependencies.includes('tailwind-merge@^2.6.0'));
    // only ranges for packages that the item installs
    assert.deepEqual(react.meta.uiTheme.compatibleDependencies, {
      'tailwind-merge': '>=2.0.0 <4.0.0',
    });
    assert.ok(!react.files[0].content.includes(': string'));
    assert.deepEqual(
      JSON.parse(await readFile(join(outDir, 'manifest.json'), 'utf8')),
      first.manifest
    );

    const folders = (await readdir(outDir)).sort();

    assert.deepEqual(
      folders,
      ['manifest.json', 'v1', ...shadcnStyles.keys()].sort()
    );

    for (const [style, base] of shadcnStyles) {
      const files = await readdir(join(outDir, style));
      assert.equal(files.length, 8, style);

      // shadcn search reads the index; the directory forbids file content in it
      const index = JSON.parse(
        await readFile(join(outDir, style, 'registry.json'), 'utf8')
      );

      assert.equal(index.name, 'uitheme');
      assert.deepEqual(
        index.items.map((item) => `${item.name}.json`).sort(),
        files.filter((file) => file !== 'registry.json').sort(),
        style
      );
      assert.ok(
        index.items.every((item) =>
          item.files.every((file) => !('content' in file))
        ),
        style
      );

      const record = JSON.parse(
        await readFile(join(outDir, style, 'icon-theme-toggle.json'), 'utf8')
      );

      const source = first.index.items.find(
        (i) =>
          i.name === 'icon-theme-toggle' &&
          i.meta.uiTheme.framework === 'react' &&
          i.meta.uiTheme.base === base &&
          i.meta.uiTheme.tailwind === 4 &&
          i.meta.uiTheme.language === 'ts'
      );

      assert.equal(
        record.$schema,
        'https://ui.shadcn.com/schema/registry-item.json'
      );
      // shadcn overwrites declared versions, so shared libraries are bare
      assert.deepEqual(
        record.dependencies.toSorted(),
        [
          base === 'radix' ? 'radix-ui' : '@base-ui/react',
          'tailwind-merge',
          'uitheme-web@^2.0.0',
        ].toSorted(),
        style
      );
      assert.ok(record.registryDependencies.includes('utils'));
      assert.deepEqual(record.files, source.files);
      assert.ok(
        record.registryDependencies
          .filter((url) => url !== 'utils')
          .every((url) =>
            url.startsWith(`https://www.ui-theme.dev/r/${style}/`)
          ),
        style
      );
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('generated JavaScript SFC renders setup bindings and prop updates through Vue compiler', async () => {
  const { parse, compileScript, compileTemplate } =
    await import('@vue/compiler-sfc');

  const { createSSRApp } = await import('vue');
  const { renderToString } = await import('vue/server-renderer');
  const { createRequire } = await import('node:module');
  const { pathToFileURL } = await import('node:url');

  const js = await javascriptSource(
    '<script setup lang="ts">const props=withDefaults(defineProps<{label?:string}>(),{label:"Default"}); const suffix="!";</script><template><button>{{ props.label }}{{ suffix }}</button></template>',
    'Render.vue'
  );

  const { descriptor } = parse(js);

  let script = compileScript(descriptor, {
    id: 'render-test',
    inlineTemplate: true,
  }).content;

  if (!descriptor.scriptSetup) {
    const result = compileTemplate({
      source: descriptor.template!.content,
      id: 'render-test',
      filename: 'Render.vue',
    });

    script =
      script.replace('export default', 'const component =') +
      '\n' +
      result.code.replace('export function render', 'function render') +
      '\ncomponent.render=render; export default component;';
  }

  const req = createRequire(import.meta.url);
  script = script.replaceAll(
    /from ["']vue["']/g,
    `from ${JSON.stringify(pathToFileURL(req.resolve('vue/dist/vue.runtime.esm-bundler.js')).href)}`
  );

  const component = (
    await import(
      `data:text/javascript;base64,${Buffer.from(script).toString('base64')}`
    )
  ).default;

  assert.equal(
    await renderToString(createSSRApp(component, { label: 'Changed' })),
    '<button>Changed!</button>'
  );
  assert.equal(
    await renderToString(createSSRApp(component)),
    '<button>Default!</button>'
  );
});

test('revision identifies serialized records and origin, while frozen releases survive a clean build', async () => {
  const root = await mkdtemp(join(tmpdir(), 'uitheme-releases-'));

  try {
    const { snapshotRegistry } = await import('../src/build.ts');
    const sourceDir = new URL('../src/templates/', import.meta.url).pathname;
    const releaseDir = join(root, 'releases');

    const first = await buildRegistry({
      sourceDir,
      outDir: join(root, 'first'),
      releaseDir,
      origin: 'https://first.example/r',
    });

    const second = await buildRegistry({
      sourceDir,
      outDir: join(root, 'second'),
      releaseDir,
      origin: 'https://second.example/r',
    });

    assert.notEqual(first.revision, second.revision);

    for (const item of first.index.items) {
      const meta = item.meta.uiTheme;

      const record = JSON.parse(
        await readFile(
          join(
            root,
            'first',
            `v1/${first.revision}/${meta.framework}/${meta.base}/tw${meta.tailwind}/${meta.language}/${meta.component}.json`
          ),
          'utf8'
        )
      );

      assert.deepEqual(record, item);
      assert.equal(meta.revision, first.revision);

      for (const dependency of item.registryDependencies)
        assert.ok(dependency.includes(`/v1/${first.revision}/`));
    }

    await snapshotRegistry({ outDir: join(root, 'first'), releaseDir });

    const clean = await buildRegistry({
      sourceDir,
      outDir: join(root, 'clean'),
      releaseDir,
      origin: 'https://second.example/r',
    });

    assert.equal(clean.revision, second.revision);
    assert.equal(
      await readFile(
        join(root, 'clean', `v1/${first.revision}/registry.json`),
        'utf8'
      ),
      await readFile(
        join(root, 'first', `v1/${first.revision}/registry.json`),
        'utf8'
      )
    );
    await writeFile(
      join(root, 'first', `v1/${first.revision}/registry.json`),
      'changed released index'
    );
    await assert.rejects(
      snapshotRegistry({ outDir: join(root, 'first'), releaseDir }),
      /immutable|collision/i
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('serves only shadcn styles that have a matching base', () => {
  assert.equal(shadcnStyles.size, 19);
  assert.equal(shadcnStyles.get('new-york-v4'), 'radix');
  assert.equal(shadcnStyles.get('new-york'), 'radix');
  assert.equal(shadcnStyles.get('radix-nova'), 'radix');
  assert.equal(shadcnStyles.get('base-vega'), 'base-ui');

  for (const style of ['aria-nova', 'aria-vega', 'unknown'])
    assert.equal(shadcnStyles.has(style), false, style);
});
