import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { selectChecks } from '../validation-plan.mjs';
import { selectReleaseVersion } from '../release-version.mjs';

test('native changes do not select browser suites', () => {
  const plan = selectChecks(['packages/ui-theme-rn/src/provider.tsx']);
  assert.deepEqual(plan.packages, ['uitheme-rn']);
  assert.deepEqual(plan.browsers, []);
});

test('shared core changes protect both bindings and the website', () => {
  const plan = selectChecks(['packages/ui-theme/src/core/animations.ts']);
  assert.deepEqual(plan.packages, ['uitheme-web']);
  assert.deepEqual(plan.browsers, ['vue', 'web', 'website']);
  assert.equal(plan.website, true);
});

test('example app changes select no checks', () => {
  for (const ci of [false, true]) {
    const plan = selectChecks(
      [
        'apps/examples/example-nuxt/app/app.vue',
        'apps/examples/vue-theme-demo/src/ThemeDemo.vue',
      ],
      { ci }
    );

    assert.deepEqual(plan.packages, []);
    assert.deepEqual(plan.browsers, []);
    assert.deepEqual(plan.consumers, []);
    assert.equal(plan.website, false);
    assert.equal(plan.tooling, false);
  }
});

test('Vue browser fixtures select the Vue browser suite', () => {
  const plan = selectChecks([
    'packages/ui-theme/tests/vue-browser/fixtures/shared/ThemeHarness.vue',
  ]);

  assert.deepEqual(plan.packages, ['uitheme-web']);
  assert.deepEqual(plan.browsers, ['vue']);
});

test('CI global changes protect products without running browsers', () => {
  const plan = selectChecks(['pnpm-lock.yaml'], { ci: true });
  assert.equal(plan.packages.length, 4);
  assert.equal(plan.website, true);
  assert.deepEqual(plan.browsers, []);
});

test('documentation does not select product builds', () => {
  const plan = selectChecks(['docs/ci.md', 'README.md']);
  assert.deepEqual(plan.packages, []);
  assert.equal(plan.website, false);
});

test('Nuxt public configuration selects the independent consumer', () => {
  const plan = selectChecks(['packages/ui-theme/src/nuxt.ts']);
  assert.deepEqual(plan.consumers, ['registry', 'vue']);
  assert.ok(plan.browsers.includes('vue'));
});

test('unknown runtime paths fail conservatively to full local validation', () => {
  const plan = selectChecks(['new-runtime/bridge.ts']);
  assert.equal(plan.packages.length, 4);
  assert.equal(plan.consumers.length, 3);
});

test('website content selects its production browser smoke', () => {
  const plan = selectChecks(['apps/ui-theme-web/content/docs/index.mdx']);
  assert.equal(plan.website, true);
  assert.deepEqual(plan.browsers, ['website']);
});

test('staged snapshots reject broken staged code despite an unstaged repair', () => {
  snapshotCheck('broken', 'repaired', false);
});

test('staged snapshots ignore unstaged breakage and preserve the index', () => {
  snapshotCheck('repaired', 'broken', true);
});

function snapshotCheck(staged, working, passes) {
  const root = mkdtempSync(join(tmpdir(), 'uitheme-hook-test-'));

  const git = (...args) =>
    execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();

  try {
    git('init', '-q');
    git('config', 'user.name', 'Validation test');
    git('config', 'user.email', 'validation@example.invalid');
    mkdirSync(join(root, 'scripts'), { recursive: true });

    for (const file of [
      'validation-plan.mjs',
      'validate.mjs',
      'test-staged.mjs',
    ]) {
      copyFileSync(resolve('scripts', file), join(root, 'scripts', file));
    }

    mkdirSync(join(root, 'packages/ui-theme-rn/src'), { recursive: true });
    writeFileSync(join(root, 'package.json'), '{"private":true}');
    writeFileSync(join(root, 'pnpm-lock.yaml'), 'test lock');
    writeFileSync(join(root, 'packages/ui-theme-rn/src/provider.tsx'), 'base');
    git('add', '.');
    git('commit', '-qm', 'fixture');
    const source = join(root, 'packages/ui-theme-rn/src/provider.tsx');
    writeFileSync(source, staged);
    git('add', 'packages/ui-theme-rn/src/provider.tsx');
    writeFileSync(source, working);
    const tree = git('write-tree');
    const bin = join(root, 'test-bin');
    mkdirSync(bin);
    const output = join(root, 'github-output.txt');
    writeFileSync(output, 'release=true\n');
    writeFileSync(
      join(bin, 'pnpm'),
      `#!/bin/sh\nif [ "$1" = install ]; then exit 0; fi\nif [ "$(cat packages/ui-theme-rn/src/provider.tsx)" = broken ]; then exit 17; fi\nexit 0\n`,
      { mode: 0o755 }
    );

    const result = spawnSync(process.execPath, ['scripts/test-staged.mjs'], {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        GITHUB_OUTPUT: output,
        PATH: `${bin}:${process.env.PATH}`,
      },
    });

    assert.equal(result.status === 0, passes, result.stdout + result.stderr);
    assert.equal(readFileSync(output, 'utf8'), 'release=true\n');
    assert.equal(readFileSync(source, 'utf8'), working);
    assert.equal(git('write-tree'), tree);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('registry source protects schema, installer and website in CI', () => {
  const plan = selectChecks(
    ['packages/ui-theme-registry/src/templates/vue/reka/theme-toggle.vue'],
    { ci: true }
  );

  assert.deepEqual(plan.packages, ['@ui-theme/registry', 'uitheme-cli']);
  assert.equal(plan.website, true);
  assert.deepEqual(plan.browsers, []);
});

test('CLI source protects installer without rebuilding mobile or website', () => {
  const plan = selectChecks(['packages/ui-theme-cli/src/registry.ts'], {
    ci: true,
  });

  assert.deepEqual(plan.packages, ['uitheme-cli']);
  assert.equal(plan.website, false);
});

test('registry variants and CLI changes select the emitted consumer locally', () => {
  for (const path of [
    'packages/ui-theme-registry/src/build.ts',
    'packages/ui-theme-cli/src/install/index.ts',
  ]) {
    assert.ok(selectChecks([path]).consumers.includes('registry'));
    assert.deepEqual(selectChecks([path], { ci: true }).consumers, []);
  }
});

test('release consumers use related changesets and retain current versions after release', () => {
  assert.equal(
    selectReleaseVersion('uitheme-web', '1.2.0', [
      { name: 'uitheme-web', type: 'major', newVersion: '2.0.0' },
    ]),
    '2.0.0'
  );
  assert.equal(selectReleaseVersion('uitheme-web', '2.0.1', []), '2.0.1');
  assert.equal(
    selectReleaseVersion('uitheme-web', '2.0.1', [
      { name: 'uitheme-rn', type: 'major', newVersion: '2.0.0' },
    ]),
    '2.0.1'
  );
  assert.equal(
    selectReleaseVersion('uitheme-web', '2.0.1', [
      { name: 'uitheme-web', type: 'none', newVersion: '9.0.0' },
    ]),
    '2.0.1'
  );
  assert.throws(
    () =>
      selectReleaseVersion('uitheme-web', '2.0.1', [
        { name: 'uitheme-web', type: 'minor' },
      ]),
    /version/i
  );
});
