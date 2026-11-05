import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { getThemeScript } from 'uitheme-web/vue/bootstrap';
import { COLOR_THEMES } from '../shared/themes';

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'uitheme-before-paint',
      transformIndexHtml: (html) =>
        html.replace(
          '<!--uitheme-script-->',
          `<script>${getThemeScript({ colorThemes: [...COLOR_THEMES] })}</script>`
        ),
    },
  ],
});
