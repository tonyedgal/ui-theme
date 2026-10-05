import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  realpathSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const temp = mkdtempSync(join(tmpdir(), 'uitheme-package-'));

try {
  execFileSync('pnpm', ['pack', '--pack-destination', temp], { stdio: 'pipe' });
  const archive = readdirSync(temp).find((file) => file.endsWith('.tgz'));
  execFileSync('tar', ['-xzf', join(temp, archive), '-C', temp]);
  const modules = join(temp, 'node_modules');
  mkdirSync(modules);
  symlinkSync(join(temp, 'package'), join(modules, 'uitheme-web'));

  for (const name of ['react', 'react-dom', '@radix-ui/react-select']) {
    const target = join(modules, name);

    if (name.startsWith('@'))
      mkdirSync(join(modules, '@radix-ui'), { recursive: true });
    symlinkSync(realpathSync(resolve('node_modules', name)), target);
  }

  writeFileSync(
    join(temp, 'smoke.mjs'),
    `
    import assert from 'node:assert/strict';
    import {createRequire} from 'node:module';
    import * as core from 'uitheme-web/core';
    import * as react from 'uitheme-web/react';
    import * as server from 'uitheme-web/tanstack';
    const require = createRequire(import.meta.url);
        assert.equal(typeof core.runThemeTransition, 'function');
    assert.equal(typeof react.UIThemeSwitcher, 'function');
    assert.equal(typeof react.useHydrated, 'function');
    assert.equal(server.buildServerThemeData('bogus').themePreference, 'system');
    for (const entry of ['core','react','tanstack']) assert.ok(Object.keys(require('uitheme-web/' + entry)).length);
  `
  );
  execFileSync(process.execPath, [join(temp, 'smoke.mjs')], {
    stdio: 'inherit',
  });
  writeFileSync(
    join(temp, 'server.mjs'),
    `import {buildServerThemeData} from 'uitheme-web/tanstack'; if (buildServerThemeData('dark').theme !== 'dark') throw new Error('server entry');`
  );
  execFileSync(
    process.execPath,
    ['--conditions=react-server', join(temp, 'server.mjs')],
    { stdio: 'inherit' }
  );
  writeFileSync(
    join(temp, 'consumer.ts'),
    `import {ThemeAnimationType, useTheme, UIThemeProvider, UIThemeSwitcher, UIThemeSelector, useHydrated} from 'uitheme-web/react';\nconst options = {logoLight:'/light.svg',logoDark:'/dark.svg',logoWidth:'auto' as const,animationType:ThemeAnimationType.SVG_LOGO};\nuseTheme(options); useHydrated(); void UIThemeProvider; void UIThemeSwitcher; void UIThemeSelector;\n// @ts-expect-error incomplete pair\nuseTheme({logoLight:'/light.svg'});\n`
  );
  execFileSync(
    'pnpm',
    [
      'exec',
      'tsc',
      '--noEmit',
      '--skipLibCheck',
      '--strict',
      '--module',
      'NodeNext',
      '--moduleResolution',
      'NodeNext',
      '--target',
      'ES2020',
      join(temp, 'consumer.ts'),
    ],
    { stdio: 'inherit' }
  );
  const cli = join(temp, 'package/dist/cli/index.js');

  if (!readFileSync(cli, 'utf8').startsWith('#!/usr/bin/env node'))
    throw new Error('Missing CLI shebang');
  execFileSync(process.execPath, [cli, '--help'], { stdio: 'pipe' });
  const project = join(temp, 'migration-fixture');
  mkdirSync(project);
  writeFileSync(
    join(project, 'package.json'),
    JSON.stringify({ dependencies: { '@ui-theme/web': '^0.0.1' } })
  );
  writeFileSync(
    join(project, 'theme.ts'),
    "import {useTheme} from '@ui-theme/web/react';\n"
  );
  execFileSync(process.execPath, [cli, 'migrate', '--cwd', project, '--yes'], {
    stdio: 'pipe',
  });

  const manifest = JSON.parse(
    readFileSync(join(project, 'package.json'), 'utf8')
  );

  if (
    !manifest.dependencies['uitheme-web'] ||
    manifest.dependencies['@ui-theme/web']
  )
    throw new Error('CLI manifest migration failed');

  if (
    !readFileSync(join(project, 'theme.ts'), 'utf8').includes(
      "from 'uitheme-web/react'"
    )
  )
    throw new Error('CLI source migration failed');
  console.log(
    'Extracted archive: ESM, CJS, server helpers, declarations, and CLI passed.'
  );
} finally {
  rmSync(temp, { recursive: true, force: true });
}
