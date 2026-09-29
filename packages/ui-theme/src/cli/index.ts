import { parseArgs } from 'node:util';
import { bold, dim, red } from 'kleur/colors';
import { runMigrate } from './migrate';

const USAGE = `${bold('uitheme-web')}

${bold('Usage')}
  uitheme-web <command> [options]

${bold('Commands')}
  migrate    Move a project from @ui-theme/web to uitheme-web

${bold('Options')}
  -c, --cwd <dir>   Project directory. Defaults to the current directory
  -y, --yes         Rewrite without asking for confirmation
  -h, --help        Show this help

${dim('Example')}
  npx uitheme-web migrate
`;

function fail(message: string): never {
  process.stderr.write(`${red(message)}\n\n${USAGE}`);
  process.exit(1);
}

async function main(argv: string[]): Promise<void> {
  let values: { cwd?: string; yes?: boolean; help?: boolean };
  let positionals: string[];

  try {
    const parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        cwd: { type: 'string', short: 'c' },
        yes: { type: 'boolean', short: 'y', default: false },
        help: { type: 'boolean', short: 'h', default: false },
      },
    });
    values = parsed.values;
    positionals = parsed.positionals;
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }

  const [command, ...rest] = positionals;

  if (values.help || command === undefined || command === 'help') {
    process.stdout.write(USAGE);
    return;
  }

  if (rest.length > 0) {
    fail(`Unexpected argument: ${rest.join(' ')}`);
  }

  if (command === 'migrate') {
    await runMigrate({
      cwd: values.cwd ?? process.cwd(),
      yes: values.yes ?? false,
    });
    return;
  }

  fail(`Unknown command: ${command}`);
}

main(process.argv.slice(2)).catch((error: unknown) => {
  process.stderr.write(
    `${red('The command failed.')} ${
      error instanceof Error ? error.message : String(error)
    }\n`
  );
  process.exitCode = 1;
});
