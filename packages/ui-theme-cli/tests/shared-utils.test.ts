import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { planSharedUtils } from '../src/install/shared-utils';
import type { ProjectProfile } from '../src/types';

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
  );
});

// no node_modules: the check must not depend on installed packages
async function project(files: Record<string, string>) {
  const cwd = await mkdtemp(join(tmpdir(), 'uitheme-utils-'));
  roots.push(cwd);
  files = {
    'package.json': '{"name":"app"}',
    'tsconfig.json': '{"compilerOptions":{"paths":{"@/*":["./src/*"]}}}',
    ...files,
  };

  for (const [path, content] of Object.entries(files)) {
    await mkdir(dirname(join(cwd, path)), { recursive: true });
    await writeFile(join(cwd, path), content);
  }

  const profile: ProjectProfile = {
    cwd,
    workspaceRoot: cwd,
    framework: 'vite-react',
    frameworkVersion: '7',
    language: 'ts',
    packageManager: 'pnpm',
    tailwind: 4,
    cssFile: join(cwd, 'src/style.css'),
    componentsDir: join(cwd, 'src/components/ui'),
    aliasPrefix: '@',
    base: 'base-ui',
    colorFormat: 'css',
    configFile: join(cwd, 'uitheme.json'),
  };

  return { cwd, profile };
}

/** Whether the CLI accepts the utils file as one that exports a callable cn. */
async function accepts(files: Record<string, string>) {
  const { profile } = await project(files);
  const asked: string[] = [];

  const plan = await planSharedUtils(profile, {
    resolveConflict: async (conflict) => {
      asked.push(conflict.reason);

      return 'keep';
    },
  });

  return { accepted: !asked.length, plan };
}

const utils = 'src/lib/utils.ts';

describe('cn export check', () => {
  it.each([
    ['a function declaration', 'export function cn() { return ""; }'],
    [
      'a const arrow function',
      'export const cn = (...a: string[]) => a.join(" ");',
    ],
    ['a let function expression', 'export let cn = function () {};'],
    [
      'an imported binding',
      "import { twMerge } from 'tailwind-merge';\nexport const cn = twMerge;",
    ],
    ['a call result', 'export const cn = create();'],
    ['a cast arrow function', 'export const cn = ((() => "") as unknown);'],
    ['a renamed local', 'function merge() {}\nexport { merge as cn };'],
    ['a local export list', 'const cn = () => "";\nexport { cn };'],
    [
      'an import from a package',
      "import { cn } from 'some-ui';\nexport { cn };",
    ],
    ['a re-export from a package', "export { cn } from 'some-ui';"],
    ['a star re-export from a package', "export * from 'some-ui';"],
  ])('accepts %s', async (_, source) => {
    expect((await accepts({ [utils]: source })).accepted).toBe(true);
  });

  it.each([
    ['no cn export', 'export const other = 1;'],
    ['a string', "export const cn = 'cn';"],
    ['a number', 'export const cn = 1;'],
    ['an object', 'export const cn = {};'],
    ['an array', 'export const cn = [];'],
    ['a template', 'export const cn = `cn`;'],
    ['a type alias', 'export type cn = () => string;'],
    ['a class', 'export class cn {}'],
    ['a renamed class', 'class Merge {}\nexport { Merge as cn };'],
    ['a type-only export', "export type { cn } from './cn';"],
    [
      'a namespace import',
      "import * as all from './cn';\nexport { all as cn };",
    ],
    ['a syntax error', 'export const cn = (;'],
    ['a re-export of a missing file', "export { cn } from './missing';"],
  ])('rejects %s', async (_, source) => {
    expect(
      (
        await accepts({
          [utils]: source,
          'src/lib/cn.ts': 'export function cn() {}',
        })
      ).accepted
    ).toBe(false);
  });

  it('follows relative re-exports through a chain', async () => {
    expect(
      (
        await accepts({
          [utils]: "export * from './a';",
          'src/lib/a.ts': "export { merge as cn } from './b.js';",
          'src/lib/b.ts': 'export const merge = () => "";',
        })
      ).accepted
    ).toBe(true);

    expect(
      (
        await accepts({
          [utils]: "export * from './a';",
          'src/lib/a.ts': "export { merge as cn } from './b';",
          'src/lib/b.ts': 'export const merge = "";',
        })
      ).accepted
    ).toBe(false);
  });

  it('stops at a re-export cycle', async () => {
    expect(
      (
        await accepts({
          [utils]: "export * from './a';",
          'src/lib/a.ts': "export * from './utils';",
        })
      ).accepted
    ).toBe(false);
  });

  it('reads JavaScript utils', async () => {
    const { accepted, plan } = await accepts({
      'src/lib/utils.js': 'export const cn = (...inputs) => inputs.join(" ");',
    });

    expect(accepted).toBe(true);
    expect(plan.file.path).toMatch(/src\/lib\/utils\.js$/);
  });
});

describe('utils alias resolution', () => {
  it('resolves paths from an extended config, relative to that config', async () => {
    const { plan } = await accepts({
      'tsconfig.json': '{ "extends": "./config/base.json" }',
      'config/base.json':
        '{ // shared\n "compilerOptions": { "paths": { "@/*": ["../src/*"], }, }, }',
      'src/lib/utils/index.tsx': 'export function cn() {}',
    });

    expect(plan.file.path).toMatch(/src\/lib\/utils\/index\.tsx$/);
    expect(plan.file.action).toBe('skip');
  });

  it('resolves an alias from components.json through baseUrl', async () => {
    const { plan, accepted } = await accepts({
      'components.json': '{"aliases":{"utils":"helpers/classes"}}',
      'tsconfig.json': '{"compilerOptions":{"baseUrl":"./src"}}',
      'src/helpers/classes.mts': 'export function cn() {}',
    });

    expect(accepted).toBe(true);
    expect(plan.file.path).toMatch(/src\/helpers\/classes\.mts$/);
  });

  it('rejects an alias that only reaches a declaration file', async () => {
    await expect(
      accepts({ 'src/lib/utils.d.ts': 'export declare function cn(): string;' })
    ).rejects.toThrow(/resolves to a declaration/);
  });

  it('plans a new utils file when the alias target does not exist', async () => {
    const { plan, accepted } = await accepts({});

    expect(accepted).toBe(true);
    expect(plan.file.path).toMatch(/src\/lib\/utils\.ts$/);
    expect(plan.file.action).toBe('create');
  });
});
