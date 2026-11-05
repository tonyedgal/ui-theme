<script setup lang="ts">
import { useUITheme } from 'uitheme-web/vue';
import ThemeSelect from './ThemeSelect.vue';

const theme = useUITheme();

function select(value: string, element: HTMLElement) {
  const selected = theme.themes.find((option) => option === value);

  if (selected) void theme.switchTheme(selected, { element });
}
</script>

<template>
  <ThemeSelect
    label="Theme"
    :value="theme.theme.value"
    :options="theme.themes"
    :disabled="!theme.mounted.value"
    @select="select"
  />
</template>
