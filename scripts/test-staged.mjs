import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  writeFileSync,
  rmSync,
  mkdirSync,
  cpSync,
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
}).trim();

const files = execFileSync(
  'git',
  [
    'diff',
    '--cached',
    '--no-renames',
    '--name-only',
    '-z',
    '--diff-filter=ACMRD',
  ],
  { cwd: root, encoding: 'utf8' }
)
  .split('\0')
  .filter(Boolean);

if (!files.length) process.exit(0);

const snapshot = mkdtempSync(join(tmpdir(), 'uitheme-staged-'));

let failed = false;

try {
  execFileSync('git', ['checkout-index', '--all', `--prefix=${snapshot}/`], {
    cwd: root,
    stdio: 'inherit',
  });
  const list = join(snapshot, '.staged-files.json');
  writeFileSync(list, JSON.stringify(files));
  execFileSync(
    'pnpm',
    ['install', '--offline', '--frozen-lockfile', '--ignore-scripts'],
    {
      cwd: snapshot,
      stdio: 'inherit',
      env: { ...process.env, CI: '1' },
    }
  );
  execFileSync(process.execPath, ['scripts/validate.mjs', '--files', list], {
    cwd: snapshot,
    stdio: 'inherit',
    env: { ...process.env, CI: '1' },
  });
} catch (error) {
  failed = true;
  console.error(
    'Staged validation failed. Fix the staged files, or run pnpm install / test:browsers:install if local dependencies or browsers are missing.'
  );
  process.exitCode = error.status || 1;
} finally {
  const evidence = join(root, 'test-results/staged-validation');
  rmSync(evidence, { recursive: true, force: true });
  mkdirSync(evidence, { recursive: true });
  writeFileSync(join(evidence, 'files.json'), JSON.stringify(files, null, 2));

  for (const path of [
    'test-results',
    'packages/ui-theme/test-results',
    'packages/ui-theme-vue/test-results',
    'packages/ui-theme-vue/playwright-report',
    'apps/ui-theme-web/test-results',
  ]) {
    const source = join(snapshot, path);

    if (existsSync(source))
      cpSync(source, join(evidence, path), { recursive: true });
  }

  if (failed) console.error(`Evidence: ${evidence}`);
  rmSync(snapshot, { recursive: true, force: true });
}
