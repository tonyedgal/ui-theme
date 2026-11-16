import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { runCli } from '../src/commands/index';

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
  );
});

const frameworkDeps = {
  next: { next: '16.0.0', react: '19' },
  tanstack: { '@tanstack/react-start': '1.0.0', react: '19' },
  'vite-react': { vite: '7', react: '19' },
  'vite-vue': { vite: '7', vue: '3' },
  nuxt: { nuxt: '4.0.0', vue: '3' },
} satisfies Record<string, Record<string, string>>;

const entries = {
  next: {
    'src/app/layout.tsx':
      'export default function L({ children }: { children: React.ReactNode }) {\n  return <html><body>{children}</body></html>\n}\n',
  },
  tanstack: {
    'src/routes/__root.tsx':
      "import { HeadContent, Scripts } from '@tanstack/react-router'\nfunction RootDocument({ children }: { children: React.ReactNode }) {\n  return <html><head><HeadContent /></head><body>{children}<Scripts /></body></html>\n}\n",
  },
  'vite-react': {
    'src/main.tsx':
      "import { createRoot } from 'react-dom/client'\nimport App from './App'\ncreateRoot(document.getElementById('root')!).render(<App />)\n",
    'src/App.tsx': 'export default function App() { return null }\n',
  },
  'vite-vue': {
    'src/main.ts':
      "import { createApp } from 'vue'\nimport App from './App.vue'\ncreateApp(App).mount('#app')\n",
  },
  nuxt: {
    'nuxt.config.ts':
      "export default defineNuxtConfig({ css: ['~/src/style.css'] })\n",
  },
} satisfies Record<keyof typeof frameworkDeps, Record<string, string>>;

async function app(
  framework: keyof typeof frameworkDeps,
  files: Record<string, string> = {},
  deps: Record<string, string> = {}
) {
  const cwd = await mkdtemp(join(tmpdir(), 'uitheme-existing-'));
  roots.push(cwd);

  const all = {
    'package.json': JSON.stringify({
      name: 'consumer',
      dependencies: {
        ...frameworkDeps[framework],
        tailwindcss: '4.1.0',
        ...deps,
      },
    }),
    'src/style.css': '@import "tailwindcss";\n',
    'tsconfig.json': '{"compilerOptions":{"paths":{"@/*":["./src/*"]}}}',
    ...entries[framework],
    ...files,
  } satisfies Record<string, string>;

  for (const [path, content] of Object.entries(all)) {
    await mkdir(dirname(join(cwd, path)), { recursive: true });
    await writeFile(join(cwd, path), content);
  }

  return cwd;
}

async function init(cwd: string, args: string[] = ['--yes']) {
  let output = '';
  const removals: string[][] = [];

  const code = await runCli(['init', '--cwd', cwd, ...args], {
    stdout: (text) => (output += text + '\n'),
    stderr: (text) => (output += text + '\n'),
    runInstall: async () => {},
    runRemoval: async (_profile, packages) => {
      removals.push(packages);
    },
  });

  return { code, output, removals };
}

describe('next-themes outside React', () => {
  it.each(['vite-vue', 'nuxt'] as const)(
    'does not treat next-themes as a setup in %s',
    async (framework) => {
      const cwd = await app(framework, {}, { 'next-themes': '0.4.6' });
      const result = await init(cwd);

      expect(result.code).toBe(0);
      expect(result.output).not.toContain('next-themes');
      expect(result.removals).toEqual([]);
    }
  );
});

const read = (cwd: string, path: string) => readFile(join(cwd, path), 'utf8');

const tanstackDirect = (provider: string, props = '') =>
  `import { HeadContent, Scripts } from '@tanstack/react-router'\nimport { ${provider}, useUITheme } from 'uitheme-web/react'\nfunction RootDocument({ children }: { children: React.ReactNode }) {\n  return <html><head><HeadContent /></head><body><${provider}${props}>{children}</${provider}><Scripts /></body></html>\n}\n`;

describe('UI-Theme upgrade', () => {
  it('switches a direct UIThemeProvider in TanStack Start to the TanStack provider', async () => {
    const cwd = await app('tanstack', {
      'src/routes/__root.tsx': tanstackDirect(
        'UIThemeProvider',
        ' defaultTheme="dark"'
      ),
    });

    const result = await init(cwd);
    const root = await read(cwd, 'src/routes/__root.tsx');

    expect(root).toContain(
      "import { TanStackUIThemeProvider as UIThemeProvider, useUITheme } from 'uitheme-web/react'"
    );
    expect(root).toContain(
      '<UIThemeProvider systemThemeMode="js" defaultTheme="dark">'
    );
    expect(root).toContain('<html suppressHydrationWarning>');
    expect(result.code).toBe(2);
    expect(result.output).toContain(
      'Add TanStackStartThemeScript to the document head in src/routes/__root.tsx'
    );
    expect(result.output).toContain('#upgrade');

    const again = await init(cwd);

    expect(await read(cwd, 'src/routes/__root.tsx')).toBe(root);
    expect(again.code).toBe(2);
  });
  it('refuses to switch a provider whose props TanStack Start lacks', async () => {
    const root = tanstackDirect('ViteUIThemeProvider', ' attribute="class"');
    const cwd = await app('tanstack', { 'src/routes/__root.tsx': root });
    const result = await init(cwd);

    expect(result.code).toBe(2);
    expect(result.output).toContain('uses ViteUIThemeProvider');
    expect(await read(cwd, 'src/routes/__root.tsx')).toBe(root);
  });
  it('moves a direct UIThemeProvider in Next.js to uitheme-web/next', async () => {
    const cwd = await app('next', {
      'src/app/layout.tsx': `import { UIThemeProvider } from 'uitheme-web/react'\nexport default function L({ children }: { children: React.ReactNode }) {\n  return <html><body><UIThemeProvider>{children}</UIThemeProvider></body></html>\n}\n`,
    });

    const result = await init(cwd);
    const layout = await read(cwd, 'src/app/layout.tsx');

    expect(result.code).toBe(0);
    expect(layout).toContain(
      "import { NextUIThemeProvider as UIThemeProvider } from 'uitheme-web/next';"
    );
    expect(layout).toContain('<html suppressHydrationWarning>');
  });
  it('adds suppressHydrationWarning to a Next.js layout that init set up earlier', async () => {
    const cwd = await app('next');

    await init(cwd);

    const layout = (await read(cwd, 'src/app/layout.tsx')).replace(
      ' suppressHydrationWarning',
      ''
    );

    await writeFile(join(cwd, 'src/app/layout.tsx'), layout);
    expect((await init(cwd)).code).toBe(0);
    expect(await read(cwd, 'src/app/layout.tsx')).toContain(
      '<html suppressHydrationWarning>'
    );
  });
  it.each(['UIThemeProvider', 'ViteUIThemeProvider'])(
    'leaves a direct %s in Vite React alone',
    async (provider) => {
      const main = `import { createRoot } from 'react-dom/client'\nimport { ${provider} } from 'uitheme-web/react'\nimport App from './App'\ncreateRoot(document.getElementById('root')!).render(<${provider}><App /></${provider}>)\n`;
      const cwd = await app('vite-react', { 'src/main.tsx': main });
      const result = await init(cwd);

      expect(result.code).toBe(0);
      expect(await read(cwd, 'src/main.tsx')).toBe(main);
    }
  );
});

describe('UI-Theme 1', () => {
  it.each([
    [
      'vite-react',
      '@ui-theme/web',
      'src/App.tsx',
      "import { UIThemeProvider } from '@ui-theme/web/react'\nexport default function App() { return null }\n",
    ],
    [
      'vite-vue',
      'uitheme-vue',
      'src/App.ts',
      "import { useTheme } from 'uitheme-vue'\nexport const a = useTheme\n",
    ],
  ] as const)(
    'asks %s apps to run migrate first',
    async (framework, name, path, content) => {
      const cwd = await app(
        framework,
        { [path]: content },
        { [name]: '1.0.0' }
      );

      const entry = framework === 'vite-react' ? 'src/main.tsx' : 'src/main.ts';
      const before = await read(cwd, entry);
      const result = await init(cwd);

      expect(result.code).toBe(2);
      expect(result.output).toContain('Run `uitheme migrate` first');
      expect(result.output).toContain('#v1');
      expect(await read(cwd, entry)).toBe(before);
      expect(await read(cwd, 'uitheme.json')).toContain('schemaVersion');
    }
  );
});
