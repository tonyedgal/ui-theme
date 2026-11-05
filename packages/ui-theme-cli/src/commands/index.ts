import { relative, resolve, join } from 'node:path';
import { detectProject } from '../project.ts';
import { readConfig } from '../config.ts';
import {
  createRegistryClient,
  defaultOrigin,
  resolveRegistryOrigin,
} from '../registry.ts';
import {
  applyPlan,
  describePlan,
  planRegistryInstall,
  readOptional,
} from '../install/index.ts';
import { planInit } from '../install/setup.ts';
import { cliVersion, installedWebVersion } from './version.ts';
import semver from 'semver';
import { runMigration } from './migrate.ts';
import type { InstallPlan, InstallRunner } from '../install/index.ts';
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
  confirm?: (plan: InstallPlan) => Promise<boolean>;
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
      action: file.action,
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

function diffPlan(plan: InstallPlan): string {
  return plan.files
    .filter((file) => file.action !== 'skip')
    .map((file) => {
      const path = relative(plan.profile.cwd, file.path).replaceAll('\\', '/');

      return [
        `--- ${file.before === undefined ? '/dev/null' : path}`,
        `+++ ${path}`,
        ...(file.before ?? '').split('\n').map((line) => `-${line}`),
        ...file.content.split('\n').map((line) => `+${line}`),
      ].join('\n');
    })
    .join('\n');
}

const help = `uitheme <info|init|list|add|diff|migrate> [components] [options]\n\n--cwd <app>             Select an existing application\n--base <base-ui|radix|reka>\n--framework <vite-react|vite-vue|next|tanstack|nuxt>\n--tailwind <3|4>        Match the installed Tailwind major\n--language <ts|js>\n--revision <revision>  Select an immutable registry revision\n--registry <url>       Use another registry (env: UITHEME_REGISTRY_URL)\n--css <file>\n--components-dir <dir>\n--dry-run, --preview   Print changes without writing files\n--yes                  Apply without a confirmation prompt\n--overwrite            Permit replacing edited component files\n--json                 Print structured output\n`;

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

    let profile: ProjectProfile;

    try {
      profile = await detectProject(flags.overrides);
    } catch (error) {
      if (
        !io.select ||
        !(error instanceof Error) ||
        !error.message.includes('ambiguous')
      )
        throw error;
      const cwd = resolve(flags.overrides.cwd ?? process.cwd());

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

      const selected = await io.select(
        'Select the framework for this application',
        choices
      );

      const framework = choices.find((item) => item === selected);

      if (!framework) throw error;
      flags.overrides.framework = framework;
      profile = await detectProject(flags.overrides);
    }

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
        'base-ui'
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
      !semver.satisfies(webVersion, '^2.0.0')
    )
      throw new Error(
        `Incompatible uitheme-web ${webVersion}. Run migration before installing v2 controls.`
      );

    const origin = resolveRegistryOrigin({
      flag: flags.registry,
      env: (io.env ?? process.env).UITHEME_REGISTRY_URL,
    });

    if (origin !== defaultOrigin) stderr(`Registry: ${origin}`);

    const registry =
      io.registry ??
      createRegistryClient({
        cliVersion: await cliVersion(),
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

    if (command === 'init') plan = await planInit(profile, flags);
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
        diff: command === 'diff',
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

    if (!flags.yes && !(await io.confirm?.(plan)))
      throw new Error(
        'Confirmation required. Use --yes to apply this plan, or --dry-run to preview.'
      );
    await applyPlan(plan, { runInstall: io.runInstall });

    if (plan.manualSteps.length) {
      stdout('Setup status: manual-required. Complete the steps above.');

      return 2;
    }

    stdout(
      command === 'init'
        ? 'Setup complete.'
        : `Installation complete (${plan.revision}).`
    );

    return 0;
  } catch (error) {
    stderr(error instanceof Error ? error.message : String(error));

    return 1;
  }
}
