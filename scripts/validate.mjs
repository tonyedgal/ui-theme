import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectChecks } from './validation-plan.mjs';

export function validate(files, { ci = false, root = process.cwd() } = {}) {
  const plan = selectChecks(files, { ci });
  console.log(JSON.stringify(plan, null, 2));

  const run = (...args) =>
    execFileSync('pnpm', args, {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, CI: '1' },
    });

  const existing = files.filter((file) => existsSync(resolve(root, file)));

  const checked = ci
    ? existing.filter((file) => !file.startsWith('apps/examples/'))
    : existing;

  if (checked.length) {
    run('exec', 'prettier', '--check', '--ignore-unknown', ...checked);

    const source = checked.filter((file) =>
      /\.(m?[jt]sx?|cjs|cts|vue)$/.test(file)
    );

    if (source.length) run('exec', 'eslint', '--max-warnings', '0', ...source);
  }

  if (plan.tooling) run('test:validation');

  if (plan.website) run('--filter', 'ui-theme-web', 'postinstall');

  const targets = [
    ...plan.packages,
    ...plan.examples,
    ...(plan.website ? ['ui-theme-web'] : []),
  ];

  if (targets.length) {
    const filters = targets.map((name) => `--filter=${name}`);
    run('exec', 'turbo', 'run', 'build', ...filters);
    run('exec', 'turbo', 'run', 'typecheck', ...filters);
  }

  for (const name of plan.packages) {
    if (name === 'uitheme-web') {
      run('--filter', name, 'test');
      run('--filter', name, 'test:types');
    }

    if (name === 'uitheme-rn') run('--filter', name, 'test');
    run('--filter', name, 'test:package');
  }

  for (const suite of plan.browsers) {
    const name = suite === 'website' ? 'ui-theme-web' : `uitheme-${suite}`;
    run('--filter', name, 'test:browser');
  }

  for (const name of plan.consumers) {
    const script = name === 'rn' ? 'native' : name;
    execFileSync(
      process.execPath,
      [`scripts/check-${script}-release-consumer.mjs`],
      {
        cwd: root,
        stdio: 'inherit',
        env: { ...process.env, CI: '1' },
      }
    );
  }

  return plan;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const args = process.argv.slice(2);
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const ci = args.includes('--ci');
  let files;

  if (args.includes('--files')) {
    files = JSON.parse(readFileSync(args[args.indexOf('--files') + 1], 'utf8'));
  } else if (args.includes('--all')) {
    files = ['package.json'];
  } else {
    const base = process.env.BASE_SHA;
    const head = process.env.HEAD_SHA || 'HEAD';
    files =
      base && !/^0+$/.test(base)
        ? execFileSync(
            'git',
            ['diff', '--no-renames', '--name-only', '-z', `${base}...${head}`],
            { cwd: root, encoding: 'utf8' }
          )
            .split('\0')
            .filter(Boolean)
        : ['package.json'];
  }

  if (process.env.GITHUB_OUTPUT) {
    let release = args.includes('--release');

    if (
      files.some(
        (file) =>
          /^\.changeset\/.+\.md$/.test(file) && !file.endsWith('/README.md')
      )
    )
      release = true;

    for (const folder of ['ui-theme', 'ui-theme-rn', 'ui-theme-vue']) {
      const file = `packages/${folder}/package.json`;

      if (!files.includes(file)) continue;

      try {
        const before = JSON.parse(
          execFileSync('git', ['show', `${process.env.BASE_SHA}:${file}`], {
            cwd: root,
            encoding: 'utf8',
          })
        );

        const after = JSON.parse(readFileSync(resolve(root, file), 'utf8'));

        if (before.version !== after.version) release = true;
      } catch {
        release = true;
      }
    }

    writeFileSync(process.env.GITHUB_OUTPUT, `release=${release}\n`, {
      flag: 'a',
    });
  }

  const report = resolve(root, 'test-results/validation-plan.json');
  mkdirSync(dirname(report), { recursive: true });
  writeFileSync(report, JSON.stringify(selectChecks(files, { ci }), null, 2));

  if (!args.includes('--plan')) validate(files, { ci, root });
}
