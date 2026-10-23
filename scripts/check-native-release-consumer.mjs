import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const directory = mkdtempSync(join(tmpdir(), 'uitheme-release-consumers-'));

const evidence = join(root, 'test-results/release-consumers-native');

rmSync(evidence, { recursive: true, force: true });

mkdirSync(evidence, { recursive: true });

function write(folder, name, value) {
  const path = join(folder, name);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value);
}

function command(folder, binary, args, name) {
  console.log(`Checking ${name}...`);

  try {
    const output = execFileSync(binary, args, {
      cwd: folder,
      encoding: 'utf8',
      timeout: 240_000,
      stdio: 'pipe',
    });

    write(evidence, `${name}.log`, output);
  } catch (error) {
    write(
      evidence,
      `${name}.log`,
      `${error.stdout ?? ''}\n${error.stderr ?? ''}`
    );
    throw new Error(`${name} failed. See ${join(evidence, `${name}.log`)}`, {
      cause: error,
    });
  }
}

function install(folder, name) {
  command(
    folder,
    'npm',
    ['install', '--ignore-scripts', '--no-audit', '--no-fund'],
    name
  );
}

function tool(folder, name, args, log) {
  command(
    folder,
    process.execPath,
    [join(folder, 'node_modules', name), ...args],
    log
  );
}

function pack(name) {
  const folder = join(root, 'packages', `ui-theme-${name}`);
  command(
    folder,
    'pnpm',
    ['pack', '--pack-destination', directory],
    `${name}-pack`
  );

  return join(
    directory,
    readdirSync(directory).find(
      (file) => file.startsWith(`uitheme-${name}-`) && file.endsWith('.tgz')
    )
  );
}

try {
  const rnArchive = pack('rn');
  const rn = join(directory, 'rn');
  write(
    rn,
    'package.json',
    JSON.stringify({
      private: true,
      type: 'module',
      dependencies: {
        'uitheme-rn': `file:${rnArchive}`,
        react: '19.2.3',
        'react-native': '0.86.3',
      },
      devDependencies: { typescript: '6.0.3', '@types/react': '19.2.2' },
    })
  );
  install(rn, 'rn-install');
  write(
    rn,
    'consumer.mts',
    `import {createThemeStore} from 'uitheme-rn/core'; import {UIThemeProvider, useUITheme, defaultPalettes} from 'uitheme-rn'; const store=createThemeStore({colorThemes:['default']}); store.setTheme('dark'); if(store.getSnapshot().resolvedTheme!=='dark') throw new Error('state'); void UIThemeProvider; void useUITheme; void defaultPalettes;`
  );
  write(
    rn,
    'tsconfig.json',
    JSON.stringify({
      compilerOptions: {
        noEmit: true,
        target: 'ES2022',
        lib: ['ES2022'],
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        strict: true,
        skipLibCheck: false,
        types: ['react'],
      },
      include: ['consumer.mts'],
    })
  );
  tool(rn, 'typescript/bin/tsc', ['-p', 'tsconfig.json'], 'rn-declarations');
  const rnManifest = JSON.parse(readFileSync(join(rn, 'package.json'), 'utf8'));
  Object.assign(rnManifest.dependencies, {
    expo: '57.0.27',
    '@expo/ui': '57.0.22',
    '@shopify/react-native-skia': '2.11.1',
    'react-native-reanimated': '4.5.1',
    'react-native-worklets': '0.10.1',
    nativewind: '5.0.0-rc.0',
    'react-native-css': '3.1.0-rc.0',
    uniwind: '1.12.2',
    tailwindcss: '4.3.1',
  });
  rnManifest.main = 'index.tsx';
  write(rn, 'package.json', JSON.stringify(rnManifest));
  install(rn, 'rn-optional-install');
  write(
    rn,
    'index.tsx',
    `
import {registerRootComponent} from 'expo';
import {createElement} from 'react';
import {View} from 'react-native';
import {UIThemeProvider} from 'uitheme-rn';
import {UIThemeSelector} from 'uitheme-rn/expo';
import {useThemeTransition} from 'uitheme-rn/reanimated';
import {UIThemeTransitionProvider} from 'uitheme-rn/transitions';
import {NativeWindTheme} from 'uitheme-rn/nativewind';
import {UniwindTheme} from 'uitheme-rn/uniwind';
const entries=[UIThemeSelector,useThemeTransition,UIThemeTransitionProvider,NativeWindTheme,UniwindTheme];
if(entries.some(entry=>!entry))throw new Error('missing entry');
function App(){return createElement(UIThemeProvider,{children:createElement(View)});}
registerRootComponent(App);
`
  );
  const rnConfig = JSON.parse(readFileSync(join(rn, 'tsconfig.json'), 'utf8'));
  rnConfig.compilerOptions.skipLibCheck = true;
  rnConfig.compilerOptions.jsx = 'react-jsx';
  rnConfig.include = ['index.tsx'];
  write(rn, 'tsconfig.json', JSON.stringify(rnConfig));
  tool(
    rn,
    'typescript/bin/tsc',
    ['-p', 'tsconfig.json'],
    'rn-optional-declarations'
  );

  for (const platform of ['ios', 'android'])
    tool(
      rn,
      'expo/bin/cli',
      ['export', '--platform', platform, '--output-dir', `.output/${platform}`],
      `rn-metro-${platform}`
    );
  write(
    evidence,
    'summary.json',
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        rn: {
          standaloneInstall: true,
          strictRootDeclarations: true,
          optionalDeclarations: true,
          metro: ['ios', 'android'],
          deviceRendering: false,
        },
      },
      null,
      2
    )
  );
  console.log(`Independent RN consumer passed. Evidence: ${evidence}`);
} finally {
  rmSync(directory, { recursive: true, force: true });
}
