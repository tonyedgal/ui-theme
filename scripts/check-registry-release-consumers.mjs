import assert from 'node:assert/strict';
import { selectReleaseVersion } from './release-version.mjs';
import getReleasePlan from '@changesets/get-release-plan';
import { execFile, execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { promisify } from 'node:util';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildRegistry } from '../packages/ui-theme-registry/src/build.ts';
import { createRegistryClient } from '../packages/ui-theme-cli/src/registry.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const temporary = realpathSync(
  mkdtempSync(join(tmpdir(), 'uitheme-registry-consumers-'))
);

const evidence = join(root, 'test-results/release-consumers-registry');

const registryRequire = createRequire(
  join(root, 'packages/ui-theme-registry/package.json')
);

const cliRequire = createRequire(
  join(root, 'packages/ui-theme-cli/package.json')
);

const webRequire = createRequire(join(root, 'packages/ui-theme/package.json'));

const cssRequire = createRequire(join(root, 'apps/ui-theme-web/package.json'));

const results = [];

let browser;

let registryServer;

let preview;

rmSync(evidence, { recursive: true, force: true });

mkdirSync(evidence, { recursive: true });

function write(folder, name, content) {
  const path = join(folder, name);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function command(folder, executable, args, label) {
  console.log(`Checking ${label}...`);

  try {
    const output = execFileSync(executable, args, {
      cwd: folder,
      encoding: 'utf8',
      timeout: 180_000,
      stdio: 'pipe',
    });

    write(evidence, `${label}.log`, output);

    return output;
  } catch (error) {
    write(
      evidence,
      `${label}.log`,
      `${error.stdout ?? ''}\n${error.stderr ?? ''}`
    );
    throw new Error(`${label} failed; see ${join(evidence, `${label}.log`)}`, {
      cause: error,
    });
  }
}

async function asynchronousCommand(folder, args, label) {
  console.log(`Checking ${label}...`);

  try {
    const { stdout, stderr } = await promisify(execFile)(
      process.execPath,
      args,
      {
        cwd: folder,
        encoding: 'utf8',
        timeout: 180_000,
        env: { ...process.env, NODE_ENV: 'development' },
      }
    );

    write(evidence, `${label}.log`, stdout + stderr);
  } catch (error) {
    write(
      evidence,
      `${label}.log`,
      `${error.stdout ?? ''}\n${error.stderr ?? ''}`
    );
    throw new Error(`${label} failed; see ${join(evidence, `${label}.log`)}`, {
      cause: error,
    });
  }
}

function packageDirectory(require, name) {
  let path = dirname(require.resolve(name));

  while (
    !existsSync(join(path, 'package.json')) ||
    JSON.parse(readFileSync(join(path, 'package.json'), 'utf8')).name !== name
  ) {
    const parent = dirname(path);
    assert.notEqual(parent, path, `Cannot find ${name}`);
    path = parent;
  }

  return path;
}

function link(folder, name, source) {
  const target = join(folder, 'node_modules', name);
  mkdirSync(dirname(target), { recursive: true });
  symlinkSync(source, target, 'dir');
}

function candidate(name, version) {
  const original = join(
    root,
    'packages',
    name === 'uitheme-web' ? 'ui-theme' : 'ui-theme-cli'
  );

  const staging = join(temporary, `${name}-candidate`);
  mkdirSync(staging);
  cpSync(join(original, 'dist'), join(staging, 'dist'), { recursive: true });

  const manifest = JSON.parse(
    readFileSync(join(original, 'package.json'), 'utf8')
  );

  manifest.version = version;
  delete manifest.scripts;
  write(staging, 'package.json', JSON.stringify(manifest));

  const packed = JSON.parse(
    command(
      staging,
      'npm',
      ['pack', '--json', '--ignore-scripts'],
      `${name}-pack`
    )
  )[0];

  const extracted = join(temporary, `${name}-extracted`);
  mkdirSync(extracted);
  command(
    extracted,
    'tar',
    ['-xzf', join(staging, packed.filename)],
    `${name}-extract`
  );
  cpSync(join(staging, packed.filename), join(evidence, packed.filename));

  return join(extracted, 'package');
}

async function listen(server) {
  await new Promise((resolveReady, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveReady);
  });

  return `http://127.0.0.1:${server.address().port}`;
}

try {
  const plan = await getReleasePlan(root);
  write(evidence, 'release-plan.json', JSON.stringify(plan, null, 2));

  const version = (name) => {
    const manifestPath = join(
      root,
      'packages',
      name === 'uitheme-web' ? 'ui-theme' : 'ui-theme-cli',
      'package.json'
    );

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

    return selectReleaseVersion(name, manifest.version, plan.releases);
  };

  const webVersion = version('uitheme-web');
  const cliVersion = version('uitheme-cli');
  const web = candidate('uitheme-web', webVersion);
  const cli = candidate('uitheme-cli', cliVersion);

  for (const name of ['semver', 'typescript', 'postcss'])
    link(cli, name, packageDirectory(cliRequire, name));
  assert.match(
    command(
      cli,
      process.execPath,
      ['dist/index.js', '--version'],
      'packed-cli-version'
    ),
    new RegExp(cliVersion.replaceAll('.', '\\.'))
  );

  const legacy = join(temporary, 'tailwind3-toolchain');
  write(
    legacy,
    'package.json',
    JSON.stringify({
      private: true,
      dependencies: { tailwindcss: '^3.4.0', 'tailwind-merge': '^2.6.0' },
    })
  );
  command(
    legacy,
    'npm',
    ['install', '--ignore-scripts', '--no-audit', '--no-fund'],
    'tailwind3-install'
  );
  const legacyRequire = createRequire(join(legacy, 'package.json'));
  const tailwind3 = legacyRequire('tailwindcss');
  const postcss = cssRequire('postcss');
  const tailwind4 = cssRequire('@tailwindcss/postcss');
  const tailwind4Directory = packageDirectory(cssRequire, 'tailwindcss');
  const registryDirectory = join(temporary, 'registry');
  registryServer = createServer((request, response) => {
    try {
      const path = resolve(
        registryDirectory,
        `.${new URL(request.url, 'http://local').pathname.replace(/^\/r/, '')}`
      );

      assert.ok(path.startsWith(`${registryDirectory}/`));
      response.setHeader('content-type', 'application/json');
      response.end(readFileSync(path));
    } catch {
      response.writeHead(404);
      response.end('{}');
    }
  });
  const serverOrigin = await listen(registryServer);
  const registryOrigin = 'https://www.ui-theme.dev/r';
  const preload = join(temporary, 'registry-transport.mjs');
  writeFileSync(
    preload,
    `const request = globalThis.fetch; globalThis.fetch = (input, options) => request(String(input).replace('https://www.ui-theme.dev', ${JSON.stringify(serverOrigin)}), options);`
  );

  const registry = await buildRegistry({
    outDir: registryDirectory,
    origin: registryOrigin,
    releaseDir: join(temporary, 'no-releases'),
  });

  write(
    evidence,
    'registry-index.json',
    JSON.stringify(registry.index, null, 2)
  );

  const { build, preview: startPreview } = await import(
    pathToFileURL(registryRequire.resolve('vite')).href
  );

  const vuePlugin = (
    await import(
      pathToFileURL(registryRequire.resolve('@vitejs/plugin-vue')).href
    )
  ).default;

  const { chromium } = webRequire('@playwright/test');
  browser = await chromium.launch();

  for (const framework of ['react', 'vue'])
    for (const base of framework === 'react' ? ['base-ui', 'radix'] : ['reka'])
      for (const tailwind of [3, 4])
        for (const language of ['ts', 'js']) {
          const label = `${framework}-${base}-tw${tailwind}-${language}`;
          console.log(`Checking ${label} emitted registry consumer...`);
          const folder = join(temporary, label);

          const selected = registry.index.items.filter((item) => {
            const meta = item.meta.uiTheme;

            return (
              meta.framework === framework &&
              meta.base === base &&
              meta.tailwind === tailwind &&
              meta.language === language
            );
          });

          assert.equal(selected.length, 7);

          const dependencies = Object.fromEntries(
            selected
              .flatMap((item) => item.dependencies)
              .map((spec) => {
                const separator = spec.lastIndexOf('@');

                return [spec.slice(0, separator), spec.slice(separator + 1)];
              })
          );

          const frameworkDependencies =
            framework === 'react'
              ? Object.fromEntries(
                  ['react', 'react-dom'].map((name) => [
                    name,
                    registryRequire(`${name}/package.json`).version,
                  ])
                )
              : { vue: registryRequire('vue/package.json').version };

          write(
            folder,
            'package.json',
            JSON.stringify({
              name: label,
              private: true,
              type: 'module',
              devDependencies:
                framework === 'react'
                  ? Object.fromEntries(
                      ['@types/react', '@types/react-dom'].map((name) => [
                        name,
                        registryRequire(`${name}/package.json`).version,
                      ])
                    )
                  : {},
              dependencies: {
                ...dependencies,
                ...frameworkDependencies,
                'uitheme-web': webVersion,
                vite: registryRequire('vite/package.json').version,
                tailwindcss:
                  tailwind === 3
                    ? legacyRequire('tailwindcss/package.json').version
                    : cssRequire('tailwindcss/package.json').version,
              },
            })
          );
          cpSync(web, join(folder, 'node_modules/uitheme-web'), {
            recursive: true,
          });

          for (const name of Object.keys(frameworkDependencies))
            link(folder, name, packageDirectory(registryRequire, name));

          for (const name of Object.keys(dependencies))
            link(
              folder,
              name,
              packageDirectory(
                name === 'tailwind-merge' && tailwind === 3
                  ? legacyRequire
                  : registryRequire,
                name
              )
            );
          link(
            folder,
            'tailwindcss',
            tailwind === 3
              ? packageDirectory(legacyRequire, 'tailwindcss')
              : tailwind4Directory
          );
          link(folder, 'vite', packageDirectory(registryRequire, 'vite'));
          link(
            folder,
            '@types/react',
            dirname(registryRequire.resolve('@types/react/package.json'))
          );
          link(
            folder,
            '@types/react-dom',
            dirname(registryRequire.resolve('@types/react-dom/package.json'))
          );
          assert.equal(
            existsSync(join(folder, 'node_modules/reka-ui')),
            framework === 'vue'
          );
          assert.equal(
            existsSync(join(folder, 'node_modules/@base-ui/react')),
            base === 'base-ui'
          );
          assert.equal(
            existsSync(join(folder, 'node_modules/radix-ui')),
            base === 'radix'
          );

          const extension =
            framework === 'react'
              ? language === 'ts'
                ? 'tsx'
                : 'jsx'
              : language;

          write(
            folder,
            'index.html',
            `<html><head><link rel="stylesheet" href="/style.css"></head><body><main id="root"></main><script type="module" src="/src/main.${extension}"></script></body></html>`
          );

          if (framework === 'react') {
            write(
              folder,
              `src/main.${extension}`,
              `import React from 'react'; import { createRoot } from 'react-dom/client'; import { UIThemeProvider, useUITheme } from 'uitheme-web/react'; import {ThemeToggle} from './components/ui/theme-toggle'; import {ThemeSelector} from './components/ui/theme-selector'; import {ColorThemeSelector} from './components/ui/color-theme-selector'; import {IconThemeToggle} from './components/ui/icon-theme-toggle'; import {ThemeSwitcher} from './components/ui/theme-switcher'; import {ThemeDisclosure} from './components/ui/theme-disclosure'; import {ColorThemeDisclosure} from './components/ui/color-theme-disclosure'; function Controls(){const state=useUITheme(); return <div data-ready={state.mounted}><ThemeToggle/><ThemeSelector/><ColorThemeSelector/><IconThemeToggle/><ThemeSwitcher/><ThemeDisclosure label="Inline theme"/><ColorThemeDisclosure label="Inline color theme"/><output id="state">{state.theme}/{state.colorTheme}</output></div>;} createRoot(document.getElementById('root')${language === 'ts' ? '!' : ''}).render(<UIThemeProvider defaultTheme="light" colorThemes={['default','ocean']} duration={0}><Controls/></UIThemeProvider>);`
            );
          } else {
            write(
              folder,
              `src/main.${extension}`,
              `import {createApp} from 'vue'; import {createUITheme} from 'uitheme-web/vue'; import App from './App.vue'; createApp(App).use(createUITheme({defaultTheme:'light',colorThemes:['default','ocean'],duration:0})).mount('#root');`
            );
            write(
              folder,
              'src/App.vue',
              `<script setup${language === 'ts' ? ' lang="ts"' : ''}>import {useUITheme} from 'uitheme-web/vue'; import ThemeToggle from './components/ui/theme-toggle.vue'; import ThemeSelector from './components/ui/theme-selector.vue'; import ColorThemeSelector from './components/ui/color-theme-selector.vue'; import IconThemeToggle from './components/ui/icon-theme-toggle.vue'; import ThemeSwitcher from './components/ui/theme-switcher.vue'; import ThemeDisclosure from './components/ui/theme-disclosure.vue'; import ColorThemeDisclosure from './components/ui/color-theme-disclosure.vue'; const state=useUITheme();</script><template><div :data-ready="state.mounted.value"><ThemeToggle/><ThemeSelector/><ColorThemeSelector/><IconThemeToggle/><ThemeSwitcher/><ThemeDisclosure label="Inline theme"/><ColorThemeDisclosure label="Inline color theme"/><output id="state">{{state.theme.value}}/{{state.colorTheme.value}}</output></div></template>`
            );
          }

          write(
            folder,
            'style.css',
            tailwind === 3
              ? '@tailwind base;\n@tailwind components;\n@tailwind utilities;'
              : '@import "tailwindcss";'
          );

          if (tailwind === 3)
            write(
              folder,
              'tailwind.config.mjs',
              `export default { content:[${JSON.stringify(join(folder, 'src/**/*.{tsx,jsx,vue,ts,js}'))}], theme:{extend:{}}, plugins:[] };`
            );
          write(
            folder,
            'tsconfig.json',
            JSON.stringify({
              compilerOptions: {
                target: 'ES2022',
                module: 'ESNext',
                moduleResolution: 'Bundler',
                jsx: 'react-jsx',
                strict: true,
                skipLibCheck: true,
                allowJs: true,
                checkJs: false,
                noEmit: true,
                lib: ['DOM', 'ES2022'],
                types: framework === 'react' ? ['react', 'react-dom'] : [],
                paths: { '@/*': ['./src/*'] },
              },
              include: ['src/**/*'],
            })
          );
          command(
            folder,
            process.execPath,
            [
              join(cli, 'dist/index.js'),
              'init',
              '--cwd',
              folder,
              '--dry-run',
              '--yes',
            ],
            `${label}-packed-cli-preview`
          );

          const client = createRegistryClient({
            http: (url) =>
              fetch(url.replace('https://www.ui-theme.dev', serverOrigin)),
            webVersion,
            cliVersion,
          });

          const graph = await client.resolve(
            selected.map((item) => item.name),
            { framework, base, tailwind, language }
          );

          assert.deepEqual(
            graph.items.toSorted((a, b) => a.name.localeCompare(b.name)),
            selected.toSorted((a, b) => a.name.localeCompare(b.name))
          );
          await asynchronousCommand(
            folder,
            [join(cli, 'dist/index.js'), 'init', '--cwd', folder, '--yes'],
            `${label}-packed-cli-init`
          );
          await asynchronousCommand(
            folder,
            [
              '--import',
              preload,
              join(cli, 'dist/index.js'),
              'add',
              ...selected.map((item) => item.name),
              '--cwd',
              folder,
              '--base',
              base,
              '--language',
              language,
              '--yes',
            ],
            `${label}-packed-cli-add`
          );

          for (const item of selected)
            for (const file of item.files)
              assert.equal(
                readFileSync(
                  join(folder, 'src/components/ui', file.target ?? file.path),
                  'utf8'
                ),
                file.content
              );
          command(
            folder,
            process.execPath,
            [join(cli, 'dist/index.js'), 'info', '--cwd', folder],
            `${label}-packed-cli-info`
          );

          const typeTool =
            framework === 'vue'
              ? join(
                  packageDirectory(registryRequire, 'vue-tsc'),
                  'bin/vue-tsc.js'
                )
              : registryRequire.resolve('typescript/bin/tsc');

          command(
            folder,
            process.execPath,
            [typeTool, '-p', 'tsconfig.json'],
            `${label}-types`
          );
          const css = readFileSync(join(folder, 'style.css'), 'utf8');

          const plugin =
            tailwind === 3
              ? tailwind3(
                  (
                    await import(
                      pathToFileURL(join(folder, 'tailwind.config.mjs')).href
                    )
                  ).default
                )
              : tailwind4({ base: folder });

          const compiled = await postcss([plugin]).process(css, {
            from: join(folder, 'style.css'),
          });

          assert.ok(
            /\.bg-background\s*\{/.test(compiled.css),
            `${label}: missing bg-background CSS`
          );
          assert.ok(
            /\.text-foreground\s*\{/.test(compiled.css),
            `${label}: missing text-foreground CSS`
          );
          assert.ok(
            /\.border-border\s*\{/.test(compiled.css),
            `${label}: missing border-border CSS`
          );
          assert.match(compiled.css, /\.dark/);
          write(evidence, `${label}.css`, compiled.css);
          write(folder, 'style.css', compiled.css);

          const config = {
            root: folder,
            configFile: false,
            resolve: {
              alias: { '@': join(folder, 'src') },
              dedupe: ['react', 'react-dom', 'vue'],
            },
            plugins: framework === 'vue' ? [vuePlugin()] : [],
            esbuild: { jsx: 'automatic' },
            build: { outDir: 'dist', minify: false },
            logLevel: 'error',
          };

          await build(config);
          preview = await startPreview({
            ...config,
            preview: { host: '127.0.0.1', port: 0 },
          });
          const address = preview.httpServer.address();
          const page = await browser.newPage({ colorScheme: 'light' });
          const errors = [];
          page.on('pageerror', (error) => errors.push(error.message));
          await page.goto(`http://127.0.0.1:${address.port}`);
          await page.waitForSelector('[data-ready="true"]');
          await page.waitForFunction(
            () =>
              document.querySelector('#state')?.textContent === 'light/default'
          );

          const toggle = page.getByRole('button', {
            name: framework === 'react' ? 'Toggle appearance' : 'Toggle theme',
            exact: true,
          });

          const lightBackground = await toggle.evaluate(
            (element) => getComputedStyle(element).backgroundColor
          );

          assert.notEqual(
            lightBackground,
            'rgba(0, 0, 0, 0)',
            `${label}: semantic background did not resolve`
          );
          await toggle.click();
          await page.waitForFunction(
            () =>
              document.querySelector('#state')?.textContent === 'dark/default'
          );

          await page.waitForFunction(
            ({ label, before }) => {
              const element = Array.from(
                document.querySelectorAll('button')
              ).find((button) => button.getAttribute('aria-label') === label);

              return (
                element && getComputedStyle(element).backgroundColor !== before
              );
            },
            {
              label:
                framework === 'react' ? 'Toggle appearance' : 'Toggle theme',
              before: lightBackground,
            }
          );

          const darkBackground = await toggle.evaluate(
            (element) => getComputedStyle(element).backgroundColor
          );

          assert.notEqual(
            darkBackground,
            lightBackground,
            `${label}: dark CSS did not change the semantic background`
          );
          await toggle.click();
          await page.waitForFunction(
            () =>
              document.querySelector('#state')?.textContent === 'light/default'
          );

          const appearance = page.getByRole('combobox', {
            name: 'Theme',
            exact: true,
          });

          await appearance.click();
          await page.getByRole('option', { name: 'Dark', exact: true }).click();
          await page.waitForFunction(
            () =>
              document.querySelector('#state')?.textContent === 'dark/default'
          );

          const palette = page.getByRole('combobox', {
            name: 'Color theme',
            exact: true,
          });

          await palette.click();
          await page
            .getByRole('option', { name: 'Ocean', exact: true })
            .click();

          const light = page.getByRole('radio', {
            name: 'Light theme',
            exact: true,
          });

          await light.check();
          await light.focus();
          await page.keyboard.press('ArrowRight');
          await page.waitForFunction(
            () => document.querySelector('#state')?.textContent === 'dark/ocean'
          );
          await page.screenshot({ path: join(evidence, `${label}.png`) });
          assert.deepEqual(errors, []);
          await page.close();
          await new Promise((resolveClosed) =>
            preview.httpServer.close(resolveClosed)
          );
          preview = undefined;
          results.push({
            framework,
            base,
            tailwind,
            language,
            components: selected.map((item) => item.name),
            types: true,
            productionBuild: true,
            css: true,
            browser: true,
            cli: true,
          });
          write(
            evidence,
            'summary.json',
            JSON.stringify(
              {
                checkedAt: new Date().toISOString(),
                webVersion,
                cliVersion,
                revision: registry.revision,
                cliGraphHarness:
                  'packed CLI version/info/init-preview/init/add executed; production registry fetch transport redirected to local HTTP; injected RegistryClient graph also checked',
                dependencyIsolation:
                  'packed runtime copied per fixture; existing compiler/framework/selected-primitive dependencies linked; Tailwind 3 and merge 2 installed in temporary toolchain',
                tailwind3: legacyRequire('tailwindcss/package.json').version,
                tailwind4: cssRequire('tailwindcss/package.json').version,
                results,
              },
              null,
              2
            )
          );
        }

  assert.equal(results.length, 12);
  console.log(`All 84 emitted components passed. Evidence: ${evidence}`);
} finally {
  await browser?.close();

  if (preview)
    await new Promise((resolveClosed) =>
      preview.httpServer.close(resolveClosed)
    );

  if (registryServer)
    await new Promise((resolveClosed) => registryServer.close(resolveClosed));
  rmSync(temporary, { recursive: true, force: true });
}
