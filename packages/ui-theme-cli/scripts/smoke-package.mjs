import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

const directory = mkdtempSync(join(tmpdir(), 'uitheme-cli-consumer-'));

try {
  execFileSync('pnpm', ['pack', '--pack-destination', directory], {
    cwd: root,
    stdio: 'pipe',
  });
  const archive = readdirSync(directory).find((file) => file.endsWith('.tgz'));
  assert.ok(archive);
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  writeFileSync(
    join(directory, 'package.json'),
    JSON.stringify({
      private: true,
      dependencies: { 'uitheme-cli': `file:${join(directory, archive)}` },
    })
  );
  execFileSync(
    'npm',
    ['install', '--ignore-scripts', '--no-audit', '--no-fund'],
    { cwd: directory, stdio: 'pipe', timeout: 120_000 }
  );
  const binary = join(directory, 'node_modules/uitheme-cli/dist/index.js');

  const run = (...args) =>
    execFileSync(process.execPath, [binary, ...args], {
      cwd: directory,
      encoding: 'utf8',
      timeout: 20_000,
    });

  assert.equal(run('--version').trim(), `uitheme-cli ${manifest.version}`);
  assert.match(run('--help'), /info\|init\|list\|add\|diff\|migrate/);
  const app = join(directory, 'app');
  mkdirSync(join(app, 'src'), { recursive: true });
  writeFileSync(
    join(app, 'package.json'),
    JSON.stringify({
      dependencies: { vite: '^7.3.0', react: '^19.0.0', tailwindcss: '^4.0.0' },
    })
  );
  writeFileSync(join(app, 'src/styles.css'), '@import "tailwindcss";');
  const profile = JSON.parse(run('info', '--cwd', app, '--json'));
  assert.equal(profile.framework, 'vite-react');
  assert.equal(profile.tailwind, 4);
  assert.equal(profile.base, 'base-ui');
  writeFileSync(
    join(app, 'legacy.ts'),
    "import { useTheme } from '@ui-theme/web/react';\n"
  );
  const before = readFileSync(join(app, 'legacy.ts'), 'utf8');
  assert.match(run('migrate', '--cwd', app, '--dry-run'), /uitheme-web\/react/);
  assert.equal(readFileSync(join(app, 'legacy.ts'), 'utf8'), before);
  console.log(
    'Packed CLI installs independently and runs its binary, detector, and migration preview.'
  );
} finally {
  rmSync(directory, { recursive: true, force: true });
}
