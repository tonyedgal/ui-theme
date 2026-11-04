import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@/lib/utils': fileURLToPath(
        new URL('../../../../apps/ui-theme-web/lib/utils.ts', import.meta.url)
      ),
    },
  },
  esbuild: { jsx: 'automatic' },
});
