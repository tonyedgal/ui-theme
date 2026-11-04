import { createApp } from 'vue';
import { createUITheme } from 'uitheme-web/vue';
import App from './vue-app.vue';

createApp(App)
  .use(
    createUITheme({
      defaultTheme: 'light',
      colorThemes: ['default', 'ocean'],
      duration: 0,
    })
  )
  .mount('#root');
