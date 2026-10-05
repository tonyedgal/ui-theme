import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import next from '@next/eslint-plugin-next';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import { fileURLToPath } from 'node:url';
import globals from 'globals';
import prettier from 'eslint-config-prettier/flat';
import { all as antiSlop } from 'antislop-plugin/eslint';
import { plugin as shadcn } from '@shadcn/lint';

const scripts = ['**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}'];

const typescript = ['**/*.{ts,mts,cts,tsx}'];

const nextApps = [
  'apps/ui-theme-web/**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}',
  'apps/examples/example-next/**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}',
];

export default defineConfig([
  globalIgnores([
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/out/**',
    '**/.next/**',
    '**/.source/**',
    '**/.output/**',
    '**/.nitro/**',
    '**/.vercel/**',
    '**/.turbo/**',
    '**/coverage/**',
    '**/playwright-report/**',
    '**/test-results/**',
    '**/routeTree.gen.ts',
    '**/next-env.d.ts',
  ]),
  {
    files: scripts,
    extends: [js.configs.recommended],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: typescript,
    extends: [tseslint.configs.recommended],
  },
  {
    files: scripts,
    extends: [
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
      reactHooks.configs.flat.recommended,
    ],
    settings: { react: { version: 'detect' } },
  },
  {
    files: nextApps,
    extends: [
      next.configs.recommended,
      next.configs['core-web-vitals'],
      jsxA11y.flatConfigs.recommended,
    ],
    settings: {
      next: {
        rootDir: [
          fileURLToPath(new URL('./apps/ui-theme-web/', import.meta.url)),
          fileURLToPath(
            new URL('./apps/examples/example-next/', import.meta.url)
          ),
        ],
      },
      'jsx-a11y': { components: { Image: 'img' } },
    },
    plugins: { import: importPlugin },
    rules: { 'import/no-anonymous-default-export': 'warn' },
  },
  {
    files: ['apps/ui-theme-web/**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}'],
    plugins: { shadcn },
  },
  {
    files: scripts,
    languageOptions: { parser: tseslint.parser },
    extends: [antiSlop],
  },
  // Keep formatting in Prettier; all anti-slop policy rules stay enabled.
  prettier,
  {
    files: scripts,
    // Prettier disables this recommended ASI check; retain the requested safety rule.
    rules: { 'no-unexpected-multiline': 'error' },
  },
]);
