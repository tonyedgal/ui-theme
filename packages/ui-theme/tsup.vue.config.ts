import { defineConfig } from 'tsup';

const shared = {
  dts: true,
  splitting: true,
  sourcemap: false,
  clean: false,
  treeshake: true,
  minify: true,
  external: ['vue', 'nuxt/kit', 'nuxt/schema', 'uitheme-web/core'],
};

export default defineConfig([
  {
    ...shared,
    entry: {
      'vue/index': 'src/vue/index.ts',
      'vue/bootstrap': 'src/vue/bootstrap.ts',
      nuxt: 'src/nuxt.ts',
    },
    format: ['esm'],
  },
  {
    // nuxt 4 is esm-only, so ./nuxt has no cjs build
    ...shared,
    entry: {
      'vue/index': 'src/vue/index.ts',
      'vue/bootstrap': 'src/vue/bootstrap.ts',
    },
    format: ['cjs'],
  },
]);
