import { relative, resolve, join } from 'node:path';
import { BaseMismatchError, detectProject } from '../project.ts';
import { readConfig } from '../config.ts';
import {
  createRegistryClient,
  defaultOrigin,
  resolveRegistryOrigin,
  satisfiesRelease,
  unreleasedVersion,
} from '../registry.ts';
import {
  applyPlan,
  describePlan,
  resolveWebDependency,
  planRegistryInstall,
  readOptional,
} from '../install/index.ts';
import { planInit } from '../install/setup.ts';
import { cliVersion, installedWebVersion } from './version.ts';
import { runMigration } from './migrate.ts';
import type {
  ConflictReason,
  ConflictResolver,
  InstallPlan,
  InstallRunner,
} from '../install/index.ts';
import type {
  ProjectOverrides,
  ProjectProfile,
  RegistryVariant,
} from '../types.ts';

export interface CliIO {
  stdout?: (text: string) => void;
  stderr?: (text: string) => void;
  env?: Record<string, string | undefined>;
  registry?: ReturnType<typeof createRegistryClient>;
  runInstall?: InstallRunner;
  /** Resolve undefined when nobody can answer, for example in CI. */
  confirm?: (plan: InstallPlan) => Promise<boolean | undefined>;
  select?: (
    message: string,
    choices: string[],
    defaultChoice?: string
  ) => Promise<string | undefined>;
  migrate?: (args: string[], io: CliIO) => Promise<number>;
}

interface Flags {
  overrides: ProjectOverrides;
  dryRun: boolean;
  yes: boolean;
  overwrite: boolean;
  json: boolean;
  help: boolean;
  components: string[];
  /** The argument indexes of the component names. */
  positions: number[];
  revision?: string;
  registry?: string;
}

function choice<const Choices extends readonly string[]>(
  value: string,
  choices: Choices
): Choices[number] {
  const selected = choices.find((item) => item === value);

  if (!selected)
    throw new Error(`Invalid value ${value}; choose ${choices.join(', ')}`);

  return selected;
}

function parseFlags(args: string[]): Flags {
  const flags: Flags = {
    overrides: {},
    dryRun: false,
    yes: false,
    overwrite: false,
    json: false,
    help: false,
    components: [],
    positions: [],
  };

  const valueOptions = [
    '--cwd',
    '--framework',
    '--base',
    '--language',
    '--tailwind',
    '--css',
    '--css-file',
    '--tailwind-config',
    '--components-dir',
    '--alias-prefix',
    '--color-format',
    '--package-manager',
    '--revision',
    '--registry',
  ];

  for (let index = 0; index < args.length; index++) {
    const argument = args[index];

    if (!argument.startsWith('-')) {
      flags.components.push(argument);
      flags.positions.push(index);
      continue;
    }

    const separator = argument.indexOf('=');
    const key = separator === -1 ? argument : argument.slice(0, separator);

    if (valueOptions.includes(key)) {
      const value =
        separator === -1 ? args[++index] : argument.slice(separator + 1);

      if (!value || value.startsWith('--'))
        throw new Error(`Missing value for ${key}`);

      switch (key) {
        case '--cwd':
          flags.overrides.cwd = value;
          break;
        case '--framework':
          flags.overrides.framework = choice(value, [
            'vite-react',
            'vite-vue',
            'next',
            'tanstack',
            'nuxt',
          ]);
          break;
        case '--base':
          flags.overrides.base = choice(value, ['base-ui', 'radix', 'reka']);
          break;
        case '--language':
          flags.overrides.language = choice(value, ['ts', 'js']);
          break;
        case '--tailwind':
          if (value !== '3' && value !== '4')
            throw new Error('Tailwind major must be 3 or 4');
          flags.overrides.tailwind = value === '3' ? 3 : 4;
          break;
        case '--css':
        case '--css-file':
          flags.overrides.cssFile = value;
          break;
        case '--tailwind-config':
          flags.overrides.tailwindConfigFile = value;
          break;
        case '--components-dir':
          flags.overrides.componentsDir = value;
          break;
        case '--alias-prefix':
          flags.overrides.aliasPrefix = value;
          break;
        case '--color-format':
          flags.overrides.colorFormat = choice(value, ['css', 'hsl-channels']);
          break;
        case '--package-manager':
          flags.overrides.packageManager = choice(value, [
            'npm',
            'pnpm',
            'yarn',
            'bun',
          ]);
          break;
        case '--revision':
          flags.revision = value;
          break;
        case '--registry':
          flags.registry = value;
          break;
      }

      continue;
    }

    if (separator !== -1) throw new Error(`Unknown option: ${key}`);

    if (key === '--dry-run' || key === '--preview') flags.dryRun = true;
    else if (key === '--yes' || key === '-y') flags.yes = true;
    else if (key === '--overwrite') flags.overwrite = true;
    else if (key === '--json') flags.json = true;
    else if (key === '--help' || key === '-h') flags.help = true;
    else throw new Error(`Unknown option: ${key}`);
  }

  return flags;
}

function variant(profile: ProjectProfile): RegistryVariant {
  return {
    framework:
      profile.framework === 'nuxt' || profile.framework === 'vite-vue'
        ? 'vue'
        : 'react',
    base: profile.base,
    tailwind: profile.tailwind,
    language: profile.language,
  };
}

function printablePlan(plan: InstallPlan) {
  return {
    revision: plan.revision,
    files: plan.files.map((file) => ({
      path: relative(plan.profile.cwd, file.path).replaceAll('\\', '/'),
      action: file.kept ? 'keep' : file.action,
      ...(file.kept && { reason: file.kept.reason }),
    })),
    dependencies: plan.dependencies,
    dependencyInstalls: plan.dependencyInstalls?.map((install) => ({
      cwd: relative(plan.profile.cwd, install.profile.cwd).replaceAll(
        '\\',
        '/'
      ),
      dependencies: install.dependencies,
    })),
    manualSteps: plan.manualSteps,
  };
}

function fileDiff(path: string, before: string | undefined, content: string) {
  return [
    `--- ${before === undefined ? '/dev/null' : path}`,
    `+++ ${path}`,
    ...(before ?? '').split('\n').map((line) => `-${line}`),
    ...content.split('\n').map((line) => `+${line}`),
  ].join('\n');
}

function diffPlan(plan: InstallPlan): string {
  return plan.files
    .filter((file) => file.action !== 'skip')
    .map((file) =>
      fileDiff(
        relative(plan.profile.cwd, file.path).replaceAll('\\', '/'),
        file.before,
        file.content
      )
    )
    .join('\n');
}

const conflictText: Record<ConflictReason, string> = {
  edited: 'has changes since uitheme installed it',
  existing: 'already exists and differs from the uitheme version',
  'no-cn': 'does not export a callable cn, and the controls import one',
};

const keep = 'Keep my file',
  overwrite = 'Overwrite',
  showDiff = 'Show the diff';

// Ask about each file that differs from the uitheme version. `--yes`,
// `--dry-run` and a missing terminal never ask, so the CLI keeps the file.
function conflictResolver(
  flags: Flags,
  io: CliIO,
  stdout: (text: string) => void
): ConflictResolver | undefined {
  const select = io.select;

  if (flags.yes || flags.dryRun || !select) return;

  return async (conflict) => {
    let choices = [keep, overwrite, showDiff];

    while (true) {
      const answer = await select(
        `${conflict.path} ${conflictText[conflict.reason]}. Overwrite it?`,
        choices,
        keep
      );

      if (answer === undefined) return;

      if (answer === overwrite) return 'overwrite';

      if (answer !== showDiff) return 'keep';
      stdout(fileDiff(conflict.path, conflict.before, conflict.content));
      choices = [keep, overwrite];
    }
  };
}

const frameworkChoices = async (cwd: string) => {
  const pkg = JSON.parse(
    (await readOptional(join(cwd, 'package.json'))) ?? '{}'
  );

  const dependencies = { ...pkg.devDependencies, ...pkg.dependencies };
  const choices: NonNullable<ProjectOverrides['framework']>[] = [];

  if (dependencies.next) choices.push('next');

  if (dependencies['@tanstack/react-start']) choices.push('tanstack');

  if (dependencies.nuxt) choices.push('nuxt');

  if (!choices.length && dependencies.vite) {
    if (dependencies.react) choices.push('vite-react');

    if (dependencies.vue) choices.push('vite-vue');
  }

  return choices;
};

// Detect the project, and ask when the framework is ambiguous or the saved
// base does not fit the framework. Each answer sets an override, so each
// question comes at most once.
async function detectWithPrompts(
  flags: Flags,
  io: CliIO
): Promise<ProjectProfile> {
  while (true) {
    try {
      return await detectProject(flags.overrides);
    } catch (error) {
      if (!io.select || !(error instanceof Error)) throw error;

      if (error instanceof BaseMismatchError) {
        if (flags.overrides.base || flags.yes) throw error;

        const choices: ProjectProfile['base'][] =
          error.framework === 'nuxt' || error.framework === 'vite-vue'
            ? ['reka']
            : ['base-ui', 'radix'];

        const selected = await io.select(
          `uitheme.json saves the ${error.base} base, which does not work with ${error.framework}. Select the base to save instead`,
          choices,
          choices[0]
        );

        const base = choices.find((item) => item === selected);

        if (!base) throw error;
        flags.overrides.base = base;
        continue;
      }

      if (!error.message.includes('ambiguous') || flags.overrides.framework)
        throw error;

      const choices = await frameworkChoices(
        resolve(flags.overrides.cwd ?? process.cwd())
      );

      const selected = await io.select(
        'Select the framework for this application',
        choices
      );

      const framework = choices.find((item) => item === selected);

      if (!framework) throw error;
      flags.overrides.framework = framework;
    }
  }
}

const help = `uitheme <info|init|list|add|diff|migrate> [components] [options]\n\n--cwd <app>             Select an existing application\n--base <base-ui|radix|reka>\n--framework <vite-react|vite-vue|next|tanstack|nuxt>\n--tailwind <3|4>        Match the installed Tailwind major\n--language <ts|js>\n--revision <revision>  Select an immutable registry revision\n--registry <url>       Use another registry (env: UITHEME_REGISTRY_URL)\n--css <file>\n--components-dir <dir>\n--dry-run, --preview   Print changes without writing files\n--yes                  Apply without questions; keeps files that differ\n--overwrite            Replace files that differ from the registry\n--json                 Print structured output\n\nEnvironment:\nUITHEME_REGISTRY_URL   Use another registry (--registry wins)\nUITHEME_WEB_VERSION    Install uitheme-web from a dist-tag, version, or .tgz path\n`;

export async function runCli(args: string[], io: CliIO = {}): Promise<number> {
  const stdout = io.stdout ?? console.log,
    stderr = io.stderr ?? console.error;

  try {
    const command = args[0] ?? '--help';

    if (command === '--help' || command === '-h') {
      stdout(help);

      return 0;
    }

    if (command === '--version' || command === '-v') {
      stdout(`uitheme-cli ${await cliVersion()}`);

      return 0;
    }

    if (!['info', 'init', 'list', 'add', 'diff', 'migrate'].includes(command))
      throw new Error(`Unknown command: ${command}`);

    if (command === 'migrate') {
      return await (io.migrate ?? runMigration)(args.slice(1), io);
    }

    const flags = parseFlags(args.slice(1));

    if (flags.help) {
      stdout(help);

      return 0;
    }

    let profile = await detectWithPrompts(flags, io);

    if (
      command === 'init' &&
      io.select &&
      !flags.yes &&
      !flags.overrides.base &&
      !(await readConfig(profile.cwd))?.base &&
      profile.base !== 'reka'
    ) {
      const selected = await io.select(
        'Select the React component base',
        ['base-ui', 'radix'],
        profile.base
      );

      if (selected && selected !== 'base-ui' && selected !== 'radix')
        throw new Error('Invalid React component base');

      if (selected === 'base-ui' || selected === 'radix')
        profile = { ...profile, base: selected };
    }

    if (command === 'info') {
      stdout(JSON.stringify(profile, null, 2));

      return 0;
    }

    const webVersion = await installedWebVersion(profile);

    if (
      command !== 'init' &&
      webVersion &&
      !satisfiesRelease(webVersion, '^2.0.0')
    )
      throw new Error(
        `Incompatible uitheme-web ${webVersion}. Run migration before installing v2 controls.`
      );

    // The controls need the provider that init adds. uitheme.json is the
    // sign that init or an earlier add ran in this application.
    let setupCode = 0;

    if (command === 'add' && !(await readConfig(profile.cwd))) {
      const notSetUp = "UI-Theme isn't set up in this app yet.";

      const answer =
        io.select && !flags.yes && !flags.dryRun
          ? await io.select(
              `${notSetUp} The controls need its provider. Run init first?`,
              ['Run init first', 'Add the controls only'],
              'Run init first'
            )
          : undefined;

      if (flags.dryRun)
        stderr(`${notSetUp} Run \`uitheme init\` before you apply this plan.`);
      else if (answer === undefined)
        throw new Error(
          `${notSetUp} Run \`uitheme init\` first, then add the controls.`
        );
      else if (answer === 'Run init first') {
        setupCode = await runCli(
          [
            'init',
            ...args
              .slice(1)
              .filter((_, index) => !flags.positions.includes(index)),
          ],
          io
        );

        // A failed or cancelled init leaves no uitheme.json.
        if (setupCode === 1 || !(await readConfig(profile.cwd)))
          return setupCode;
        profile = await detectWithPrompts(flags, io);
      }
    }

    const env = io.env ?? process.env,
      origin = resolveRegistryOrigin({
        flag: flags.registry,
        env: env.UITHEME_REGISTRY_URL,
      }),
      webDependency = resolveWebDependency(env.UITHEME_WEB_VERSION),
      version = await cliVersion();

    if (origin !== defaultOrigin) stderr(`Registry: ${origin}`);

    if (env.UITHEME_WEB_VERSION) stderr(`Runtime: ${webDependency}`);

    if (version === unreleasedVersion)
      stderr('Unreleased CLI build: skipping the CLI version check.');

    const registry =
      io.registry ??
      createRegistryClient({
        cliVersion: version,
        webVersion: webVersion ?? '2.0.0',
        revision: flags.revision,
        origin,
      });

    if (command === 'list') {
      const items = await registry.list(variant(profile));
      stdout(
        flags.json
          ? JSON.stringify(
              items.map((item) => ({
                name: item.meta.uiTheme.component,
                title: item.title,
                description: item.description,
              })),
              null,
              2
            )
          : items
              .map(
                (item) => `${item.meta.uiTheme.component}\t${item.description}`
              )
              .join('\n')
      );

      return 0;
    }

    let plan: InstallPlan;

    if (command === 'init')
      plan = await planInit(profile, {
        ...flags,
        webDependency,
        resolveConflict: conflictResolver(flags, io, stdout),
      });
    else {
      const names = flags.components.length
        ? flags.components
        : command === 'diff'
          ? Object.keys((await readConfig(profile.cwd))?.installed ?? {})
          : [];

      if (!names.length)
        throw new Error(
          `${command} requires component names${command === 'diff' ? ' or previously installed components' : ''}`
        );
      const graph = await registry.resolve(names, variant(profile));
      plan = await planRegistryInstall(profile, graph, {
        ...flags,
        webDependency,
        diff: command === 'diff',
        resolveConflict: conflictResolver(flags, io, stdout),
      });
    }

    stdout(
      flags.json
        ? JSON.stringify(printablePlan(plan), null, 2)
        : command === 'diff'
          ? diffPlan(plan) || 'No source changes.'
          : describePlan(plan)
    );

    if (flags.dryRun || command === 'diff') return 0;

    if (!flags.yes) {
      const confirmed = await io.confirm?.(plan);

      if (confirmed === false) {
        stdout('Cancelled. Nothing changed.');

        return setupCode;
      }

      if (!confirmed)
        throw new Error(
          'Confirmation required. Use --yes to apply this plan, or --dry-run to preview.'
        );
    }

    await applyPlan(plan, { runInstall: io.runInstall });

    // Files that nobody chose to keep exit with 2, so a script can find them.
    const unanswered = plan.files
      .filter((file) => file.kept && !file.kept.asked)
      .map((file) =>
        relative(plan.profile.cwd, file.path).replaceAll('\\', '/')
      );

    if (unanswered.length)
      stdout(
        [
          'Kept these files, because they differ from the uitheme version:',
          ...unanswered.map((path) => `  ${path}`),
          'Run `uitheme diff` to compare them, or run again with --overwrite to replace them.',
        ].join('\n')
      );

    if (plan.manualSteps.length) {
      stdout('Setup status: manual-required. Complete the steps above.');

      return 2;
    }

    if (unanswered.length) return 2;

    stdout(
      command === 'init'
        ? 'Setup complete.'
        : `Installation complete (${plan.revision}).`
    );

    return setupCode;
  } catch (error) {
    stderr(error instanceof Error ? error.message : String(error));

    return 1;
  }
}
