<script setup lang="ts">
import { UIThemeProvider, UIThemeSwitcher, useUITheme } from 'uitheme-vue';
import { defineComponent, h } from 'vue';

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
    <UIThemeSwitcher :themes="['light', 'dark', 'system']" />
    <Commands />
  </UIThemeProvider>
</template>
