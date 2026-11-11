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
import { existsSync } from 'node:fs';
import spawn from 'cross-spawn';
import semver from 'semver';
import { planSharedUtils } from './shared-utils.ts';
import { readConfig } from '../config.ts';
import { assertSafePath } from '../registry.ts';
import type { ProjectProfile, RegistryGraph, SavedConfig } from '../types.ts';

export interface PlannedFile {
  path: string;
  content: string;
  before: string | undefined;
  action: 'create' | 'replace' | 'skip';
  /**
   * The file on disk differs from the uitheme version, and the CLI keeps it.
   * `asked` is true when the user chose to keep the file at a prompt.
   */
  kept?: { reason: ConflictReason; asked: boolean };
}

/**
 * Why an existing file blocks a replacement: the user edited a file that the
 * CLI installed, the CLI did not install the file, or the file has no `cn`.
 */
export type ConflictReason = 'edited' | 'existing' | 'no-cn';

export interface FileConflict {
  /** The path relative to the application, for messages. */
  path: string;
  reason: ConflictReason;
  before: string;
  content: string;
}

/**
 * Ask the user what to do with a file that differs from the uitheme version.
 * Return undefined when nobody can answer. The CLI then keeps the file.
 */
export type ConflictResolver = (
  conflict: FileConflict
) => Promise<'overwrite' | 'keep' | undefined>;

export interface InstallPlan {
  profile: ProjectProfile;
  files: PlannedFile[];
  dependencies: string[];
  /** Existing dependencies that the plan moves to another range. */
  dependencyUpdates?: DependencyUpdate[];
  dependencyInstalls?: { profile: ProjectProfile; dependencies: string[] }[];
  manualSteps: string[];
  revision?: string;
}

export interface PlanOptions {
  overwrite?: boolean;
  yes?: boolean;
  diff?: boolean;
  /** Ask about each file that differs. Without it, the CLI keeps the files. */
  resolveConflict?: ConflictResolver;
  /** The uitheme-web dependency to install, from `resolveWebDependency`. */
  webDependency?: string;
}

const defaultWebDependency = 'uitheme-web@latest';

/**
 * Select the uitheme-web dependency from `UITHEME_WEB_VERSION`. The value can
 * be a dist-tag (`next`), a version or range (`2.0.0-rc.1`), or a path to a
 * packed `.tgz` file. Without a value, the CLI installs `uitheme-web@latest`.
 */
export function resolveWebDependency(
  value: string | undefined,
  base = process.cwd()
): string {
  if (!value) return defaultWebDependency;

  if (value.endsWith('.tgz')) {
    const path = resolve(base, value.replace(/^file:/, ''));

    if (!existsSync(path))
      throw new Error(`UITHEME_WEB_VERSION file does not exist: ${path}`);

    return `uitheme-web@file:${path}`;
  }

  if (/^[a-z][a-z0-9._-]*$/i.test(value) || semver.validRange(value))
    return `uitheme-web@${value}`;

  throw new Error(
    `Invalid UITHEME_WEB_VERSION: use a dist-tag, a version, or a .tgz path (${value})`
  );
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

  if (path === profile.utilsFile) {
    await assertDestination(profile.workspaceRoot, path);

    return profile.workspaceRoot;
  }

  if (!contains(profile.componentsDir, path))
    throw new Error(`Unsafe destination path: ${path}`);
  await assertDestination(profile.workspaceRoot, path);

  return profile.workspaceRoot;
}

export async function componentOwner(
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

/**
 * Settle a planned replacement of a file that the user owns. `--overwrite`
 * and `diff` replace it. Otherwise the user decides, and the file stays when
 * the user keeps it or nobody can answer.
 */
export async function settleConflict(
  profile: ProjectProfile,
  planned: PlannedFile,
  reason: ConflictReason,
  options: PlanOptions
): Promise<PlannedFile> {
  if (planned.action !== 'replace' || options.overwrite || options.diff)
    return planned;

  const answer = await options.resolveConflict?.({
    path: relative(profile.cwd, planned.path).replaceAll('\\', '/'),
    reason,
    before: planned.before!,
    content: planned.content,
  });

  if (answer === 'overwrite') return planned;

  return {
    ...planned,
    content: planned.before!,
    action: 'skip',
    kept: { reason, asked: answer === 'keep' },
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

  if (spec.startsWith('uitheme-web@'))
    return {
      name: 'uitheme-web',
      version: spec === defaultWebDependency ? '^2.0.0' : undefined,
      explicit: spec !== defaultWebDependency,
    };

  const version = match?.[2];

  if (!match || (version && !semver.validRange(version)))
    throw new Error(`Unsafe registry dependency: ${spec}`);

  return { name: match[1], version, explicit: false };
}

export interface DependencyUpdate {
  name: string;
  current: string;
  spec: string;
  /** The update leaves the current major version, or the current 0.x minor. */
  major: boolean;
}

// True when the lowest version of `next` is outside a caret range of the
// lowest version of `current`. `^0.576.0` to `^1.61.0` is a major update.
function isMajorUpdate(current: string, next: string) {
  const from = semver.minVersion(current),
    to = semver.minVersion(next);

  return Boolean(from && to && !semver.satisfies(to, `^${from.version}`));
}

export async function missingDependencies(
  profile: ProjectProfile,
  requested: string[],
  allowUpgrades: string[] = [],
  compatible: Record<string, string> = {}
): Promise<string[]> {
  return (
    await resolveDependencies(profile, requested, allowUpgrades, compatible)
  ).install;
}

/**
 * Select the dependencies to install. An existing dependency stays when its
 * range is inside the registry range, or inside the item's compatible range.
 * Otherwise the CLI installs the registry spec and reports the update.
 */
export async function resolveDependencies(
  profile: ProjectProfile,
  requested: string[],
  allowUpgrades: string[] = [],
  compatible: Record<string, string> = {}
): Promise<{ install: string[]; updates: DependencyUpdate[] }> {
  const pkg = JSON.parse(
    (await readOptional(join(profile.cwd, 'package.json'))) ?? '{}'
  );

  const existing = { ...pkg.devDependencies, ...pkg.dependencies };
  const result = new Map<string, string>();
  const updates: DependencyUpdate[] = [];

  for (const spec of requested) {
    const { name, version, explicit } = dependencySpec(spec);
    const previous = result.get(name);

    if (previous && previous !== spec)
      throw new Error(`Conflicting registry dependency: ${name}`);

    // UITHEME_WEB_VERSION is a deliberate choice, so it is always installed.
    if (explicit) {
      result.set(name, spec);
      continue;
    }

    const current = existing[name];

    if (
      current !== undefined &&
      !semver.validRange(current) &&
      !allowUpgrades.includes(name)
    )
      throw new Error(`Invalid installed dependency declaration: ${name}`);

    if (!current) {
      result.set(name, spec);
      continue;
    }

    if (!version) continue;

    const accepted = compatible[name] ?? version;

    if (semver.validRange(current) && semver.subset(current, accepted))
      continue;

    // A uitheme-web major changes the runtime API, so it needs the migration.
    if (
      name === 'uitheme-web' &&
      !allowUpgrades.includes(name) &&
      (!semver.validRange(current) || !semver.intersects(current, version))
    )
      throw new Error(
        `Incompatible existing dependency ${name}@${current}. Run \`uitheme migrate\` first.`
      );

    result.set(name, spec);

    if (
      semver.validRange(current) &&
      !updates.some((update) => update.name === name)
    )
      updates.push({
        name,
        current,
        spec: version,
        major: isMajorUpdate(current, version),
      });
  }

  return { install: [...result.values()], updates };
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
  const web = options.webDependency ?? defaultWebDependency;
  const dependencies: string[] = [web];
  const utility = await planSharedUtils(profile, options);
  const owner = utility.owner;
  profile = utility.profile;
  files.set(utility.file.path, utility.file);
  dependencies.push(...utility.dependencies);

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

      const content =
        utility.importPath === '@/lib/utils'
          ? file.content
          : file.content.replace(
              /(['"])@\/lib\/utils\1/g,
              JSON.stringify(utility.importPath)
            );

      const local = relative(profile.cwd, destination).replaceAll('\\', '/');
      const prior = files.get(destination);

      if (prior && (prior.kept ? prior.before : prior.content) !== content)
        throw new Error(`Conflicting registry destination: ${local}`);

      const tracked = Object.values(saved?.installed ?? {})
        .flatMap((record) => record.files)
        .find((record) => record.path === local);

      let planned = prior ?? (await planFile(profile, destination, content));

      // A tracked file that still has its installed hash is not edited, so
      // the CLI updates it. Any other difference belongs to the user.
      if (
        !prior &&
        planned.action === 'replace' &&
        (!tracked || hashContent(planned.before!) !== tracked.hash)
      )
        planned = await settleConflict(
          profile,
          planned,
          tracked ? 'edited' : 'existing',
          options
        );
      files.set(destination, planned);
      // A kept file keeps its old hash, so the next run finds the edit again.
      installedFiles.push({
        path: local,
        hash: planned.kept && tracked ? tracked.hash : hashContent(content),
      });
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

  const compatible = Object.assign(
    {},
    ...graph.items.map((item) => item.meta.uiTheme.compatibleDependencies)
  );

  const resolved = await resolveDependencies(
    profile,
    owner.cwd === profile.cwd ? dependencies : [web],
    [],
    compatible
  );

  const plan: InstallPlan = {
    profile,
    files: [...files.values()],
    dependencies: resolved.install,
    dependencyUpdates: resolved.updates,
    manualSteps: [...utility.manualSteps],
    revision: graph.manifest.stable.revision,
  };

  if (owner.cwd !== profile.cwd) {
    const shared = await resolveDependencies(
      owner,
      dependencies,
      [],
      compatible
    );

    plan.dependencyInstalls = [
      { profile: owner, dependencies: shared.install },
    ];
    plan.dependencyUpdates = [...resolved.updates, ...shared.updates];
  }

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

const keptReasons: Record<ConflictReason, string> = {
  edited: 'edited since installation',
  existing: 'differs from the uitheme version',
  'no-cn': 'does not export a callable cn',
};

export function describePlan(plan: InstallPlan): string {
  const files = plan.files.map((file) => {
    const path = relative(plan.profile.cwd, file.path).replaceAll('\\', '/');

    return file.kept
      ? `keep ${path} (${keptReasons[file.kept.reason]}; --overwrite replaces it)`
      : `${file.action} ${path}`;
  });

  return [
    ...files,
    ...plan.dependencies.map((dependency) => {
      const update = plan.dependencyUpdates?.find(
        ({ name }) => dependency === name || dependency.startsWith(`${name}@`)
      );

      return update
        ? `update ${update.name} ${update.current} -> ${update.spec}${update.major ? ' (major update: check your other imports from this package)' : ''}`
        : `dependency ${dependency}`;
    }),
    ...(plan.dependencyInstalls ?? []).flatMap((install) =>
      install.dependencies.map(
        (dependency) =>
          `dependency ${dependency} (in ${relative(plan.profile.cwd, install.profile.cwd).replaceAll('\\', '/')})`
      )
    ),
    ...plan.manualSteps.map((step) => `manual-required: ${step}`),
  ].join('\n');
}
