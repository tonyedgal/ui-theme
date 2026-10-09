import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const directory = mkdtempSync(join(tmpdir(), 'uitheme-rn-package-'));

try {
  const result = JSON.parse(
    execFileSync(
      'npm',
      [
        'pack',
        '--json',
        '--ignore-scripts',
        // A publish preview still needs an actual local tarball for this check.
        '--dry-run=false',
        '--pack-destination',
        directory,
      ],
      { cwd: root, encoding: 'utf8' }
    )
  );

  execFileSync('tar', [
    '-xzf',
    join(directory, result[0].filename),
    '-C',
    directory,
  ]);
  const extracted = join(directory, 'package');

  const manifest = JSON.parse(
    readFileSync(join(extracted, 'package.json'), 'utf8')
  );

  for (const name of [
    '.',
    './core',
    './expo',
    './reanimated',
    './transitions',
    './nativewind',
    './uniwind',
  ]) {
    const entry = manifest.exports[name];

    for (const format of ['import', 'require']) {
      assert.ok(readFileSync(join(extracted, entry[format].types)).length);
      assert.ok(readFileSync(join(extracted, entry[format].default)).length);
    }
  }

  for (const path of [
    'dist/index.js',
    'dist/index.cjs',
    'dist/core.js',
    'dist/core.cjs',
  ]) {
    const source = readFileSync(join(extracted, path), 'utf8');
    assert.ok(
      !/react-dom|@expo\/ui|react-native-reanimated|react-native-worklets|@shopify\/react-native-skia|nativewind|uniwind|localStorage|document\./.test(
        source
      ),
      `Unexpected runtime dependency in ${path}`
    );
  }

  const consumer = join(directory, 'consumer');
  mkdirSync(consumer);
  writeFileSync(
    join(consumer, 'package.json'),
    JSON.stringify({
      private: true,
      dependencies: {
        'uitheme-rn': `file:${join(directory, result[0].filename)}`,
      },
    })
  );
  execFileSync(
    'npm',
    [
      'install',
      // Install into the temporary consumer even during a publish preview.
      '--dry-run=false',
      '--ignore-scripts',
      '--omit=dev',
      '--omit=peer',
      '--legacy-peer-deps',
      '--no-audit',
      '--no-fund',
    ],
    { cwd: consumer, stdio: 'pipe', timeout: 120000 }
  );

  for (const peer of [
    '@expo/ui',
    'react-native-reanimated',
    'react-native-worklets',
    '@shopify/react-native-skia',
    'nativewind',
    'uniwind',
  ]) {
    assert.equal(manifest.peerDependenciesMeta[peer].optional, true);
    assert.equal(existsSync(join(consumer, 'node_modules', peer)), false);
  }

  const packed = join(consumer, 'node_modules', 'uitheme-rn');

  const esm = await import(
    pathToFileURL(join(packed, manifest.exports['./core'].import.default)).href
  );

  const cjs = createRequire(import.meta.url)(
    join(packed, manifest.exports['./core'].require.default)
  );

  for (const module of [esm, cjs]) {
    const store = module.createThemeStore({ colorThemes: ['default'] });
    store.setTheme('dark');
    assert.equal(store.getSnapshot().resolvedTheme, 'dark');
  }

  console.log(
    'Packed ESM/CJS core runs; public entries and declarations exist; native core has no web or Expo dependency.'
  );
} finally {
  rmSync(directory, { recursive: true, force: true });
}
