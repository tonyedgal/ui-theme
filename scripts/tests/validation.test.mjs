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

test('native changes do not select browser suites', () => {
  const plan = selectChecks(['packages/ui-theme-rn/src/provider.tsx']);
  assert.deepEqual(plan.packages, ['uitheme-rn']);
  assert.deepEqual(plan.browsers, []);
  assert.equal(plan.examples.length, 3);
});

test('shared core changes protect both bindings and the website', () => {
  const plan = selectChecks(['packages/ui-theme/src/core/animations.ts']);
  assert.deepEqual(plan.packages, ['uitheme-vue', 'uitheme-web']);
  assert.deepEqual(plan.browsers, ['vue', 'web', 'website']);
  assert.equal(plan.website, true);
});

test('example-only changes select no product CI work', () => {
  const plan = selectChecks(['apps/examples/example-nuxt/app/app.vue'], {
    ci: true,
  });

  assert.deepEqual(plan.packages, []);
  assert.deepEqual(plan.examples, []);
  assert.deepEqual(plan.browsers, []);
  assert.equal(plan.website, false);
});

test('CI global changes protect products without running examples or browsers', () => {
  const plan = selectChecks(['pnpm-lock.yaml'], { ci: true });
  assert.equal(plan.packages.length, 3);
  assert.equal(plan.website, true);
  assert.deepEqual(plan.examples, []);
  assert.deepEqual(plan.browsers, []);
});

test('documentation does not select product builds', () => {
  const plan = selectChecks(['docs/ci.md', 'README.md']);
  assert.deepEqual(plan.packages, []);
  assert.equal(plan.website, false);
});

test('Nuxt public configuration selects the independent consumer', () => {
  const plan = selectChecks(['packages/ui-theme-vue/src/nuxt.ts']);
  assert.deepEqual(plan.consumers, ['vue']);
  assert.ok(plan.browsers.includes('vue'));
});

test('unknown runtime paths fail conservatively to full local validation', () => {
  const plan = selectChecks(['new-runtime/bridge.ts']);
  assert.equal(plan.packages.length, 3);
  assert.equal(plan.examples.length, 8);
  assert.equal(plan.consumers.length, 2);
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
    writeFileSync(
      join(bin, 'pnpm'),
      `#!/bin/sh\nif [ "$1" = install ]; then exit 0; fi\nif [ "$(cat packages/ui-theme-rn/src/provider.tsx)" = broken ]; then exit 17; fi\nexit 0\n`,
      { mode: 0o755 }
    );

    const result = spawnSync(process.execPath, ['scripts/test-staged.mjs'], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
    });

    assert.equal(result.status === 0, passes, result.stdout + result.stderr);
    assert.equal(readFileSync(source, 'utf8'), working);
    assert.equal(git('write-tree'), tree);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
