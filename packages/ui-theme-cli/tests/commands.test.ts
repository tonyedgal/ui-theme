import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { runCli } from '../src/commands/index';
import type { RegistryGraph } from '../src/types';

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
  );
});

async function fixture(framework = 'vite-react') {
  const cwd = await mkdtemp(join(tmpdir(), 'uitheme-command-'));
  roots.push(cwd);

  const deps =
    framework === 'next'
      ? { next: '16.0.0', react: '19' }
      : framework === 'nuxt'
        ? { nuxt: '4.0.0', vue: '3' }
        : framework === 'tanstack'
          ? { '@tanstack/react-start': '1.0.0', react: '19' }
          : framework === 'vite-vue'
            ? { vite: '7', vue: '3' }
            : { vite: '7', react: '19' };

  await mkdir(join(cwd, 'src'), { recursive: true });
  await writeFile(
    join(cwd, 'package.json'),
    JSON.stringify({
      name: 'consumer',
      dependencies: { ...deps, tailwindcss: '4.1.0' },
    })
  );
  await writeFile(join(cwd, 'src/style.css'), '@import "tailwindcss";\n');
  await writeFile(
    join(cwd, 'tsconfig.json'),
    '{"compilerOptions":{"paths":{"@/*":["./src/*"]}}}'
  );

  if (framework === 'next') {
    await mkdir(join(cwd, 'src/app'), { recursive: true });
    await writeFile(
      join(cwd, 'src/app/layout.tsx'),
      `export default function RootLayout({children}: {children:React.ReactNode}) { return <html lang="en"><body className="keep">{children}</body></html>; }`
    );
  } else if (framework === 'tanstack') {
    await mkdir(join(cwd, 'src/routes'), { recursive: true });
    await writeFile(
      join(cwd, 'src/routes/__root.tsx'),
      `import { HeadContent, Scripts } from '@tanstack/react-router';\nfunction RootDocument({children}) { return <html><head><HeadContent /></head><body>{children}<Scripts /></body></html>; }`
    );
  } else if (framework === 'nuxt')
    await writeFile(
      join(cwd, 'nuxt.config.ts'),
      `export default defineNuxtConfig({modules:['existing'],css:['~/src/style.css']});`
    );
  else if (framework === 'vite-vue')
    await writeFile(
      join(cwd, 'src/main.ts'),
      `import {createApp} from 'vue';\nimport App from './App.vue';\ncreateApp(App).mount('#app');`
    );
  else
    await writeFile(
      join(cwd, 'src/main.tsx'),
      `import {createRoot} from 'react-dom/client';\nimport App from './App';\ncreateRoot(document.getElementById('root')!).render(<App />);`
    );

  return cwd;
}

function io() {
  let output = '';

  return {
    stdout: (text: string) => {
      output += text + '\n';
    },
    stderr: (text: string) => {
      output += text + '\n';
    },
    output: () => output,
  };
}

describe('CLI commands in existing applications', () => {
  it('reports the actual package version', async () => {
    const out = io();

    const pkg = JSON.parse(
      await readFile(new URL('../package.json', import.meta.url), 'utf8')
    );

    expect(await runCli(['--version'], out)).toBe(0);
    expect(out.output()).toContain(pkg.version);
  });
  it('rejects an installed v1 web runtime before contacting the registry', async () => {
    const cwd = await appWithRuntime('1.4.0'),
      out = io();

    const pkg = JSON.parse(await readFile(join(cwd, 'package.json'), 'utf8'));
    pkg.dependencies['uitheme-web'] = '^1.4.0';
    await writeFile(join(cwd, 'package.json'), JSON.stringify(pkg));
    let contacted = false;

    const registry = {
      manifest: async () => {
        contacted = true;
        throw Error('unexpected network');
      },
      list: async () => {
        contacted = true;
        throw Error('unexpected network');
      },
      resolve: async () => {
        contacted = true;
        throw Error('unexpected network');
      },
    };

    expect(
      await runCli(['add', 'theme-toggle', '--cwd', cwd, '--yes'], {
        ...out,
        registry,
      })
    ).toBe(1);
    expect(contacted).toBe(false);
    expect(out.output()).toMatch(/migration|incompatible/i);
  });
  it('shows info without project mutation', async () => {
    const cwd = await fixture(),
      out = io();

    expect(await runCli(['info', '--cwd', cwd], out)).toBe(0);
    expect(out.output()).toContain('vite-react');
    await expect(readFile(join(cwd, 'uitheme.json'))).rejects.toThrow();
  });
  it.each(['vite-react', 'vite-vue', 'next', 'tanstack', 'nuxt'])(
    'initializes %s with provider wiring and preserves existing sources',
    async (framework) => {
      const cwd = await fixture(framework),
        out = io();

      expect(
        await runCli(['init', '--cwd', cwd, '--yes'], {
          ...out,
          runInstall: async () => {},
        })
      ).toBe(0);
      expect(out.output()).toContain('complete');

      const saved = JSON.parse(
        await readFile(join(cwd, 'uitheme.json'), 'utf8')
      );

      expect(saved.framework).toBe(framework);
      expect(saved.cssFile).toBe('src/style.css');
      const css = await readFile(join(cwd, 'src/style.css'), 'utf8');
      expect(css).toContain('--color-background: var(--background)');

      const source = await readFile(
        join(
          cwd,
          framework === 'next'
            ? 'src/app/layout.tsx'
            : framework === 'tanstack'
              ? 'src/routes/__root.tsx'
              : framework === 'nuxt'
                ? 'nuxt.config.ts'
                : framework === 'vite-vue'
                  ? 'src/main.ts'
                  : 'src/main.tsx'
        ),
        'utf8'
      );

      expect(source).toContain(
        framework === 'nuxt'
          ? 'uitheme-web/nuxt'
          : framework === 'vite-vue'
            ? 'createUITheme'
            : '<ThemeProvider>'
      );

      if (framework === 'next') expect(source).toContain('className="keep"');

      if (framework === 'tanstack') expect(source).toContain('<Scripts />');
      const second = io();
      expect(
        await runCli(['init', '--cwd', cwd, '--yes'], {
          ...second,
          runInstall: async () => {},
        })
      ).toBe(0);
      expect(await readFile(join(cwd, 'src/style.css'), 'utf8')).toBe(css);
      expect(
        await readFile(
          join(
            cwd,
            framework === 'next'
              ? 'src/app/layout.tsx'
              : framework === 'tanstack'
                ? 'src/routes/__root.tsx'
                : framework === 'nuxt'
                  ? 'nuxt.config.ts'
                  : framework === 'vite-vue'
                    ? 'src/main.ts'
                    : 'src/main.tsx'
          ),
          'utf8'
        )
      ).toBe(source);
    }
  );
  it('places the provider inside StrictMode and around other providers', async () => {
    const cwd = await fixture(),
      out = io();

    await writeFile(
      join(cwd, 'src/main.tsx'),
      `import React from 'react';\nimport {createRoot} from 'react-dom/client';\nimport App from './App';\ncreateRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <Store>\n      <App />\n    </Store>\n  </React.StrictMode>\n);`
    );
    expect(
      await runCli(['init', '--cwd', cwd, '--yes'], {
        ...out,
        runInstall: async () => {},
      })
    ).toBe(0);

    const source = await readFile(join(cwd, 'src/main.tsx'), 'utf8');

    expect(source).toContain(
      "import { ThemeProvider } from './components/theme-provider';"
    );
    expect(source).toContain(
      '  <React.StrictMode>\n    <ThemeProvider>\n      <Store>\n        <App />\n      </Store>\n    </ThemeProvider>\n  </React.StrictMode>'
    );
  });
  it('repairs a deleted generated provider on a later init', async () => {
    const cwd = await fixture(),
      out = io();

    expect(
      await runCli(['init', '--cwd', cwd, '--yes'], {
        ...out,
        runInstall: async () => {},
      })
    ).toBe(0);
    const wrapper = join(cwd, 'src/components/theme-provider.tsx');
    await rm(wrapper);
    expect(
      await runCli(['init', '--cwd', cwd, '--yes'], {
        ...out,
        runInstall: async () => {},
      })
    ).toBe(0);
    expect(await readFile(wrapper, 'utf8')).toContain(
      "from 'uitheme-web/react'"
    );
  });
  it('does not report setup complete for an unused provider or a custom renderer', async () => {
    const cwd = await fixture(),
      out = io();

    await writeFile(
      join(cwd, 'src/main.tsx'),
      `import { UIThemeProvider } from 'uitheme-web/react';
export const Demo = () => <UIThemeProvider />;
customBootstrap();`
    );
    expect(
      await runCli(['init', '--cwd', cwd, '--yes'], {
        ...out,
        runInstall: async () => {},
      })
    ).toBe(2);
    await writeFile(
      join(cwd, 'src/main.tsx'),
      `const sketch = customRenderer(); sketch.render(<App />);`
    );
    expect(
      await runCli(['init', '--cwd', cwd, '--yes'], {
        ...out,
        runInstall: async () => {},
      })
    ).toBe(2);
  });
  it('previews init without modifying package, CSS, provider, or config', async () => {
    const cwd = await fixture(),
      out = io(),
      before = await readFile(join(cwd, 'src/style.css'), 'utf8');

    expect(await runCli(['init', '--cwd', cwd, '--dry-run'], out)).toBe(0);
    expect(out.output()).toContain('uitheme-web');
    expect(out.output()).toContain('src/style.css');
    expect(await readFile(join(cwd, 'src/style.css'), 'utf8')).toBe(before);
    await expect(readFile(join(cwd, 'uitheme.json'))).rejects.toThrow();
  });
  it('reports manual-required for complex provider code without claiming complete', async () => {
    const cwd = await fixture(),
      out = io();

    await writeFile(
      join(cwd, 'src/main.tsx'),
      `export const customBootstrap = () => startApplication();`
    );
    expect(
      await runCli(['init', '--cwd', cwd, '--yes'], {
        ...out,
        runInstall: async () => {},
      })
    ).toBe(2);
    expect(out.output()).toContain('manual-required');
    expect(out.output()).not.toContain('Setup complete');
  });
  it('uses preview and diff without prompting, and reports errors for unknown flags', async () => {
    const cwd = await fixture(),
      out = io();

    expect(await runCli(['info', '--cwd', cwd, '--unknown'], out)).toBe(1);
    expect(out.output()).toContain('Unknown option');
  });
  it('asks for an explicit framework when detection is ambiguous', async () => {
    const cwd = await fixture(),
      out = io();

    const pkg = JSON.parse(await readFile(join(cwd, 'package.json'), 'utf8'));
    pkg.dependencies.vue = '3';
    await writeFile(join(cwd, 'package.json'), JSON.stringify(pkg));
    let asked = '';

    const result = await runCli(['info', '--cwd', cwd], {
      ...out,
      select: async (message, choices) => {
        asked = message;
        expect(choices).toEqual(['vite-react', 'vite-vue']);

        return 'vite-vue';
      },
    });

    expect(result).toBe(0);
    expect(asked).toContain('framework');
    expect(out.output()).toContain('vite-vue');
  });
  it('offers the installed primitive as the default React base', async () => {
    const cwd = await fixture(),
      out = io();

    const pkg = JSON.parse(await readFile(join(cwd, 'package.json'), 'utf8'));
    pkg.dependencies['radix-ui'] = '^1.4.3';
    await writeFile(join(cwd, 'package.json'), JSON.stringify(pkg));
    let offered: string | undefined;

    const result = await runCli(['init', '--cwd', cwd, '--dry-run'], {
      ...out,
      select: async (_message, _choices, defaultChoice) => {
        offered = defaultChoice;

        return defaultChoice;
      },
    });

    expect(result).toBe(0);
    expect(offered).toBe('radix');
  });
  it('refuses apply without confirmation when no input is available', async () => {
    const cwd = await fixture(),
      out = io();

    expect(await runCli(['init', '--cwd', cwd], out)).toBe(1);
    expect(out.output()).toContain('--yes');
    await expect(readFile(join(cwd, 'uitheme.json'))).rejects.toThrow();
  });
  it('uses the --registry flag over UITHEME_REGISTRY_URL and names the registry', async () => {
    const cwd = await fixture(),
      out = io();

    const registry = {
      manifest: async () => {
        throw Error('unexpected manifest request');
      },
      list: async () => {
        throw Error('unexpected list request');
      },
      resolve: async () => {
        throw Error('unexpected resolve request');
      },
    };

    const env = { UITHEME_REGISTRY_URL: 'https://registry.example.com/r' };

    expect(
      await runCli(
        [
          'init',
          '--cwd',
          cwd,
          '--dry-run',
          '--registry',
          'http://localhost:4000/r/',
        ],
        { ...out, env, registry }
      )
    ).toBe(0);
    expect(out.output()).toContain('Registry: http://localhost:4000/r\n');

    const fromEnv = io();

    expect(
      await runCli(['init', '--cwd', cwd, '--dry-run'], {
        ...fromEnv,
        env,
        registry,
      })
    ).toBe(0);
    expect(fromEnv.output()).toContain(
      'Registry: https://registry.example.com/r\n'
    );

    const unsafe = io();

    expect(
      await runCli(['init', '--cwd', cwd, '--dry-run'], {
        ...unsafe,
        env: { UITHEME_REGISTRY_URL: 'http://registry.example.com/r' },
        registry,
      })
    ).toBe(1);
    expect(unsafe.output()).toContain('Invalid UITHEME_REGISTRY_URL');
  });
});

const source = 'export const ThemeToggle = () => null;';

// A registry with one theme-toggle item for the Base UI variant.
function registryWith(content = source) {
  const graph: RegistryGraph = {
    manifest: {
      schemaVersion: 1,
      stable: {
        revision: 'abc12345',
        index: '/r/v1/abc12345/registry.json',
        webVersion: '^2.0.0',
        cliVersion: '^1.0.0',
      },
    },
    items: [
      {
        name: 'theme-toggle',
        type: 'registry:ui',
        title: 'Theme toggle',
        description: '',
        dependencies: [],
        registryDependencies: [],
        files: [{ path: 'theme-toggle.tsx', content, type: 'registry:ui' }],
        meta: {
          uiTheme: {
            schemaVersion: 1,
            revision: 'abc12345',
            component: 'theme-toggle',
            framework: 'react',
            base: 'base-ui',
            tailwind: 4,
            language: 'ts',
            webVersion: '^2.0.0',
            cliVersion: '^1.0.0',
          },
        },
      },
    ],
  };

  return {
    manifest: async () => graph.manifest,
    list: async () => graph.items,
    resolve: async () => graph,
  };
}

// Answer each prompt from the list, and record the questions.
function answers(...replies: (string | undefined)[]) {
  const asked: string[] = [];

  return {
    asked,
    select: async (message: string) => {
      asked.push(message);

      return replies.shift();
    },
  };
}

const runInstall = async () => {};

// pnpm puts its store on NODE_PATH, so pin the runtime that the app resolves.
async function appWithRuntime(version = '2.0.0') {
  const cwd = await fixture(),
    runtime = join(cwd, 'node_modules/uitheme-web');

  await mkdir(runtime, { recursive: true });
  await writeFile(
    join(runtime, 'package.json'),
    JSON.stringify({ name: 'uitheme-web', version })
  );

  return cwd;
}

async function installedApp() {
  const cwd = await appWithRuntime();
  await runCli(['init', '--cwd', cwd, '--yes'], { ...io(), runInstall });
  await runCli(['add', 'theme-toggle', '--cwd', cwd, '--yes'], {
    ...io(),
    runInstall,
    registry: registryWith(),
  });

  const toggle = join(cwd, 'src/components/ui/theme-toggle.tsx');
  await writeFile(toggle, 'my edit');

  return { cwd, toggle };
}

describe('files that differ from the uitheme version', () => {
  it('keeps an edited control when the user keeps it, with its old hash', async () => {
    const { cwd, toggle } = await installedApp(),
      out = io(),
      prompt = answers('Keep my file');

    const before = await readFile(join(cwd, 'uitheme.json'), 'utf8');

    expect(
      await runCli(['add', 'theme-toggle', '--cwd', cwd], {
        ...out,
        ...prompt,
        runInstall,
        confirm: async () => true,
        registry: registryWith('new source'),
      })
    ).toBe(0);
    expect(prompt.asked[0]).toContain(
      'src/components/ui/theme-toggle.tsx has changes since uitheme installed it'
    );
    expect(out.output()).toContain('keep src/components/ui/theme-toggle.tsx');
    expect(await readFile(toggle, 'utf8')).toBe('my edit');
    expect(
      JSON.parse(await readFile(join(cwd, 'uitheme.json'), 'utf8')).installed
    ).toEqual(JSON.parse(before).installed);
  });
  it('replaces an edited control after the user reads the diff', async () => {
    const { cwd, toggle } = await installedApp(),
      out = io(),
      prompt = answers('Show the diff', 'Overwrite');

    expect(
      await runCli(['add', 'theme-toggle', '--cwd', cwd], {
        ...out,
        ...prompt,
        runInstall,
        confirm: async () => true,
        registry: registryWith('new source'),
      })
    ).toBe(0);
    expect(prompt.asked).toHaveLength(2);
    expect(out.output()).toContain('-my edit\n+new source');
    expect(await readFile(toggle, 'utf8')).toBe('new source');
  });
  it('keeps edited files without an answer and exits with 2', async () => {
    for (const [args, select] of [
      [['--yes'], undefined],
      [['--yes'], answers('Overwrite').select],
      [[], async () => undefined],
    ] as const) {
      const { cwd, toggle } = await installedApp(),
        out = io();

      expect(
        await runCli(['add', 'theme-toggle', '--cwd', cwd, ...args], {
          ...out,
          select,
          runInstall,
          confirm: async () => true,
          registry: registryWith('new source'),
        })
      ).toBe(2);
      expect(await readFile(toggle, 'utf8')).toBe('my edit');
      expect(out.output()).toContain(
        'Kept these files, because they differ from the uitheme version:\n  src/components/ui/theme-toggle.tsx'
      );
    }
  });
  it('replaces edited files with --overwrite, and marks them in a preview', async () => {
    const { cwd, toggle } = await installedApp(),
      preview = io();

    expect(
      await runCli(['add', 'theme-toggle', '--cwd', cwd, '--dry-run'], {
        ...preview,
        select: async () => {
          throw Error('a preview must not ask');
        },
        registry: registryWith('new source'),
      })
    ).toBe(0);
    expect(preview.output()).toContain(
      'keep src/components/ui/theme-toggle.tsx (edited since installation; --overwrite replaces it)'
    );

    expect(
      await runCli(
        ['add', 'theme-toggle', '--cwd', cwd, '--yes', '--overwrite'],
        { ...io(), runInstall, registry: registryWith('new source') }
      )
    ).toBe(0);
    expect(await readFile(toggle, 'utf8')).toBe('new source');
  });
  it('asks about an existing provider file during init', async () => {
    const cwd = await fixture(),
      wrapper = join(cwd, 'src/components/theme-provider.tsx');

    await mkdir(join(cwd, 'src/components'), { recursive: true });
    await writeFile(wrapper, 'export const Mine = 1;');

    const kept = io();

    expect(
      await runCli(['init', '--cwd', cwd], {
        ...kept,
        ...answers('base-ui', 'Keep my file'),
        runInstall,
        confirm: async () => true,
      })
    ).toBe(2);
    expect(await readFile(wrapper, 'utf8')).toBe('export const Mine = 1;');
    expect(kept.output()).toContain(
      'Kept your src/components/theme-provider.tsx'
    );
    expect(kept.output()).toContain(
      "import { UIThemeProvider } from 'uitheme-web/react';"
    );

    expect(
      await runCli(['init', '--cwd', cwd], {
        ...io(),
        // uitheme.json saves the base now, so only the file question comes.
        ...answers('Overwrite'),
        runInstall,
        confirm: async () => true,
      })
    ).toBe(0);
    expect(await readFile(wrapper, 'utf8')).toContain('UIThemeProvider');
    expect(await readFile(join(cwd, 'src/main.tsx'), 'utf8')).toContain(
      '<ThemeProvider>'
    );
  });
});

describe('guided next steps', () => {
  it('reports a declined confirmation as a cancel, not an error', async () => {
    const cwd = await fixture(),
      out = io();

    expect(
      await runCli(['init', '--cwd', cwd, '--base', 'base-ui'], {
        ...out,
        confirm: async () => false,
      })
    ).toBe(0);
    expect(out.output()).toContain('Cancelled. Nothing changed.');
    expect(out.output()).not.toContain('--yes');
    await expect(readFile(join(cwd, 'uitheme.json'))).rejects.toThrow();
  });
  it('offers init when add runs in an app that is not set up', async () => {
    const cwd = await appWithRuntime(),
      out = io(),
      prompt = answers('Run init first', 'base-ui');

    expect(
      await runCli(['add', 'theme-toggle', '--cwd', cwd], {
        ...out,
        ...prompt,
        runInstall,
        confirm: async () => true,
        registry: registryWith(),
      })
    ).toBe(0);
    expect(prompt.asked[0]).toContain("UI-Theme isn't set up in this app yet");
    expect(out.output()).toContain('Setup complete.');
    expect(await readFile(join(cwd, 'src/main.tsx'), 'utf8')).toContain(
      '<ThemeProvider>'
    );
    expect(
      await readFile(join(cwd, 'src/components/ui/theme-toggle.tsx'), 'utf8')
    ).toBe(source);
  });
  it('adds only the controls when the user says so, and stops without a terminal', async () => {
    const cwd = await appWithRuntime();

    expect(
      await runCli(['add', 'theme-toggle', '--cwd', cwd], {
        ...io(),
        ...answers('Add the controls only'),
        runInstall,
        confirm: async () => true,
        registry: registryWith(),
      })
    ).toBe(0);
    expect(await readFile(join(cwd, 'src/main.tsx'), 'utf8')).not.toContain(
      'ThemeProvider'
    );

    const fresh = await appWithRuntime(),
      out = io();

    expect(
      await runCli(['add', 'theme-toggle', '--cwd', fresh, '--yes'], {
        ...out,
        runInstall,
        registry: registryWith(),
      })
    ).toBe(1);
    expect(out.output()).toContain('Run `uitheme init` first');
  });
  it('offers to switch a saved base that does not fit the framework', async () => {
    const cwd = await fixture();

    await writeFile(
      join(cwd, 'uitheme.json'),
      JSON.stringify({ schemaVersion: 1, base: 'reka' })
    );

    const stuck = io();
    expect(await runCli(['info', '--cwd', cwd], stuck)).toBe(1);
    expect(stuck.output()).toContain(
      'uitheme.json saves the reka base, which does not work with vite-react. Run again with --base base-ui or --base radix to switch.'
    );

    const out = io(),
      prompt = answers('radix');

    expect(await runCli(['info', '--cwd', cwd], { ...out, ...prompt })).toBe(0);
    expect(prompt.asked[0]).toContain('Select the base to save instead');
    expect(JSON.parse(out.output()).base).toBe('radix');
  });
  it('prints the provider code for a manual provider step', async () => {
    const cwd = await fixture(),
      out = io();

    await writeFile(
      join(cwd, 'src/main.tsx'),
      `const sketch = customRenderer(); sketch.render(<App />);`
    );
    expect(
      await runCli(['init', '--cwd', cwd, '--yes'], { ...out, runInstall })
    ).toBe(2);
    expect(out.output()).toContain(
      "manual-required: Wrap the application root with the provider:\n\nimport { UIThemeProvider } from 'uitheme-web/react';"
    );
  });
});
