import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { planInit } from '../src/install/setup';
import { rewriteManifest, rewriteScript } from '../src/migrate/rewrite';
import { transformTailwind3 } from '../src/tailwind/index';
import type { ProjectProfile } from '../src/types';

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
  );
});

async function init(
  framework: ProjectProfile['framework'],
  files: Record<string, string>
) {
  const cwd = await mkdtemp(join(tmpdir(), 'uitheme-rewrite-'));
  roots.push(cwd);
  files = {
    'package.json': '{"name":"app"}',
    'src/style.css': '@import "tailwindcss";\n',
    'src/lib/utils.ts': 'export function cn() {}\n',
    'tsconfig.json': '{"compilerOptions":{"paths":{"@/*":["./src/*"]}}}',
    ...files,
  };

  for (const [path, content] of Object.entries(files)) {
    await mkdir(dirname(join(cwd, path)), { recursive: true });
    await writeFile(join(cwd, path), content);
  }

  const plan = await planInit({
    cwd,
    workspaceRoot: cwd,
    framework,
    frameworkVersion: '1',
    language: 'ts',
    packageManager: 'pnpm',
    tailwind: 4,
    cssFile: join(cwd, 'src/style.css'),
    componentsDir: join(cwd, 'src/components/ui'),
    aliasPrefix: '@',
    base: framework === 'nuxt' || framework === 'vite-vue' ? 'reka' : 'base-ui',
    colorFormat: 'css',
    configFile: join(cwd, 'uitheme.json'),
  });

  return {
    manual: plan.manualSteps.join('\n'),
    entry: (path: string) =>
      plan.files.find((file) => file.path === join(cwd, path))?.content,
  };
}

const reactEntry = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
`;

describe('React provider', () => {
  it.each([
    ['tsx', reactEntry],
    ['jsx', reactEntry.replace('!)', ')')],
    ['js', reactEntry.replace('!)', ')')],
  ])(
    'wraps the root inside StrictMode in main.%s',
    async (extension, source) => {
      const { entry } = await init('vite-react', {
        [`src/main.${extension}`]: source,
      });

      expect(entry(`src/main.${extension}`)).toBe(
        `import { ThemeProvider } from './components/theme-provider';\n${source.replace(
          '    <App />\n',
          '    <ThemeProvider>\n      <App />\n    </ThemeProvider>\n'
        )}`
      );
    }
  );

  it('wraps the body after the directives of a Next layout', async () => {
    const source = `'use client';
// layout
export default function Layout({ children }) {
  return (<html><body className="a">{children}</body></html>);
}
`;

    const { entry } = await init('next', {
      'app/layout.jsx': source,
      'app/page.tsx': '',
    });

    expect(entry('app/layout.jsx')).toBe(
      `'use client';\nimport { ThemeProvider } from '../src/components/theme-provider';\n\n// layout\nexport default function Layout({ children }) {\n  return (<html suppressHydrationWarning><body className="a"><ThemeProvider>{children}</ThemeProvider></body></html>);\n}\n`
    );
  });

  it('reports TypeScript syntax in a JavaScript entry as a syntax error', async () => {
    const { manual, entry } = await init('vite-react', {
      'src/main.js': reactEntry,
    });

    expect(entry('src/main.js')).toBeUndefined();
    expect(manual).toContain('src/main.js has a syntax error');
  });
});

describe('Vue plugin', () => {
  it.each(['ts', 'js'])(
    'installs the plugin before mount in main.%s',
    async (extension) => {
      const source = `import { createApp } from 'vue';\nimport App from './App.vue';\n\nconst app = createApp(App);\napp.mount('#app');\n`;

      const { entry } = await init('vite-vue', {
        [`src/main.${extension}`]: source,
      });

      expect(entry(`src/main.${extension}`)).toBe(
        `import { createUITheme } from 'uitheme-web/vue';\n${source.replace(
          'app.mount',
          "app.use(createUITheme({ defaultTheme: 'system', defaultColorTheme: 'default', colorThemes: ['default'] })).mount"
        )}`
      );
    }
  );

  it('reports a syntax error in the entry', async () => {
    const { manual } = await init('vite-vue', {
      'src/main.ts': 'createApp(App).mount(',
    });

    expect(manual).toContain('src/main.ts has a syntax error');
  });
});

describe('Nuxt module', () => {
  it.each([
    [
      'ts',
      'export default defineNuxtConfig({\n  modules: [\n    "@nuxt/ui", // ui\n  ],\n} satisfies object);\n',
    ],
    ['js', 'export default defineNuxtConfig({ modules: ["@nuxt/ui"] });\n'],
    ['mjs', 'export default defineNuxtConfig({ ssr: false, /* keep */ });\n'],
  ])('adds the module in nuxt.config.%s', async (extension, source) => {
    const { entry } = await init('nuxt', {
      [`nuxt.config.${extension}`]: source,
    });

    expect(entry(`nuxt.config.${extension}`)).toBe(
      {
        ts: 'export default defineNuxtConfig({\n  modules: [\n    "@nuxt/ui", // ui\n  \'uitheme-web/nuxt\'],\n} satisfies object);\n',
        js: 'export default defineNuxtConfig({ modules: ["@nuxt/ui",\'uitheme-web/nuxt\'] });\n',
        mjs: "export default defineNuxtConfig({ ssr: false, /* keep */ \n  modules: ['uitheme-web/nuxt']\n});\n",
      }[extension]
    );
  });
});

describe('Tailwind 3 configuration', () => {
  it('extends a JavaScript and a TypeScript configuration', () => {
    for (const source of [
      'module.exports = { theme: { extend: { colors: { background: "white", }, }, }, darkMode: ["class"] };',
      "import type { Config } from 'tailwindcss';\nconst config = { darkMode: 'class', theme: {} } satisfies Config;\nexport default config;",
    ])
      expect(transformTailwind3(source, 'css')).toMatch(
        /"ring": "var\(--ring\)"/
      );
  });

  it('asks for manual setup when the configuration has a syntax error', () => {
    expect(() => transformTailwind3('module.exports = {', 'css')).toThrow(
      'Manual Tailwind setup required: configuration syntax is invalid'
    );
  });
});

describe('migration', () => {
  const source = `import { UIThemeProvider, UIThemeSwitcher } from '@ui-theme/web/react';
const lazy = import('@ui-theme/web/react');

export const App = () => (
  <UIThemeProvider>
    <UIThemeSwitcher />
  </UIThemeProvider>
);
`;

  const controls = {
    UIThemeSwitcher: {
      file: '@/components/ui/theme-switcher',
      exportName: 'ThemeSwitcher',
    },
  };

  it.each(['tsx', 'jsx', 'js'])(
    'rewrites imports and controls in a .%s file',
    (extension) => {
      expect(rewriteScript(source, `app.${extension}`, controls)).toEqual({
        text: `import { UIThemeProvider } from 'uitheme-web/react';
import { ThemeSwitcher as UIThemeSwitcher } from '@/components/ui/theme-switcher';
const lazy = import('uitheme-web/react');

export const App = () => (
  <UIThemeProvider>
    <UIThemeSwitcher />
  </UIThemeProvider>
);
`,
        diagnostics: [
          'Dynamic or require theme imports need a manual check for removed styled controls. Use explicit named imports first.',
        ],
      });
    }
  );

  it.each(['ts', 'mjs'])('rewrites module names in a .%s file', (extension) => {
    const script = `export * from '@ui-theme/web/react';\nconst theme = require(\`@ui-theme/web\`);\nexport const name = theme.UIThemeSelector;\n`;

    expect(rewriteScript(script, `theme.${extension}`, {})).toEqual({
      text: `export * from 'uitheme-web/react';\nconst theme = require(\`uitheme-web\`);\nexport const name = theme.UIThemeSelector;\n`,
      diagnostics: [
        'Removed styled control re-exports need manual migration to local registry components.',
        'UIThemeSelector: namespace control access requires a local component import and a manual prop review.',
      ],
    });
  });

  it.each(['ts', 'tsx', 'js', 'jsx', 'mjs'])(
    'leaves a .%s file with a syntax error unchanged',
    (extension) => {
      const broken =
        "import { UIThemeProvider } from '@ui-theme/web/react'\nconst = ;\n";

      expect(rewriteScript(broken, `broken.${extension}`, {})).toEqual({
        text: broken,
        diagnostics: [
          'Source syntax could not be parsed safely. Fix the syntax or migrate this file manually.',
        ],
      });
    }
  );

  it('rewrites only dependency blocks in package.json', () => {
    const manifest =
      '{\n  "name": "app",\n  "dependencies": {\n    "@ui-theme/web": "^1.0.0",\n    "react": "^19.0.0"\n  }\n}\n';

    expect(rewriteManifest(manifest)).toBe(
      '{\n  "name": "app",\n  "dependencies": {\n    "react": "^19.0.0",\n    "uitheme-web": "^2.0.0"\n  }\n}\n'
    );
  });
});
