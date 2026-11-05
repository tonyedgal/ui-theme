import { createApp } from 'vue';
import SubsetThemes from './SubsetThemes.vue';

createApp(SubsetThemes, {
  singleton: new URLSearchParams(location.search).has('singleton'),
}).mount('#app');
