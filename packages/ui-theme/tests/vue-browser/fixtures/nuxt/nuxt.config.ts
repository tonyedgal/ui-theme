import { fileURLToPath } from 'node:url';
import { COLOR_THEMES } from '../shared/themes';

export default defineNuxtConfig({
  compatibilityDate: '2026-10-22',
  modules: ['uitheme-web/nuxt'],
  uiTheme: { defaultTheme: 'system', colorThemes: [...COLOR_THEMES] },
  css: [fileURLToPath(new URL('../shared/styles.css', import.meta.url))],
  devtools: { enabled: false },
  telemetry: false,
  app: { head: { title: 'Nuxt theme harness', htmlAttrs: { lang: 'en' } } },
});
