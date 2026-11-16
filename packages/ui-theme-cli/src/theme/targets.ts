import type { Framework } from '../types.ts';

export interface ReactTarget {
  kind: 'react';
  provider: string;
  hook: string;
  module: string;
  accepts: string[];
  directive: boolean;
  stems: string[];
  document: boolean;
  headScript?: string;
  systemThemeMode?: 'js';
}

export interface VueTarget {
  kind: 'vue' | 'nuxt';
}

export type ThemeTarget = ReactTarget | VueTarget;

const targets: Record<Framework, ThemeTarget> = {
  next: {
    kind: 'react',
    provider: 'NextUIThemeProvider',
    hook: 'useNextUITheme',
    module: 'uitheme-web/next',
    accepts: ['NextUIThemeProvider'],
    directive: true,
    stems: ['src/app/layout', 'app/layout'],
    document: true,
  },
  tanstack: {
    kind: 'react',
    provider: 'TanStackUIThemeProvider',
    hook: 'useTanStackUITheme',
    module: 'uitheme-web/react',
    accepts: ['TanStackUIThemeProvider'],
    directive: false,
    stems: ['src/routes/__root', 'app/routes/__root'],
    document: true,
    headScript: 'TanStackStartThemeScript',
    systemThemeMode: 'js',
  },
  'vite-react': {
    kind: 'react',
    provider: 'UIThemeProvider',
    hook: 'useUITheme',
    module: 'uitheme-web/react',
    accepts: ['UIThemeProvider', 'ViteUIThemeProvider'],
    directive: false,
    stems: ['src/main', 'src/index', 'main'],
    document: false,
  },
  'vite-vue': { kind: 'vue' },
  nuxt: { kind: 'nuxt' },
};

export function targetFor(framework: Framework): ThemeTarget {
  return targets[framework];
}

export const reactProviders = [
  'UIThemeProvider',
  'NextUIThemeProvider',
  'TanStackUIThemeProvider',
  'ViteUIThemeProvider',
];
