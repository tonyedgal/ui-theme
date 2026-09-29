import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: {
      'core/index': 'src/core/index.ts',
      'react/index': 'src/react/index.ts',
      'tanstack/index': 'src/tanstack/index.ts',
      // Future framework implementations:
      // 'vue/index': 'src/vue/index.ts',
      // 'angular/index': 'src/angular/index.ts',
      // 'svelte/index': 'src/svelte/index.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: false,
    clean: false,
    treeshake: true,
    minify: false,
    external: [
      'react',
      'react-dom',

      // Future framework externals:
      // 'vue',
      // '@angular/core',
      // '@angular/common',
      // 'svelte',
    ],
  },
  {
    // The migration command. It ships as ESM only, it carries a shebang so the
    // file runs directly, and it declares no build-time externals, so the
    // colour helper is bundled in and the package keeps no runtime dependency.
    entry: { 'cli/index': 'src/cli/index.ts' },
    format: ['esm'],
    dts: false,
    splitting: false,
    sourcemap: false,
    clean: false,
    treeshake: true,
    minify: false,
    banner: { js: '#!/usr/bin/env node' },
  },
]);
