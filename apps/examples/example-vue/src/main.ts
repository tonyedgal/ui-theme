import { createApp } from 'vue';
import { createUITheme } from 'uitheme-vue';
import { COLOR_THEMES } from '@ui-theme/vue-demo/theme-data';
import ThemeDemo from '@ui-theme/vue-demo';
import '@ui-theme/vue-demo/styles.css';

createApp(ThemeDemo, { framework: 'Vue', rendering: 'Client rendered' })
  .use(createUITheme({ colorThemes: COLOR_THEMES }))
  .mount('#app');
