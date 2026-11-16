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

const customProvider = `import { createContext, useEffect, useState } from 'react'

const ThemeContext = createContext({ dark: false, toggle: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(() => localStorage.getItem('dark-mode') === 'true')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('dark-mode', String(dark))
  }, [dark])

  return <ThemeContext.Provider value={{ dark, toggle: () => setDark(!dark) }}>{children}</ThemeContext.Provider>
}
`;

describe('known theme libraries', () => {
  it.each([
    [
      'vite-react',
      'remix-themes',
      'src/App.tsx',
      "import { ThemeProvider } from 'remix-themes'\nexport default function App() { return null }\n",
      'remix-themes',
    ],
    [
      'nuxt',
      '@nuxtjs/color-mode',
      'app.vue',
      '<template><div /></template>\n',
      '@nuxtjs/color-mode',
    ],
    [
      'vite-vue',
      '@vueuse/core',
      'src/dark.ts',
      "import { useDark } from '@vueuse/core'\nexport const dark = useDark()\n",
      'useColorMode or useDark from @vueuse/core',
    ],
  ] as const)(
    'stops for %s with %s',
    async (framework, name, path, content, label) => {
      const cwd = await app(
        framework,
        { [path]: content },
        { [name]: '1.0.0' }
      );

      const result = await init(cwd);

      expect(result.code).toBe(2);
      expect(result.output).toContain(`The app uses ${label}`);
      expect(result.output).toContain('#other-library');
      expect(await read(cwd, path)).toBe(content);
    }
  );
  it('ignores @vueuse/core when the app does not use its color mode', async () => {
    const cwd = await app(
      'vite-vue',
      {
        'src/a.ts':
          "import { useMouse } from '@vueuse/core'\nexport const m = useMouse()\n",
      },
      { '@vueuse/core': '1.0.0' }
    );

    expect((await init(cwd)).code).toBe(0);
  });
});

describe('custom theme providers', () => {
  it('prints each signal with file and line, writes safe parts and exits 2', async () => {
    const cwd = await app('vite-react', {
      'src/theme-provider.tsx': customProvider,
    });

    const main = await read(cwd, 'src/main.tsx');
    const result = await init(cwd);

    expect(result.code).toBe(2);
    expect(result.output).toContain(
      'existing theme setup: a custom theme provider -> manual'
    );
    expect(result.output).toContain(
      '  src/theme-provider.tsx:6 stores a theme in localStorage'
    );
    expect(result.output).toContain(
      '  src/theme-provider.tsx:9 sets the dark class on the document'
    );
    expect(result.output).toContain('#custom-provider');
    expect(await read(cwd, 'src/main.tsx')).toBe(main);
    expect(await read(cwd, 'src/theme-provider.tsx')).toBe(customProvider);
    expect(await read(cwd, 'src/style.css')).toContain('--background');
  });
  it('writes the UI-Theme provider without mounting it with --existing alongside', async () => {
    const cwd = await app('vite-react', {
      'src/theme-provider.tsx': customProvider,
    });

    const main = await read(cwd, 'src/main.tsx');
    const result = await init(cwd, ['--yes', '--existing', 'alongside']);

    expect(result.code).toBe(2);
    expect(await read(cwd, 'src/main.tsx')).toBe(main);
    expect(await read(cwd, 'src/components/ui-theme-provider.tsx')).toContain(
      'UIThemeProvider'
    );
    expect(result.output).toContain(
      'Created src/components/ui-theme-provider.tsx'
    );

    await init(cwd, ['--yes', '--existing', 'alongside']);
    expect(await read(cwd, 'src/components/ui-theme-provider.tsx')).toContain(
      'UIThemeProvider'
    );
  });
  it('detects an inline theme script in index.html', async () => {
    const cwd = await app('vite-react', {
      'index.html': `<!doctype html>\n<html>\n<head>\n<script>\nif (localStorage.getItem('theme') === 'dark') document.documentElement.classList.add('dark')\n</script>\n</head>\n</html>\n`,
    });

    const result = await init(cwd);

    expect(result.code).toBe(2);
    expect(result.output).toContain('index.html:5');
  });
  it('treats a custom provider together with next-themes as two setups', async () => {
    const cwd = await app(
      'vite-react',
      {
        'src/theme-provider.tsx': customProvider,
        'src/mode.tsx':
          "import { useTheme } from 'next-themes'\nexport const m = useTheme\n",
      },
      { 'next-themes': '0.4.6' }
    );

    const result = await init(cwd);

    expect(result.code).toBe(2);
    expect(result.output).toContain(
      'more than one theme setup (next-themes, a custom theme provider)'
    );
    expect(result.removals).toEqual([]);
  });
  it.each([
    [
      '@mui/material',
      "import { ThemeProvider, createTheme } from '@mui/material/styles'",
    ],
    [
      '@chakra-ui/react',
      "import { ChakraProvider as ThemeProvider } from '@chakra-ui/react'",
    ],
    [
      '@mantine/core',
      "import { MantineProvider as ThemeProvider } from '@mantine/core'",
    ],
    ['styled-components', "import { ThemeProvider } from 'styled-components'"],
    ['@emotion/react', "import { ThemeProvider } from '@emotion/react'"],
  ])(
    'does not treat a %s ThemeProvider as a theme setup',
    async (name, imported) => {
      const cwd = await app(
        'vite-react',
        {
          'src/App.tsx': `${imported}\nconst prefersDark = matchMedia('(prefers-color-scheme: dark)').matches\nexport default function App() { return <ThemeProvider theme={{ dark: prefersDark }}>x</ThemeProvider> }\n`,
        },
        { [name]: '1.0.0' }
      );

      const result = await init(cwd);

      expect(result.code).toBe(0);
      expect(result.output).not.toContain('existing theme setup');
    }
  );
  it('does not treat a component named ThemeProvider without behaviour as a setup', async () => {
    const cwd = await app('vite-react', {
      'src/theme-provider.tsx':
        'export function ThemeProvider({ children }: { children: React.ReactNode }) { return children }\n',
    });

    expect((await init(cwd)).code).toBe(0);
  });
});

const shadcnVite = `import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
`;

const shadcnTanstack = `import { createContext, useContext, useEffect, useState } from "react"
import { ScriptOnce } from "@tanstack/react-router"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

function getThemeScript(storageKey: string, defaultTheme: Theme) {
  const key = JSON.stringify(storageKey)
  const fallback = JSON.stringify(defaultTheme)

  return \`(function(){try{var t=localStorage.getItem(\${key});if(t!=='light'&&t!=='dark'&&t!=='system'){t=\${fallback}}var d=matchMedia('(prefers-color-scheme: dark)').matches;var r=t==='system'?(d?'dark':'light'):t;var e=document.documentElement;e.classList.add(r);e.style.colorScheme=r}catch(e){}})();\`
}

const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: "system",
  setTheme: () => {},
})

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.remove("light", "dark")

  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme

  root.classList.add(resolved)
  root.style.colorScheme = resolved
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    setThemeState(
      stored === "light" || stored === "dark" || stored === "system"
        ? stored
        : defaultTheme
    )
    setMounted(true)
  }, [defaultTheme, storageKey])

  useEffect(() => {
    if (!mounted) return
    applyTheme(theme)
  }, [theme, mounted])

  const setTheme = (next: Theme) => {
    localStorage.setItem(storageKey, next)
    setThemeState(next)
  }

  return (
    <ThemeProviderContext value={{ theme, setTheme }}>
      <ScriptOnce>{getThemeScript(storageKey, defaultTheme)}</ScriptOnce>
      {children}
    </ThemeProviderContext>
  )
}

export function useTheme() {
  const context = useContext(ThemeProviderContext)
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")
  return context
}
`;

const modeToggle = `import { useTheme } from "@/components/theme-provider"

export function ModeToggle() {
  const { setTheme } = useTheme()

  return <button onClick={() => setTheme("dark")}>dark</button>
}
`;

describe('shadcn theme providers', () => {
  it('converts the Vite provider and keeps its storage key', async () => {
    const app_ = `import { ThemeProvider } from "@/components/theme-provider"\nimport { ModeToggle } from "@/components/mode-toggle"\n\nexport default function App() {\n  return <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme"><ModeToggle /></ThemeProvider>\n}\n`;

    const cwd = await app('vite-react', {
      'src/components/theme-provider.tsx': shadcnVite,
      'src/components/mode-toggle.tsx': modeToggle,
      'src/App.tsx': app_,
    });

    const main = await read(cwd, 'src/main.tsx');
    const result = await init(cwd);
    const provider = await read(cwd, 'src/components/theme-provider.tsx');

    expect(result.code).toBe(0);
    expect(result.output).toContain(
      'Converted the shadcn theme provider for Vite to UI-Theme in 1 files.'
    );
    expect(provider).toContain(
      "import { UIThemeProvider, useUITheme, type Theme } from 'uitheme-web/react'"
    );
    expect(provider).toContain('storageKey = "vite-ui-theme",');
    expect(provider).toContain('export const useTheme = useUITheme');
    expect(await read(cwd, 'src/components/mode-toggle.tsx')).toBe(modeToggle);
    expect(await read(cwd, 'src/App.tsx')).toBe(app_);
    expect(await read(cwd, 'src/main.tsx')).toBe(main);

    const again = await init(cwd);

    expect(again.code).toBe(0);
    expect(await read(cwd, 'src/components/theme-provider.tsx')).toBe(provider);
  });
  it('converts the TanStack Start provider and replaces ScriptOnce', async () => {
    const cwd = await app('tanstack', {
      'src/components/theme-provider.tsx': shadcnTanstack,
      'src/routes/__root.tsx': `import { HeadContent, Scripts } from '@tanstack/react-router'\nimport { ThemeProvider } from '@/components/theme-provider'\nfunction RootComponent() {\n  return <html lang="en" suppressHydrationWarning><head><HeadContent /></head><body><ThemeProvider defaultTheme="system" storageKey="theme"><div /></ThemeProvider><Scripts /></body></html>\n}\n`,
    });

    const result = await init(cwd);
    const provider = await read(cwd, 'src/components/theme-provider.tsx');

    expect(result.code).toBe(0);
    expect(provider).toContain('TanStackUIThemeProvider');
    expect(provider).toContain(
      '<TanStackStartThemeScript defaultTheme={defaultTheme} storageKey={storageKey} />'
    );
    expect(provider).toContain('systemThemeMode="js"');
    expect(provider).not.toContain('ScriptOnce');
  });
  it('distinguishes the two providers by content, not by file name', async () => {
    const cwd = await app('vite-react', {
      'src/lib/dark.tsx': shadcnTanstack,
    });

    const result = await init(cwd, ['--dry-run']);

    expect(result.output).toContain(
      'existing theme setup: the shadcn theme provider for TanStack Start -> convert'
    );
  });
  it('refuses a provider with extra exports and changes no theme file', async () => {
    const changed = `${shadcnVite}\nexport const extra = 1\n`;

    const cwd = await app('vite-react', {
      'src/components/theme-provider.tsx': changed,
    });

    const result = await init(cwd);

    expect(result.code).toBe(2);
    expect(result.output).toContain('the extra export extra');
    expect(result.output).toContain('#shadcn-provider');
    expect(await read(cwd, 'src/components/theme-provider.tsx')).toBe(changed);
  });
});
