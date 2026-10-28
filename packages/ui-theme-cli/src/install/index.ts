import { createHash } from 'node:crypto';
import {
  readFile,
  writeFile,
  mkdir,
  lstat,
  unlink,
  rmdir,
} from 'node:fs/promises';
import { resolve, relative, dirname, isAbsolute, join } from 'node:path';
import { spawn } from 'node:child_process';
import semver from 'semver';
import { readConfig } from '../config.ts';
import { assertSafePath } from '../registry.ts';
import type { ProjectProfile, RegistryGraph, SavedConfig } from '../types.ts';

export interface PlannedFile {
  path: string;
  content: string;
  before: string | undefined;
  action: 'create' | 'replace' | 'skip';
}

export interface InstallPlan {
  profile: ProjectProfile;
  files: PlannedFile[];
  dependencies: string[];
  dependencyInstalls?: { profile: ProjectProfile; dependencies: string[] }[];
  manualSteps: string[];
  revision?: string;
}

export interface PlanOptions {
  overwrite?: boolean;
  yes?: boolean;
  diff?: boolean;
}

export type InstallRunner = (
  profile: ProjectProfile,
  dependencies: string[]
) => Promise<void>;

export const hashContent = (content: string) =>
  createHash('sha256').update(content).digest('hex');

export async function readOptional(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
      return;
    throw error;
  }
}

export async function assertDestination(
  cwd: string,
  path: string
): Promise<void> {
  const root = resolve(cwd),
    destination = resolve(path),
    local = relative(root, destination);

  if (
    !local ||
    local === '..' ||
    local.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) ||
    isAbsolute(local)
  )
    throw new Error(`Unsafe destination path: ${path}`);
  let current = destination;

  while (current !== root) {
    try {
      if ((await lstat(current)).isSymbolicLink())
        throw new Error(
          `Symlink destination path requires manual setup: ${current}`
        );
    } catch (error) {
      if (!(
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ))
        throw error;
    }

    current = dirname(current);
  }
}

function contains(root: string, path: string): boolean {
  const local = relative(resolve(root), resolve(path));

  return (
    local === '' ||
    (local !== '..' &&
      !local.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) &&
      !isAbsolute(local))
  );
}

async function assertProfileDestination(
  profile: ProjectProfile,
  path: string
): Promise<string> {
  if (contains(profile.cwd, path)) {
    await assertDestination(profile.cwd, path);

    return profile.cwd;
  }

  if (!contains(profile.componentsDir, path))
    throw new Error(`Unsafe destination path: ${path}`);
  await assertDestination(profile.workspaceRoot, path);

  return profile.workspaceRoot;
}

async function componentOwner(
  profile: ProjectProfile
): Promise<ProjectProfile> {
  if (contains(profile.cwd, profile.componentsDir)) return profile;
  await assertProfileDestination(
    profile,
    join(profile.componentsDir, 'destination')
  );
  let directory = profile.componentsDir;

  while (directory !== profile.workspaceRoot) {
    const manifest = join(directory, 'package.json');
    await assertDestination(profile.workspaceRoot, manifest);

    if ((await readOptional(manifest)) !== undefined)
      return { ...profile, cwd: directory };
    directory = dirname(directory);
  }

  throw new Error(
    'Shared components require an existing owning workspace package.json below the workspace root.'
  );
}

export async function planFile(
  profile: ProjectProfile,
  path: string,
  content: string
): Promise<PlannedFile> {
  await assertProfileDestination(profile, path);
  const before = await readOptional(path);

  return {
    path,
    content,
    before,
    action:
      before === content ? 'skip' : before === undefined ? 'create' : 'replace',
  };
}

export function serializeConfig(
  profile: ProjectProfile,
  saved: Partial<SavedConfig> = {}
): string {
  const cwd = profile.cwd;

  const value = {
    schemaVersion: 1,
    framework: profile.framework,
    frameworkVersion: profile.frameworkVersion,
    language: profile.language,
    packageManager: profile.packageManager,
    tailwind: profile.tailwind,
    cssFile: profile.cssFile,
    tailwindConfigFile: profile.tailwindConfigFile,
    componentsDir: profile.componentsDir,
    aliasPrefix: profile.aliasPrefix,
    base: profile.base,
    colorFormat: profile.colorFormat,
    revision: saved.revision,
    installed: saved.installed,
  };

  for (const key of ['cssFile', 'tailwindConfigFile', 'componentsDir'] as const)
    if (value[key])
      value[key] = relative(cwd, value[key]!).replaceAll('\\', '/');

  return `${JSON.stringify(value, null, 2)}\n`;
}

function dependencySpec(spec: string) {
  const match =
    /^(@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*|[a-z0-9][a-z0-9._-]*)(?:@(.+))?$/.exec(
      spec
    );

  if (!match || (match[2] && !semver.validRange(match[2])))
    throw new Error(`Unsafe registry dependency: ${spec}`);

  return { name: match[1], version: match[2] };
}

export async function missingDependencies(
  profile: ProjectProfile,
  requested: string[],
  allowUpgrades: string[] = []
): Promise<string[]> {
  const pkg = JSON.parse(
    (await readOptional(join(profile.cwd, 'package.json'))) ?? '{}'
  );

  const existing = { ...pkg.devDependencies, ...pkg.dependencies };
  const result = new Map<string, string>();

  for (const spec of requested) {
    const { name, version } = dependencySpec(spec);
    const previous = result.get(name);

    if (previous && previous !== spec)
      throw new Error(`Conflicting registry dependency: ${name}`);

    const current = existing[name];

    if (
      current !== undefined &&
      !semver.validRange(current) &&
      !allowUpgrades.includes(name)
    )
      throw new Error(`Invalid installed dependency declaration: ${name}`);

    if (
      current &&
      version &&
      (!semver.validRange(current) || !semver.intersects(current, version)) &&
      !allowUpgrades.includes(name)
    )
      throw new Error(
        `Incompatible existing dependency ${name}@${current}; migration or an explicit dependency update is required before installation.`
      );

    if (
      !current ||
      (version &&
        (!semver.validRange(current) || !semver.subset(current, version)))
    )
      result.set(name, spec);
  }

  return [...result.values()];
}

function registryDestination(profile: ProjectProfile, path: string): string {
  assertSafePath(path);
  const local = path.replace(/^components\/ui\//, '').replace(/^ui\//, '');

  return resolve(profile.componentsDir, local);
}

export async function planRegistryInstall(
  profile: ProjectProfile,
  graph: RegistryGraph,
  options: PlanOptions = {}
): Promise<InstallPlan> {
  const saved = await readConfig(profile.cwd);
  const installed = { ...saved?.installed };
  const files = new Map<string, PlannedFile>();
  const dependencies: string[] = ['uitheme-web@^2.0.0'];
  const owner = await componentOwner(profile);

  const expectedFramework =
    profile.framework === 'nuxt' || profile.framework === 'vite-vue'
      ? 'vue'
      : 'react';

  for (const item of graph.items) {
    const meta = item.meta.uiTheme;

    if (meta.revision !== graph.manifest.stable.revision)
      throw new Error('Registry revision mismatch');

    if (
      meta.framework !== expectedFramework ||
      meta.base !== profile.base ||
      meta.tailwind !== profile.tailwind ||
      meta.language !== profile.language
    )
      throw new Error(
        'Registry variant does not match project base, framework, Tailwind, or language'
      );
    dependencies.push(...item.dependencies);
    const installedFiles = [];

    for (const file of item.files) {
      assertSafePath(file.path);

      if (file.target) assertSafePath(file.target);

      if (
        !['registry:ui', 'registry:lib', 'registry:component'].includes(
          file.type
        )
      )
        throw new Error(`Unsupported registry destination type: ${file.type}`);

      const destination = registryDestination(
        profile,
        file.target ?? file.path
      );

      const planned = await planFile(profile, destination, file.content);
      const local = relative(profile.cwd, destination).replaceAll('\\', '/');

      const tracked = Object.values(saved?.installed ?? {})
        .flatMap((record) => record.files)
        .find((record) => record.path === local);

      if (
        planned.action === 'replace' &&
        !options.overwrite &&
        !options.diff &&
        (!tracked || hashContent(planned.before!) !== tracked.hash)
      )
        throw new Error(
          `Edited or existing file requires --overwrite: ${local}`
        );
      const prior = files.get(destination);

      if (prior && prior.content !== planned.content)
        throw new Error(`Conflicting registry destination: ${local}`);
      files.set(destination, planned);
      installedFiles.push({ path: local, hash: hashContent(file.content) });
    }

    if (!/^[a-z][a-z0-9-]*$/.test(meta.component))
      throw new Error('Invalid registry component name');
    installed[meta.component] = {
      revision: graph.manifest.stable.revision,
      files: installedFiles,
    };
  }

  const config = serializeConfig(profile, {
    ...saved,
    revision: graph.manifest.stable.revision,
    installed,
  });

  files.set(
    profile.configFile,
    await planFile(profile, profile.configFile, config)
  );

  const plan: InstallPlan = {
    profile,
    files: [...files.values()],
    dependencies: await missingDependencies(
      profile,
      owner.cwd === profile.cwd ? dependencies : ['uitheme-web@^2.0.0']
    ),
    manualSteps: [],
    revision: graph.manifest.stable.revision,
  };

  if (owner.cwd !== profile.cwd)
    plan.dependencyInstalls = [
      {
        profile: owner,
        dependencies: await missingDependencies(owner, dependencies),
      },
    ];

  return plan;
}

export const runPackageInstall: InstallRunner = async (
  profile,
  dependencies
) => {
  if (!dependencies.length) return;
  const command = profile.packageManager;
  const args = [command === 'npm' ? 'install' : 'add', ...dependencies];
  await new Promise<void>((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd: profile.cwd,
      stdio: 'inherit',
      shell: false,
    });

    child.on('error', reject);
    child.on('close', (code) =>
      code === 0
        ? resolveRun()
        : reject(
            new Error(`${command} dependency installation failed (${code})`)
          )
    );
  });
};

export async function applyPlan(
  plan: InstallPlan,
  options: { dryRun?: boolean; runInstall?: InstallRunner } = {}
): Promise<void> {
  if (options.dryRun) return;

  for (const file of plan.files) {
    await assertProfileDestination(plan.profile, file.path);

    if ((await readOptional(file.path)) !== file.before)
      throw new Error(`File changed since planning: ${file.path}`);
  }

  const snapshot = new Map<string, Buffer | undefined>();

  for (const root of new Set([
    plan.profile.cwd,
    plan.profile.workspaceRoot,
    ...(plan.dependencyInstalls ?? []).map((install) => install.profile.cwd),
  ]))
    for (const name of [
      'package.json',
      'pnpm-lock.yaml',
      'package-lock.json',
      'npm-shrinkwrap.json',
      'yarn.lock',
      'bun.lock',
      'bun.lockb',
    ]) {
      const path = join(root, name);
      await assertDestination(root, path);

      try {
        snapshot.set(path, await readFile(path));
      } catch (error) {
        if (!(
          error instanceof Error &&
          'code' in error &&
          error.code === 'ENOENT'
        ))
          throw error;
        snapshot.set(path, undefined);
      }
    }

  const changed: PlannedFile[] = [];
  const createdDirectories = new Set<string>();

  try {
    for (const file of plan.files) {
      if (file.action === 'skip') continue;
      let directory = dirname(file.path);

      const root = await assertProfileDestination(plan.profile, file.path);

      while (directory !== root) {
        try {
          await lstat(directory);
          break;
        } catch (error) {
          if (!(
            error instanceof Error &&
            'code' in error &&
            error.code === 'ENOENT'
          ))
            throw error;
        }

        createdDirectories.add(directory);
        directory = dirname(directory);
      }

      await mkdir(dirname(file.path), { recursive: true });
      changed.push(file);
      await writeFile(file.path, file.content);
    }

    await (options.runInstall ?? runPackageInstall)(
      plan.profile,
      plan.dependencies
    );

    for (const install of plan.dependencyInstalls ?? [])
      await (options.runInstall ?? runPackageInstall)(
        install.profile,
        install.dependencies
      );
  } catch (error) {
    const failures: unknown[] = [];

    const restore = async (
      path: string,
      before: string | Buffer | undefined
    ) => {
      try {
        if (before === undefined)
          await unlink(path).catch((problem) => {
            if (problem.code !== 'ENOENT') throw problem;
          });
        else await writeFile(path, before);
      } catch (failure) {
        failures.push(failure);
      }
    };

    for (const file of changed) await restore(file.path, file.before);

    for (const [path, before] of snapshot) await restore(path, before);

    for (const directory of [...createdDirectories].sort(
      (a, b) => b.length - a.length
    ))
      await rmdir(directory).catch(() => {});

    if (failures.length)
      throw new AggregateError(
        [error, ...failures],
        'Installation failed and some files could not be rolled back'
      );
    throw error;
  }
}

export function describePlan(plan: InstallPlan): string {
  const files = plan.files.map(
    (file) =>
      `${file.action} ${relative(plan.profile.cwd, file.path).replaceAll('\\', '/')}`
  );

  return [
    ...files,
    ...plan.dependencies.map((dependency) => `dependency ${dependency}`),
    ...(plan.dependencyInstalls ?? []).flatMap((install) =>
      install.dependencies.map(
        (dependency) =>
          `dependency ${dependency} (in ${relative(plan.profile.cwd, install.profile.cwd).replaceAll('\\', '/')})`
      )
    ),
    ...plan.manualSteps.map((step) => `manual-required: ${step}`),
  ].join('\n');
}
