import { spawnSync } from 'node:child_process';
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { runCli } from '../src/commands/index';
import { docsUrl } from '../src/install/messages';

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
  );
});

const wrapper = `"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
`;

const layout = (
  props = 'attribute="class" defaultTheme="system" enableSystem'
) =>
  `import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider ${props}>{children}</ThemeProvider>
      </body>
    </html>
  )
}
`;

const toggle = `"use client"

import { useTheme } from "next-themes"

export function ModeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme()

  return (
    <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
      {theme}
    </button>
  )
}
`;

const direct = (props: string, imports = 'ThemeProvider') =>
  `import { ${imports} } from "next-themes"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider ${props}>{children}</ThemeProvider>
      </body>
    </html>
  )
}
`;

const shadcn = {
  'app/layout.tsx': layout(),
  'components/theme-provider.tsx': wrapper,
  'components/mode-toggle.tsx': toggle,
};

interface Options {
  framework?: 'next' | 'vite';
  declared?: boolean;
  manager?: string;
}

async function app(files: Record<string, string>, options: Options = {}) {
  const cwd = await mkdtemp(join(tmpdir(), 'uitheme-next-themes-'));
  roots.push(cwd);
  const vite = options.framework === 'vite';

  const dependencies: Record<string, string> = vite
    ? { vite: '7' }
    : { next: '16.0.0' };

  dependencies.react = '19';
  dependencies.tailwindcss = '4.1.0';

  if (options.declared !== false) dependencies['next-themes'] = '^0.4.6';

  const base: Record<string, string> = Object.assign(
    {
      'package.json': JSON.stringify({
        name: 'consumer',
        packageManager: `${options.manager ?? 'npm'}@9.0.0`,
        dependencies,
      }),
      'src/style.css': '@import "tailwindcss";\n',
      'tsconfig.json': '{"compilerOptions":{"paths":{"@/*":["./*"]}}}',
    },
    files
  );

  if (
    !vite &&
    !Object.keys(files).some((path) => path.startsWith('app/layout.'))
  )
    base['app/layout.tsx'] =
      'export default function L({ children }: { children: React.ReactNode }) {\n  return <html><body>{children}</body></html>\n}\n';

  for (const [path, content] of Object.entries(base)) {
    await mkdir(dirname(join(cwd, path)), { recursive: true });
    await writeFile(join(cwd, path), content);
  }

  return cwd;
}

async function snapshot(cwd: string, directory = ''): Promise<string> {
  const lines: string[] = [];

  for (const entry of await readdir(join(cwd, directory), {
    withFileTypes: true,
  })) {
    const path = join(directory, entry.name);

    lines.push(
      entry.isDirectory()
        ? await snapshot(cwd, path)
        : `${path}\n${await readFile(join(cwd, path), 'utf8')}`
    );
  }

  return lines.join('\n--\n');
}

async function init(
  cwd: string,
  args: string[] = ['--yes'],
  extra: {
    runInstall?: () => Promise<void>;
    runRemoval?: (
      profile: { cwd: string },
      packages: string[]
    ) => Promise<void>;
  } = {}
) {
  let output = '';
  const removals: { cwd: string; packages: string[] }[] = [];

  const code = await runCli(['init', '--cwd', cwd, ...args], {
    stdout: (text) => (output += text + '\n'),
    stderr: (text) => (output += text + '\n'),
    runInstall: extra.runInstall ?? (async () => {}),
    runRemoval:
      extra.runRemoval ??
      (async (profile, packages) => {
        removals.push({ cwd: profile.cwd, packages });
      }),
  });

  return { code, output, removals };
}

const read = (cwd: string, path: string) => readFile(join(cwd, path), 'utf8');

interface Accept {
  name: string;
  files: Record<string, string>;
  options?: Options;
  has: Record<string, string[]>;
  lacks?: Record<string, string[]>;
}

const accepts: Accept[] = [
  {
    name: 'shadcn wrapper and layout',
    files: shadcn,
    has: {
      'components/theme-provider.tsx': [
        'import { NextUIThemeProvider as NextThemesProvider } from "uitheme-web/next"',
        '"use client"',
        '{...props}',
      ],
      'components/mode-toggle.tsx': [
        'import { useNextUITheme as useTheme } from "uitheme-web/next"',
      ],
      'app/layout.tsx': ['<ThemeProvider defaultTheme="system">'],
    },
    lacks: {
      'app/layout.tsx': ['enableSystem', 'attribute="class"'],
      'components/theme-provider.tsx': ['next-themes'],
    },
  },
  {
    name: 'direct import in the layout, attribute class',
    files: { 'app/layout.tsx': direct('attribute="class"') },
    has: {
      'app/layout.tsx': [
        'import { NextUIThemeProvider as ThemeProvider } from "uitheme-web/next"',
        '<ThemeProvider>',
      ],
    },
  },
  {
    name: 'attribute data-theme is kept',
    files: { 'app/layout.tsx': direct('attribute="data-theme"') },
    has: { 'app/layout.tsx': ['<ThemeProvider attribute="data-theme">'] },
  },
  {
    name: 'a missing attribute becomes data-theme',
    files: { 'app/layout.tsx': direct('defaultTheme="dark"') },
    has: {
      'app/layout.tsx': ['attribute="data-theme"', 'defaultTheme="dark"'],
    },
  },
  {
    name: 'enableSystem false limits the themes',
    files: {
      'app/layout.tsx': direct('attribute="class" enableSystem={false}'),
    },
    has: {
      'app/layout.tsx': ["themes={['light', 'dark']}", 'defaultTheme="light"'],
    },
    lacks: { 'app/layout.tsx': ['enableSystem'] },
  },
  {
    name: 'a themes list gets system appended',
    files: { 'app/layout.tsx': direct(`attribute="class" themes={["dark"]}`) },
    has: { 'app/layout.tsx': ["themes={['dark', 'system']}"] },
  },
  {
    name: 'storageKey and nonce are kept',
    files: {
      'app/layout.tsx': direct(
        'attribute="class" storageKey="mode" nonce={nonce}'
      ),
    },
    has: { 'app/layout.tsx': ['storageKey="mode"', 'nonce={nonce}'] },
  },
  {
    name: 'enableColorScheme and a false disableTransitionOnChange are dropped',
    files: {
      'app/layout.tsx': direct(
        'attribute="class" enableColorScheme disableTransitionOnChange={false}'
      ),
    },
    has: { 'app/layout.tsx': ['<ThemeProvider>'] },
  },
  {
    name: 'a renamed provider import',
    files: {
      'app/layout.tsx': direct('attribute="class"', 'ThemeProvider as NT')
        .replace('<ThemeProvider', '<NT')
        .replace('</ThemeProvider>', '</NT>'),
    },
    has: {
      'app/layout.tsx': [
        'import { NextUIThemeProvider as NT } from "uitheme-web/next"',
      ],
    },
  },
  {
    name: 'a hook alias, a context object and a mixed import',
    files: {
      'app/layout.tsx': direct(
        'attribute="class"',
        'ThemeProvider, useTheme as useMode'
      ),
      'components/a.tsx': `import { useTheme } from 'next-themes'\nexport const A = () => { const ctx = useTheme(); ctx.setTheme('dark'); return ctx.theme }\n`,
    },
    has: {
      'app/layout.tsx': [
        'NextUIThemeProvider as ThemeProvider, useNextUITheme as useMode',
      ],
      'components/a.tsx': [
        "import { useNextUITheme as useTheme } from 'uitheme-web/next'",
      ],
    },
  },
  {
    name: 'a type-only props import',
    files: {
      'app/layout.tsx': direct('attribute="class"'),
      'components/t.ts': `import type { ThemeProviderProps } from 'next-themes'\nexport type P = ThemeProviderProps\n`,
    },
    has: {
      'components/t.ts': [
        "import type { NextUIThemeProviderProps as ThemeProviderProps } from 'uitheme-web/next'",
      ],
    },
  },
  {
    name: 'javascript files',
    files: {
      'app/layout.jsx': direct('attribute="class"').replace(
        ': { children: React.ReactNode }',
        ''
      ),
      'components/m.js':
        `import { useTheme } from 'next-themes'\nexport const m = () => useTheme\n`.replace(
          'export const m = () => useTheme',
          'export function m() { const { theme } = useTheme(); return theme }'
        ),
    },
    has: { 'app/layout.jsx': ['uitheme-web/next'] },
  },
  {
    name: 'a vite app gets the react provider and hook',
    options: { framework: 'vite' },
    files: {
      'src/main.tsx': `import { createRoot } from 'react-dom/client'\nimport { ThemeProvider, useTheme } from 'next-themes'\ncreateRoot(document.body).render(<ThemeProvider attribute="class"><App /></ThemeProvider>)\nfunction App() { const { theme } = useTheme(); return theme }\n`,
    },
    has: {
      'src/main.tsx': [
        "import { UIThemeProvider as ThemeProvider, useUITheme as useTheme } from 'uitheme-web/react'",
        '<ThemeProvider><App /></ThemeProvider>',
      ],
    },
  },
];

describe('next-themes conversion', () => {
  it.each(accepts)('converts: $name', async (row) => {
    const cwd = await app(row.files, row.options);
    const result = await init(cwd);

    expect(result.output).toContain('Replaced next-themes with UI-Theme');
    expect(result.code).toBe(0);
    expect(result.removals).toEqual([{ cwd, packages: ['next-themes'] }]);

    for (const [path, needles] of Object.entries(row.has))
      for (const needle of needles)
        expect(await read(cwd, path), path).toContain(needle);

    for (const [path, needles] of Object.entries(row.lacks ?? {}))
      for (const needle of needles)
        expect(await read(cwd, path), path).not.toContain(needle);

    expect(result.output).not.toContain('manual-required');
    const again = await init(cwd);
    expect(again.output).not.toContain('Replaced next-themes');
  });
});

interface Refuse {
  name: string;
  files: Record<string, string>;
  anchor: string;
  options?: Options;
}

const refuses: Refuse[] = [
  ...[
    'forcedTheme="dark"',
    'value={{ dark: "night" }}',
    'scriptProps={{ nonce }}',
    'attribute={["class", "data-theme"]}',
    'attribute="data-mode"',
    'defaultTheme="sepia"',
    'defaultTheme={theme}',
    '{...rest}',
    'attribute="class" enableColorScheme={false}',
    'attribute="class" disableTransitionOnChange',
    'attribute="class" enableSystem={flag}',
    'attribute="class" themes={["sepia"]}',
    'attribute="class" enableSystem={false} defaultTheme="system"',
    'attribute="class" unknownProp',
  ].map((props) => ({
    name: `provider prop ${props}`,
    files: { 'app/layout.tsx': direct(props) },
    anchor: 'provider-props',
  })),
  {
    name: 'vite has no attribute prop',
    options: { framework: 'vite' },
    files: {
      'src/main.tsx': `import { ThemeProvider } from 'next-themes'\nimport { createRoot } from 'react-dom/client'\ncreateRoot(document.body).render(<ThemeProvider attribute="data-theme"><App /></ThemeProvider>)\n`,
    },
    anchor: 'provider-props',
  },
  {
    name: 'vite without attribute',
    options: { framework: 'vite' },
    files: {
      'src/main.tsx': `import { ThemeProvider } from 'next-themes'\nimport { createRoot } from 'react-dom/client'\ncreateRoot(document.body).render(<ThemeProvider><App /></ThemeProvider>)\n`,
    },
    anchor: 'provider-props',
  },
  {
    name: 'wrapper with extra logic',
    files: {
      ...shadcn,
      'components/theme-provider.tsx': wrapper.replace(
        'return <NextThemesProvider',
        'console.log(props)\n  return <NextThemesProvider'
      ),
    },
    anchor: 'provider-shape',
  },
  {
    name: 'wrapper with a default export',
    files: {
      ...shadcn,
      'components/theme-provider.tsx': wrapper.replace(
        'export function',
        'export default function'
      ),
    },
    anchor: 'provider-shape',
  },
  {
    name: 'two providers',
    files: {
      'app/layout.tsx': direct('attribute="class"'),
      'components/other.tsx': direct('attribute="class"'),
    },
    anchor: 'provider-shape',
  },
  {
    name: 'conditional provider',
    files: {
      'app/layout.tsx': direct('attribute="class"').replace(
        '<ThemeProvider attribute="class">{children}</ThemeProvider>',
        '{on ? <ThemeProvider attribute="class">{children}</ThemeProvider> : children}'
      ),
    },
    anchor: 'provider-shape',
  },
  {
    name: 'provider used outside JSX',
    files: {
      'app/layout.tsx':
        direct('attribute="class"') + 'export const P = ThemeProvider\n',
    },
    anchor: 'provider-shape',
  },
  {
    name: 'namespace import',
    files: {
      'a.tsx': `import * as NT from 'next-themes'\nexport const x = NT\n`,
    },
    anchor: 'usetheme',
  },
  {
    name: 'side effect import',
    files: { 'a.ts': `import 'next-themes'\n` },
    anchor: 'provider-shape',
  },
  {
    name: 'require',
    files: { 'a.js': `const NT = require('next-themes')\n` },
    anchor: 'usetheme',
  },
  {
    name: 'dynamic import',
    files: { 'a.ts': `export const load = () => import('next-themes')\n` },
    anchor: 'usetheme',
  },
  {
    name: 're-export',
    files: { 'a.ts': `export { ThemeProvider } from 'next-themes'\n` },
    anchor: 'usetheme',
  },
  {
    name: 'subpath import',
    files: { 'a.ts': `import type { X } from 'next-themes/dist/types'\n` },
    anchor: 'usetheme',
  },
  {
    name: 'config mention',
    files: {
      'next.config.mjs': `export default { transpilePackages: ['next-themes'] }\n`,
    },
    anchor: 'usetheme',
  },
  {
    name: 'a type that UI-Theme lacks',
    files: {
      'app/layout.tsx': direct('attribute="class"'),
      'a.ts': `import type { UseThemeProps } from 'next-themes'\n`,
    },
    anchor: 'usetheme',
  },
  ...[
    'const { forcedTheme } = useTheme()',
    'const { theme, ...rest } = useTheme()',
    'const ctx = useTheme(); take(ctx)',
    'const { setTheme } = useTheme(); setTheme((t) => t)',
    "const { setTheme } = useTheme(); setTheme('sepia')",
    'useTheme()',
    'const f = useTheme',
  ].map((body) => ({
    name: `hook form ${body}`,
    files: {
      'app/layout.tsx': direct('attribute="class"'),
      'components/h.tsx': `import { useTheme } from 'next-themes'\nexport function H() { ${body} }\n`,
    },
    anchor: 'usetheme',
  })),
  {
    name: 'hooks without a provider',
    files: { 'components/h.tsx': toggle },
    anchor: 'provider-shape',
  },
  {
    name: 'syntax error',
    files: {
      'app/layout.tsx': direct('attribute="class"'),
      'components/broken.tsx': `import { useTheme } from 'next-themes'\nexport const = ;`,
    },
    anchor: 'provider-shape',
  },
];

describe('next-themes refusals', () => {
  it.each(refuses)('refuses and changes nothing: $name', async (row) => {
    const cwd = await app(row.files, row.options);
    const before = await snapshot(cwd);
    const result = await init(cwd);

    expect(result.code).toBe(1);
    expect(result.output).toContain('Stopped. No file changed.');
    expect(result.output).toContain(docsUrl);
    expect(result.output).not.toContain('```');
    expect(result.removals).toEqual([]);
    expect(await snapshot(cwd)).toBe(before);
  });
  it('links each refusal to the anchor of its page section', async () => {
    for (const row of refuses.slice(0, 1).concat(refuses.slice(-4, -3))) {
      const cwd = await app(row.files, row.options);
      const result = await init(cwd);
      expect(result.output).toContain(`#${row.anchor}`);
    }
  });
});

describe('next-themes removal', () => {
  it.each([
    ['npm', 'npm uninstall next-themes'],
    ['pnpm', 'pnpm remove next-themes'],
    ['yarn', 'yarn remove next-themes'],
    ['bun', 'bun remove next-themes'],
  ])('plans the %s command', async (manager, command) => {
    const cwd = await app(shadcn, { manager });
    const before = await snapshot(cwd);
    const preview = await init(cwd, ['--dry-run']);

    expect(preview.output).toContain(`remove next-themes (${command})`);
    expect(preview.output).toContain('components/theme-provider.tsx');
    expect(await snapshot(cwd)).toBe(before);

    const json = await init(cwd, ['--dry-run', '--json']);

    expect(JSON.parse(json.output).removals).toEqual([
      { package: 'next-themes', command },
    ]);
  });
  it('keeps the rewrite and prints the command when the removal fails', async () => {
    const cwd = await app(shadcn, { manager: 'pnpm' });

    const result = await init(cwd, ['--yes'], {
      runRemoval: async () => {
        throw new Error('offline');
      },
    });

    expect(result.code).toBe(2);
    expect(result.output).toContain(
      'The package is still installed. Run: pnpm remove next-themes'
    );
    expect(result.output).not.toContain('Setup complete');
    expect(await read(cwd, 'components/mode-toggle.tsx')).toContain(
      'uitheme-web/next'
    );
  });
  it('rolls every file back and keeps the package when the install fails', async () => {
    const cwd = await app(shadcn);
    const before = await snapshot(cwd);

    const result = await init(cwd, ['--yes'], {
      runInstall: async () => {
        throw new Error('install failed');
      },
    });

    expect(result.code).toBe(1);
    expect(result.removals).toEqual([]);
    expect(await snapshot(cwd)).toBe(before);
  });
  it('removes a package that nothing imports any more', async () => {
    const cwd = await app({ 'app/layout.tsx': 'export default () => null\n' });
    const result = await init(cwd);

    expect(result.removals).toEqual([{ cwd, packages: ['next-themes'] }]);
  });
  it('does nothing about the package when it is not declared in the app', async () => {
    const cwd = await app(shadcn, { declared: false });
    const result = await init(cwd);

    expect(result.removals).toEqual([]);
    expect(result.output).toContain('did not remove it');
    expect(result.code).toBe(0);
  });
  it('leaves an app without next-themes alone', async () => {
    const cwd = await app(
      {
        'app/layout.tsx': `export default function L({children}:{children:React.ReactNode}){return <html><body>{children}</body></html>}`,
      },
      { declared: false }
    );

    const result = await init(cwd);

    expect(result.removals).toEqual([]);
    expect(result.output).not.toContain('next-themes');
  });
  it('prints a short message with the docs link for a manual provider step', async () => {
    const cwd = await app(
      { 'app/layout.tsx': 'export default () => null\n' },
      { declared: false }
    );

    const result = await init(cwd);

    expect(result.code).toBe(2);
    expect(result.output).toContain(`See ${docsUrl}#manual-setup`);
    expect(result.output).not.toMatch(/import \{|<NextUIThemeProvider/);
  });
});

describe('next-themes end to end', () => {
  it('typechecks a shadcn app after init', async () => {
    const cwd = await app(shadcn);
    const result = await init(cwd);

    expect(result.code).toBe(0);

    const library = join(
      dirname(fileURLToPath(import.meta.url)),
      '../../ui-theme'
    );

    await mkdir(join(cwd, 'node_modules/@types'), { recursive: true });
    await symlink(
      join(library, 'node_modules/react'),
      join(cwd, 'node_modules/react'),
      'junction'
    );
    await symlink(
      join(library, 'node_modules/@types/react'),
      join(cwd, 'node_modules/@types/react'),
      'junction'
    );
    await symlink(library, join(cwd, 'node_modules/uitheme-web'), 'junction');
    await writeFile(
      join(cwd, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          jsx: 'react-jsx',
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          module: 'esnext',
          moduleResolution: 'bundler',
          paths: { '@/*': ['./*'] },
          types: [],
        },
        include: ['app', 'components'],
      })
    );

    const compiled = spawnSync(
      process.execPath,
      [createRequire(import.meta.url).resolve('typescript/bin/tsc'), '-p', cwd],
      { encoding: 'utf8' }
    );

    expect(compiled.stdout).toBe('');
    expect(compiled.status).toBe(0);
  });
});
