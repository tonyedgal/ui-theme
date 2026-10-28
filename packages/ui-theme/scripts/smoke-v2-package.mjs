import assert from 'node:assert/strict';
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
import { fileURLToPath } from 'node:url';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));

const directory = mkdtempSync(join(tmpdir(), 'uitheme-v2-package-'));

const run = (name, source, flags = []) => {
  const file = join(directory, `${name}.mjs`);
  writeFileSync(file, source);
  execFileSync(process.execPath, [...flags, file], { stdio: 'inherit' });
};

try {
  execFileSync('pnpm', ['pack', '--pack-destination', directory], {
    stdio: 'pipe',
    cwd: packageRoot,
  });
  const archive = readdirSync(directory).find((file) => file.endsWith('.tgz'));
  assert.ok(archive);
  execFileSync('tar', ['-xzf', join(directory, archive), '-C', directory]);
  mkdirSync(join(directory, 'node_modules'));
  symlinkSync(
    join(directory, 'package'),
    join(directory, 'node_modules/uitheme-web')
  );
  run(
    'core-only',
    `
    import assert from 'node:assert/strict';
    import { createRequire } from 'node:module';
    import { createThemeController } from 'uitheme-web';
    import { runThemeTransition } from 'uitheme-web/core';
    import { getThemeScript } from 'uitheme-web/next/server';
    const require = createRequire(import.meta.url);
    const controller = createThemeController({ defaultTheme: 'dark' });
    assert.equal(controller.getServerSnapshot().theme, 'dark');
    assert.equal(typeof runThemeTransition, 'function');
    assert.ok(!getThemeScript({colorThemes:['</script>'],defaultColorTheme:'</script>'}).includes('</script>'));
    assert.equal(typeof require('uitheme-web/core').createThemeController, 'function');
    controller.dispose();
  `,
    ['--conditions=react-server']
  );

  for (const name of ['react', 'react-dom']) {
    symlinkSync(
      realpathSync(resolve(packageRoot, 'node_modules', name)),
      join(directory, 'node_modules', name)
    );
  }

  run(
    'react-only',
    `
    import assert from 'node:assert/strict';
    import { createRequire } from 'node:module';
    import { createElement } from 'react';
    import { renderToString } from 'react-dom/server';
    import { UIThemeProvider, useUITheme } from 'uitheme-web/react';
    import { NextUIThemeProvider } from 'uitheme-web/next';
    const require = createRequire(import.meta.url);
    assert.equal(typeof require('uitheme-web/react').useTheme, 'function');
    assert.equal(typeof NextUIThemeProvider, 'function');
    assert.equal('UIThemeSelector' in await import('uitheme-web/react'), false);
    assert.ok(renderToString(createElement(UIThemeProvider, {defaultTheme:'dark'}, createElement('span', null, 'content'))).includes('content'));
    assert.equal(typeof useUITheme, 'function');
  `
  );
  rmSync(join(directory, 'node_modules/react'));
  rmSync(join(directory, 'node_modules/react-dom'));
  symlinkSync(
    realpathSync(resolve(packageRoot, 'node_modules/vue')),
    join(directory, 'node_modules/vue')
  );
  run(
    'vue-only',
    `
    import assert from 'node:assert/strict';
    import { createSSRApp, h } from 'vue';
    import { renderToString } from 'vue/server-renderer';
    import { createUITheme, useUITheme, UIThemeProvider } from 'uitheme-web/vue';
    import { getThemeScript } from 'uitheme-web/vue/bootstrap';
    async function render(theme, color) {
      const app = createSSRApp({ setup() { const state=useUITheme(); return () => h('span', state.theme.value+'/'+state.colorTheme.value); } });
      app.use(createUITheme({defaultTheme:theme,defaultColorTheme:color,colorThemes:['default','rose']}));
      return renderToString(app);
    }
    assert.deepEqual(await Promise.all([render('dark','rose'),render('light','default')]),['<span>dark/rose</span>','<span>light/default</span>']);
    assert.ok(UIThemeProvider);
    assert.equal(typeof getThemeScript, 'function');
  `
  );
  console.log(
    'Packed core, React-only, and Vue-only consumers passed without unrelated frameworks or primitive libraries.'
  );
} finally {
  rmSync(directory, { recursive: true, force: true });
}
