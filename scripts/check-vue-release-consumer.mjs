import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
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
import { createRequire } from 'node:module';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const directory = mkdtempSync(join(tmpdir(), 'uitheme-release-consumers-'));

const evidence = join(root, 'test-results/release-consumers-vue');

rmSync(evidence, { recursive: true, force: true });

mkdirSync(evidence, { recursive: true });

let server;

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
  {
    const vueArchive = pack('vue');

    const vue = join(directory, 'vue');
    write(
      vue,
      'package.json',
      JSON.stringify({
        private: true,
        type: 'module',
        dependencies: { 'uitheme-vue': `file:${vueArchive}`, vue: '3.5.44' },
        devDependencies: { typescript: '5.9.3', '@types/node': '22.20.5' },
      })
    );
    install(vue, 'vue-install');
    write(
      vue,
      'consumer.mts',
      `
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createUITheme, useUITheme, UIThemeSwitcher, UIThemeSelector } from 'uitheme-vue';
import { getThemeScript } from 'uitheme-vue/bootstrap';
const app = createSSRApp({ setup() { const {theme} = useUITheme(); return () => h('p', theme.value); } });
app.use(createUITheme({defaultTheme:'dark'}));
const output = await renderToString(app);
if (output !== '<p>dark</p>') throw new Error(output);
if (getThemeScript({defaultTheme:'dark'}).includes('</script>')) throw new Error('unsafe script');
void UIThemeSwitcher; void UIThemeSelector;
`
    );
    write(
      vue,
      'tsconfig.json',
      JSON.stringify({
        compilerOptions: {
          target: 'ES2022',
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          strict: true,
          skipLibCheck: false,
          types: ['node'],
          outDir: 'compiled',
        },
        include: ['consumer.mts'],
      })
    );
    tool(
      vue,
      'typescript/bin/tsc',
      ['-p', 'tsconfig.json'],
      'vue-declarations'
    );
    command(vue, process.execPath, ['compiled/consumer.mjs'], 'vue-ssr');

    const vueManifest = JSON.parse(
      readFileSync(join(vue, 'package.json'), 'utf8')
    );

    vueManifest.dependencies.nuxt = '4.6.2';
    vueManifest.devDependencies['vue-tsc'] = '3.3.13';
    write(vue, 'package.json', JSON.stringify(vueManifest));
    install(vue, 'nuxt-install');
    write(
      vue,
      'nuxt.config.ts',
      `export default defineNuxtConfig({ compatibilityDate: '2026-10-23', modules:['uitheme-vue/nuxt'], uiTheme:{colorThemes:['default','mocha']}, devtools:{enabled:false} });`
    );
    write(
      vue,
      'app/app.vue',
      `<script setup lang="ts">import { UIThemeSwitcher, UIThemeSelector, useUITheme } from 'uitheme-vue'; const {theme,colorTheme,mounted}=useUITheme();</script><template><main :data-ready="mounted"><UIThemeSwitcher/><UIThemeSelector/><p>{{theme}}/{{colorTheme}}</p></main></template>`
    );
    write(
      vue,
      'tsconfig.json',
      JSON.stringify({
        files: [],
        references: ['app', 'server', 'shared', 'node'].map((name) => ({
          path: `./.nuxt/tsconfig.${name}.json`,
        })),
      })
    );
    tool(vue, 'nuxt/bin/nuxt.mjs', ['prepare'], 'nuxt-prepare');
    tool(vue, 'nuxt/bin/nuxt.mjs', ['typecheck'], 'nuxt-types');
    tool(vue, 'nuxt/bin/nuxt.mjs', ['build'], 'nuxt-build');
    server = spawn(process.execPath, ['.output/server/index.mjs'], {
      cwd: vue,
      env: { ...process.env, NITRO_PORT: '0', NITRO_HOST: '127.0.0.1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const serverUrl = await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('Standalone Nuxt startup timed out')),
        15_000
      );

      server.once('error', reject);
      server.once('exit', (code) =>
        reject(new Error(`Standalone Nuxt server exited: ${code}`))
      );
      server.stdout.on('data', (data) => {
        const match = data.toString().match(/http:\/\/127\.0\.0\.1:\d+/);

        if (match) {
          clearTimeout(timeout);
          resolve(match[0]);
        }
      });
    });

    let response;

    for (let attempt = 0; attempt < 100; attempt++) {
      try {
        response = await fetch(serverUrl);

        if (response.ok) break;
      } catch {
        // wait only for the server process started by this check.
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    assert.ok(response?.ok, 'Standalone Nuxt server did not start');

    const { chromium } = createRequire(
      join(root, 'packages/ui-theme-vue/package.json')
    )('@playwright/test');

    const browser = await chromium.launch();

    try {
      const page = await browser.newPage({ colorScheme: 'light' });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (/hydration/i.test(message.text())) errors.push(message.text());
      });
      await page.goto(serverUrl);
      await page.waitForSelector('main[data-ready="true"]');
      await page.getByLabel('Appearance', { exact: true }).selectOption('dark');
      await page
        .getByLabel('Color theme', { exact: true })
        .selectOption('mocha');
      await page.reload();
      await page.waitForSelector('main[data-ready="true"]');
      assert.equal(
        await page.getByLabel('Appearance', { exact: true }).inputValue(),
        'dark'
      );
      assert.equal(
        await page.getByLabel('Color theme', { exact: true }).inputValue(),
        'mocha'
      );
      assert.match(
        await page.locator('html').getAttribute('class'),
        /dark.*theme-mocha/
      );
      assert.deepEqual(errors, []);
      await page.screenshot({ path: join(evidence, 'standalone-nuxt.png') });
    } finally {
      await browser.close();
    }

    server.kill();
    server = undefined;
  }

  write(
    evidence,
    'summary.json',
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        vue: {
          ran: true,
          standaloneInstall: true,
          strictDeclarations: true,
          ssr: true,
          nuxtProduction: true,
          hydration: true,
        },
      },
      null,
      2
    )
  );
  console.log(`Independent Vue/Nuxt consumer passed. Evidence: ${evidence}`);
} finally {
  server?.kill();
  rmSync(directory, { recursive: true, force: true });
}
