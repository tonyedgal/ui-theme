export default defineNuxtConfig({
  compatibilityDate: '2026-10-22',
  modules: ['uitheme-vue/nuxt'],
  uiTheme: {
    defaultTheme: 'system',
    colorThemes: [
      'default',
      'caffeine',
      'mono',
      'supabase',
      'mocha',
      'perpetuity',
    ],
  },
  css: ['@ui-theme/vue-demo/styles.css'],
  postcss: { plugins: { '@tailwindcss/postcss': {} } },
  devtools: { enabled: false },
  app: { head: { title: 'UI Theme · Nuxt', htmlAttrs: { lang: 'en' } } },
});
