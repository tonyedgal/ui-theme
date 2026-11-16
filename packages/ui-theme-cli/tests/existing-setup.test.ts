import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
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
