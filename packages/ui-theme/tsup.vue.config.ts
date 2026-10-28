import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'vue/index': 'src/vue/index.ts',
    'vue/bootstrap': 'src/vue/bootstrap.ts',
    nuxt: 'src/nuxt.ts',
  },
  format: ['esm'],
  dts: true,
  splitting: true,
  sourcemap: false,
  clean: false,
  treeshake: true,
  minify: true,
  external: ['vue', 'nuxt/kit', 'nuxt/schema', 'uitheme-web/core'],
});
