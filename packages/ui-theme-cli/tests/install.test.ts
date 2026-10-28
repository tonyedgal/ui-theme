import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
  rm,
  symlink,
} from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import {
  applyPlan,
  planRegistryInstall,
  hashContent,
} from '../src/install/index';
import type { ProjectProfile, RegistryGraph } from '../src/types';

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
  );
});

async function fixture() {
  const cwd = await mkdtemp(join(tmpdir(), 'uitheme-install-'));
  roots.push(cwd);
  await mkdir(join(cwd, 'src'), { recursive: true });
  await writeFile(
    join(cwd, 'package.json'),
    '{"name":"consumer","dependencies":{"react":"19"}}\n'
  );
  await writeFile(join(cwd, 'pnpm-lock.yaml'), 'old lock\n');

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
    aliasPrefix: '@/components/ui',
    base: 'base-ui',
    colorFormat: 'css',
    configFile: join(cwd, 'uitheme.json'),
  };

  return { cwd, profile };
}

function graph(
  path = 'theme-toggle.tsx',
  content = 'export const ThemeToggle = () => null;'
): RegistryGraph {
  return {
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
        dependencies: ['@base-ui/react'],
        registryDependencies: [],
        files: [{ path, content, type: 'registry:ui' }],
        meta: {
          uiTheme: {
            schemaVersion: 1,
            revision: 'abc12345',
            component: 'theme-toggle',
            framework: 'react',
            base: 'base-ui',
            tailwind: 4,
            language: 'ts',
            webVersion: '^2.0.0',
            cliVersion: '^1.0.0',
          },
        },
      },
    ],
  };
}

describe('installation plans and transactions', () => {
  it('refuses incompatible existing package majors before writes', async () => {
    const { profile, cwd } = await fixture();
    await writeFile(
      join(cwd, 'package.json'),
      JSON.stringify({ dependencies: { 'uitheme-web': '^1.4.0' } })
    );
    await expect(planRegistryInstall(profile, graph())).rejects.toThrow(
      /incompatible|migration/i
    );
    await expect(readFile(profile.configFile)).rejects.toThrow();
    await writeFile(
      join(cwd, 'package.json'),
      JSON.stringify({ dependencies: { 'tailwind-merge': '^2.6.0' } })
    );
    const item = graph();
    item.items[0].dependencies = ['tailwind-merge@^3.0.0'];
    await expect(planRegistryInstall(profile, item)).rejects.toThrow(
      /incompatible/i
    );
  });
  it('previews all source and dependencies without creating project files', async () => {
    const { profile, cwd } = await fixture();
    const plan = await planRegistryInstall(profile, graph());
    expect(plan.dependencies).toContain('@base-ui/react');
    expect(plan.files.map((file) => file.path)).toContain(
      join(cwd, 'src/components/ui/theme-toggle.tsx')
    );
    await applyPlan(plan, { dryRun: true });
    await expect(readFile(profile.configFile)).rejects.toThrow();
    await expect(
      readFile(join(profile.componentsDir, 'theme-toggle.tsx'))
    ).rejects.toThrow();
  });
  it('records revision and hashes and skips an identical second installation', async () => {
    const { profile } = await fixture();
    const plan = await planRegistryInstall(profile, graph());
    await applyPlan(plan, { runInstall: async () => {} });
    const saved = JSON.parse(await readFile(profile.configFile, 'utf8'));
    expect(saved.revision).toBe('abc12345');
    expect(saved.installed['theme-toggle'].files[0]).toEqual({
      path: 'src/components/ui/theme-toggle.tsx',
      hash: hashContent('export const ThemeToggle = () => null;'),
    });
    const next = await planRegistryInstall(profile, graph());
    expect(
      next.files.filter((file) => file.path.endsWith('theme-toggle.tsx'))[0]
        ?.action
    ).toBe('skip');
  });
  it('rejects user edits even when yes is set; overwrite is explicit', async () => {
    const { profile } = await fixture();
    await mkdir(profile.componentsDir, { recursive: true });
    await writeFile(
      join(profile.componentsDir, 'theme-toggle.tsx'),
      'user edit'
    );
    await expect(
      planRegistryInstall(profile, graph(), { yes: true })
    ).rejects.toThrow(/overwrite|edited|exists/i);

    const plan = await planRegistryInstall(profile, graph(), {
      overwrite: true,
    });

    expect(
      plan.files.find((file) => file.path.endsWith('theme-toggle.tsx'))?.action
    ).toBe('replace');
  });
  it('updates a tracked unedited file and preserves user changes in other files', async () => {
    const { profile } = await fixture();
    await applyPlan(await planRegistryInstall(profile, graph()), {
      runInstall: async () => {},
    });
    await applyPlan(
      await planRegistryInstall(
        profile,
        graph('theme-toggle.tsx', 'new source')
      ),
      { runInstall: async () => {} }
    );
    expect(
      await readFile(join(profile.componentsDir, 'theme-toggle.tsx'), 'utf8')
    ).toBe('new source');
  });
  it.each([
    '../outside.tsx',
    '/tmp/outside.tsx',
    'file:///tmp/outside.tsx',
    'nested/../../outside.tsx',
    'C:\\outside.tsx',
  ])('rejects untrusted source paths: %s', async (path) => {
    const { profile } = await fixture();
    await expect(planRegistryInstall(profile, graph(path))).rejects.toThrow(
      /path|destination/i
    );
  });
  it('rejects registry targets and symlink destinations outside the app', async () => {
    const { profile, cwd } = await fixture();
    const outside = await mkdtemp(join(tmpdir(), 'uitheme-outside-'));
    roots.push(outside);
    await mkdir(join(cwd, 'src/components'), { recursive: true });
    await symlink(outside, profile.componentsDir);
    await expect(planRegistryInstall(profile, graph())).rejects.toThrow(
      /symlink|outside|path/i
    );
    const item = graph();
    item.items[0].files[0].target = '../escape';
    await expect(planRegistryInstall(profile, item)).rejects.toThrow(
      /path|destination/i
    );
  });
  it('rolls source, existing manifest, app lock and workspace lock back after a package-manager failure', async () => {
    const { profile, cwd } = await fixture();
    const original = await readFile(join(cwd, 'package.json'), 'utf8');
    await writeFile(
      profile.configFile,
      '{"schemaVersion":1,"base":"base-ui"}\n'
    );
    const plan = await planRegistryInstall(profile, graph());
    await expect(
      applyPlan(plan, {
        runInstall: async () => {
          await writeFile(join(cwd, 'package.json'), 'broken');
          await writeFile(join(cwd, 'pnpm-lock.yaml'), 'broken lock');
          throw Error('installation failed');
        },
      })
    ).rejects.toThrow('installation failed');
    expect(await readFile(join(cwd, 'package.json'), 'utf8')).toBe(original);
    expect(await readFile(join(cwd, 'pnpm-lock.yaml'), 'utf8')).toBe(
      'old lock\n'
    );
    expect(await readFile(profile.configFile, 'utf8')).toBe(
      '{"schemaVersion":1,"base":"base-ui"}\n'
    );
    await expect(
      readFile(join(profile.componentsDir, 'theme-toggle.tsx'))
    ).rejects.toThrow();
  });
  it('places shared controls and their dependencies in the owning workspace package', async () => {
    const { profile, cwd } = await fixture();
    const app = join(cwd, 'apps/site');
    const owner = join(cwd, 'packages/ui');
    await mkdir(app, { recursive: true });
    await mkdir(owner, { recursive: true });
    await writeFile(join(app, 'package.json'), '{"name":"site"}');
    await writeFile(join(owner, 'package.json'), '{"name":"shared-ui"}');

    const shared = {
      ...profile,
      cwd: app,
      cssFile: join(app, 'style.css'),
      componentsDir: join(owner, 'src/ui'),
      configFile: join(app, 'uitheme.json'),
    };

    const calls: { cwd: string; dependencies: string[] }[] = [];
    await applyPlan(await planRegistryInstall(shared, graph()), {
      runInstall: async (target, dependencies) => {
        calls.push({ cwd: target.cwd, dependencies });
      },
    });
    expect(
      await readFile(join(shared.componentsDir, 'theme-toggle.tsx'), 'utf8')
    ).toContain('ThemeToggle');
    expect(calls).toEqual([
      { cwd: app, dependencies: ['uitheme-web@^2.0.0'] },
      { cwd: owner, dependencies: ['uitheme-web@^2.0.0', '@base-ui/react'] },
    ]);
    const again = await planRegistryInstall(shared, graph());
    expect(again.files.every((file) => file.action === 'skip')).toBe(true);
  });
  it('rolls app, shared owner and workspace manifests and locks back when shared installation fails', async () => {
    const { profile, cwd } = await fixture();
    const app = join(cwd, 'apps/site');
    const owner = join(cwd, 'packages/ui');
    await mkdir(app, { recursive: true });
    await mkdir(owner, { recursive: true });
    await writeFile(join(app, 'package.json'), '{"name":"site"}');
    await writeFile(join(owner, 'package.json'), '{"name":"shared-ui"}');
    await writeFile(join(owner, 'yarn.lock'), 'owner lock');

    const shared = {
      ...profile,
      cwd: app,
      cssFile: join(app, 'style.css'),
      componentsDir: join(owner, 'src/ui'),
      configFile: join(app, 'uitheme.json'),
    };

    await expect(
      applyPlan(await planRegistryInstall(shared, graph()), {
        runInstall: async (target) => {
          await writeFile(join(target.cwd, 'package.json'), 'changed manifest');
          await writeFile(join(cwd, 'pnpm-lock.yaml'), 'changed root lock');

          if (target.cwd === owner) {
            await writeFile(join(owner, 'yarn.lock'), 'changed owner lock');
            throw Error('shared install failed');
          }
        },
      })
    ).rejects.toThrow('shared install failed');
    expect(await readFile(join(app, 'package.json'), 'utf8')).toBe(
      '{"name":"site"}'
    );
    expect(await readFile(join(owner, 'package.json'), 'utf8')).toBe(
      '{"name":"shared-ui"}'
    );
    expect(await readFile(join(owner, 'yarn.lock'), 'utf8')).toBe('owner lock');
    expect(await readFile(join(cwd, 'pnpm-lock.yaml'), 'utf8')).toBe(
      'old lock\n'
    );
    await expect(readFile(shared.configFile)).rejects.toThrow();
    await expect(
      readFile(join(shared.componentsDir, 'theme-toggle.tsx'))
    ).rejects.toThrow();
  });
  it('rejects shared paths reached through a symlink and directories with no owning package', async () => {
    const { profile, cwd } = await fixture();
    const app = join(cwd, 'apps/site');
    await mkdir(app, { recursive: true });
    await writeFile(join(app, 'package.json'), '{}');

    const shared = {
      ...profile,
      cwd: app,
      cssFile: join(app, 'style.css'),
      configFile: join(app, 'uitheme.json'),
      componentsDir: join(cwd, 'shared/ui'),
    };

    await expect(planRegistryInstall(shared, graph())).rejects.toThrow(
      /owning|package/i
    );
    await symlink(app, join(cwd, 'linked'));
    shared.componentsDir = join(cwd, 'linked/ui');
    await expect(planRegistryInstall(shared, graph())).rejects.toThrow(
      /symlink/i
    );
  });
  it('fails before writes if graph variants or revisions do not match the project', async () => {
    const { profile } = await fixture();
    const wrong = graph();
    wrong.items[0].meta.uiTheme.base = 'radix';
    await expect(planRegistryInstall(profile, wrong)).rejects.toThrow(
      /variant|base/i
    );
    const stale = graph();
    stale.items[0].meta.uiTheme.revision = 'other';
    await expect(planRegistryInstall(profile, stale)).rejects.toThrow(
      /revision/i
    );
  });
  it('restores binary locks byte for byte after an installation failure', async () => {
    const { profile, cwd } = await fixture();
    const original = Buffer.from([0, 255, 128, 13, 10]);
    await writeFile(join(cwd, 'bun.lockb'), original);
    const plan = await planRegistryInstall(profile, graph());
    await expect(
      applyPlan(plan, {
        runInstall: async () => {
          await writeFile(join(cwd, 'bun.lockb'), 'damaged');
          throw Error('failed');
        },
      })
    ).rejects.toThrow('failed');
    expect(await readFile(join(cwd, 'bun.lockb'))).toEqual(original);
  });
  it('detects a file changed between planning and application without overwriting it', async () => {
    const { profile } = await fixture();
    const plan = await planRegistryInstall(profile, graph());
    await mkdir(profile.componentsDir, { recursive: true });
    await writeFile(
      join(profile.componentsDir, 'theme-toggle.tsx'),
      'concurrent edit'
    );
    await expect(
      applyPlan(plan, { runInstall: async () => {} })
    ).rejects.toThrow(/changed|planning/i);
    expect(
      await readFile(join(profile.componentsDir, 'theme-toggle.tsx'), 'utf8')
    ).toBe('concurrent edit');
  });
});
