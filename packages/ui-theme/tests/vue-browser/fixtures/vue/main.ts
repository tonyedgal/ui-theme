import { createApp } from 'vue';
import { createUITheme } from 'uitheme-web/vue';
import ThemeHarness from '../shared/ThemeHarness.vue';
import { COLOR_THEMES } from '../shared/themes';
import '../shared/styles.css';

createApp(ThemeHarness)
  .use(createUITheme({ colorThemes: COLOR_THEMES }))
  .mount('#app');
