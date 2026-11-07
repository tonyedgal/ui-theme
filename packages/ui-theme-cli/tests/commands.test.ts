import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { runCli } from '../src/commands/index';

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
    const cwd = await fixture(),
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
            : 'UIThemeSetup'
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
  it('repairs a deleted generated provider on a later init', async () => {
    const cwd = await fixture(),
      out = io();

    expect(
      await runCli(['init', '--cwd', cwd, '--yes'], {
        ...out,
        runInstall: async () => {},
      })
    ).toBe(0);
    const wrapper = join(cwd, 'src/components/uitheme-provider.tsx');
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
