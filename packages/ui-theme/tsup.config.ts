import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'core/index': 'src/core/index.ts',
    'react/index': 'src/react/index.ts',
    // Future framework implementations:
    // 'vue/index': 'src/vue/index.ts',
    // 'angular/index': 'src/angular/index.ts',
    // 'svelte/index': 'src/svelte/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
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
});
