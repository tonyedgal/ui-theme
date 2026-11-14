import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
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

  const trace = `data:text/javascript,${encodeURIComponent(
    `import { registerHooks } from 'node:module';
    registerHooks({ resolve(specifier, context, next) {
      const result = next(specifier, context);
      process.stderr.write('loaded ' + result.url + '\\n');
      return result;
    } });`
  )}`;

  // the parser is bundled, so find it by a message only its chunk contains
  const loadedParsers = (...args) =>
    [
      ...new Set(
        spawnSync(process.execPath, ['--import', trace, binary, ...args], {
          cwd: directory,
          encoding: 'utf8',
          timeout: 20_000,
        })
          .stderr.match(/^loaded \S+$/gm)
          ?.map((line) => line.slice('loaded '.length))
          .flatMap((url) =>
            /^node:/.test(url)
              ? []
              : (/\/node_modules\/(typescript|postcss)\//.exec(url)?.[1] ??
                (url.startsWith('file:') &&
                readFileSync(fileURLToPath(url), 'utf8').includes(
                  'DeferImportRequiresNamespace'
                )
                  ? '@babel/parser'
                  : []))
          ) ?? []
      ),
    ].sort();

  assert.equal(run('--version').trim(), `uitheme-cli ${manifest.version}`);
  assert.match(run('--help'), /info\|init\|list\|add\|diff\|migrate/);
  assert.deepEqual(loadedParsers('--help'), []);
  assert.deepEqual(loadedParsers('--version'), []);
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
    join(app, 'tsconfig.json'),
    '{ // aliases\n "compilerOptions": { "paths": { "@/*": ["./src/*"], }, }, }'
  );
  assert.deepEqual(loadedParsers('info', '--cwd', app, '--json'), []);
  writeFileSync(
    join(app, 'legacy.ts'),
    "import { useTheme } from '@ui-theme/web/react';\n"
  );
  const before = readFileSync(join(app, 'legacy.ts'), 'utf8');
  assert.match(run('migrate', '--cwd', app, '--dry-run'), /uitheme-web\/react/);
  assert.equal(readFileSync(join(app, 'legacy.ts'), 'utf8'), before);
  assert.deepEqual(loadedParsers('migrate', '--cwd', app, '--dry-run'), [
    '@babel/parser',
  ]);
  assert.ok(
    !Object.keys(
      JSON.parse(
        readFileSync(
          join(directory, 'node_modules/uitheme-cli/package.json'),
          'utf8'
        )
      ).dependencies
    ).includes('typescript')
  );
  console.log(
    'Packed CLI installs independently and runs its binary, detector, and migration preview.'
  );
} finally {
  rmSync(directory, { recursive: true, force: true });
}
