import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const temp = mkdtempSync(join(tmpdir(), 'uitheme-vue-package-'));

try {
  execFileSync('pnpm', ['pack', '--pack-destination', temp], { stdio: 'pipe' });
  const archive = readdirSync(temp).find((file) => file.endsWith('.tgz'));
  execFileSync('tar', ['-xzf', join(temp, archive), '-C', temp]);
  const modules = join(temp, 'node_modules');
  mkdirSync(join(modules, '@nuxt'), { recursive: true });
  symlinkSync(join(temp, 'package'), join(modules, 'uitheme-vue'));

  for (const name of ['vue', '@nuxt/kit', '@nuxt/schema']) {
    symlinkSync(
      realpathSync(resolve('node_modules', name)),
      join(modules, name)
    );
  }

  writeFileSync(join(temp, 'package.json'), '{"type":"module"}');
  writeFileSync(
    join(temp, 'smoke.mjs'),
    `
import assert from 'node:assert/strict';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createUITheme, useUITheme, UIThemeSwitcher, UIThemeSelector, UIThemeProvider } from 'uitheme-vue';
import module from 'uitheme-vue/nuxt';
import { getThemeScript } from 'uitheme-vue/bootstrap';
assert.equal(typeof module, 'function');
assert.ok(UIThemeSwitcher && UIThemeSelector && UIThemeProvider);
async function render(defaultTheme, defaultColorTheme) {
  const app = createSSRApp({ setup() {
    const { theme, colorTheme } = useUITheme();
    return () => h('span', theme.value + '/' + colorTheme.value);
  }});
  app.use(createUITheme({ defaultTheme, defaultColorTheme, colorThemes: ['default', 'mocha'] }));
  return renderToString(app);
}
assert.deepEqual(await Promise.all([render('dark', 'mocha'), render('light', 'default')]), ['<span>dark/mocha</span>', '<span>light/default</span>']);
assert.ok(!getThemeScript({ colorThemes: ['</script>'], defaultColorTheme: '</script>' }).includes('</script>'));
`
  );
  execFileSync(process.execPath, [join(temp, 'smoke.mjs')], {
    stdio: 'inherit',
  });
  writeFileSync(
    join(temp, 'consumer.mts'),
    `
import { createUITheme, useUITheme, ThemeAnimationType, type UIThemeOptions } from 'uitheme-vue';
import nuxt from 'uitheme-vue/nuxt';
const options: UIThemeOptions = { logoLight: '/light.svg', logoDark: '/dark.svg', animationType: ThemeAnimationType.SVG_LOGO };
createUITheme(options); void useUITheme; void nuxt;
// @ts-expect-error both theme logos are required
createUITheme({ logoLight: '/light.svg' });
`
  );
  writeFileSync(
    join(temp, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        noEmit: true,
        skipLibCheck: true,
        strict: true,
        module: 'ESNext',
        moduleResolution: 'bundler',
        target: 'ES2020',
      },
      include: ['consumer.mts'],
    })
  );
  execFileSync('pnpm', ['exec', 'tsc', '-p', join(temp, 'tsconfig.json')], {
    stdio: 'inherit',
  });
  console.log(
    'Packed ESM exports, SSR isolation, safe bootstrap serialization, and consumer declarations passed.'
  );
} finally {
  rmSync(temp, { recursive: true, force: true });
}
