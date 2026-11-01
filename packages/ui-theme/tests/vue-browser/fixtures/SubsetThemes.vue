<script setup lang="ts">
import { UIThemeProvider, useUITheme } from 'uitheme-web/vue';
import { defineComponent, h } from 'vue';
import ThemeSelector from '../../../../../apps/examples/vue-theme-demo/src/components/ui/theme-selector.vue';

defineProps<{ singleton: boolean }>();

const Commands = defineComponent({
  setup() {
    const { theme, toggleTheme } = useUITheme();

    return () =>
      h('div', [
        h('output', { 'data-theme': theme.value }, theme.value),
        h('button', { onClick: () => toggleTheme(true) }, 'Toggle'),
      ]);
  },
});
</script>

<template>
  <UIThemeProvider
    :options="{
      themes: singleton ? ['light'] : ['light', 'system'],
      defaultTheme: 'light',
      storage: false,
    }"
  >
    <ThemeSelector />
    <Commands />
  </UIThemeProvider>
</template>
