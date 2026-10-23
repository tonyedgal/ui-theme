<script setup lang="ts">
import { useUITheme } from '../context';

const props = withDefaults(defineProps<{ label?: string }>(), {
  label: 'Color theme',
});

const { colorTheme, colorThemes, setColorTheme } = useUITheme();

function change(event: Event) {
  const target = event.currentTarget;

  if (target instanceof HTMLSelectElement) void setColorTheme(target.value);
}
</script>

<template>
  <select :aria-label="props.label" :value="colorTheme" @change="change">
    <option v-for="value in colorThemes" :key="value" :value="value">
      {{ value.charAt(0).toUpperCase() + value.slice(1) }}
    </option>
  </select>
</template>
