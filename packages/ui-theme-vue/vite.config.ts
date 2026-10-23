import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        nuxt: 'src/nuxt.ts',
        bootstrap: 'src/bootstrap.ts',
      },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
    },
    sourcemap: true,
    rollupOptions: { external: ['vue', '@nuxt/kit'] },
  },
});
