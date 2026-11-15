import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';

const app = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: '/vue-preview/',
  plugins: [vue()],
  resolve: {
    alias: [{ find: /^@\//, replacement: `${app}` }],
    dedupe: ['vue'],
  },
  build: {
    outDir: fileURLToPath(new URL('../public/vue-preview', import.meta.url)),
    emptyOutDir: true,
  },
});
