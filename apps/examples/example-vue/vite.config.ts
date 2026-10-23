import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { getThemeScript } from 'uitheme-vue/bootstrap';

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    {
      name: 'uitheme-before-paint',
      transformIndexHtml: (html) =>
        html.replace(
          '<!--uitheme-script-->',
          `<script>${getThemeScript({ colorThemes: ['default', 'caffeine', 'mono', 'supabase', 'mocha', 'perpetuity'] })}</script>`
        ),
    },
  ],
});
