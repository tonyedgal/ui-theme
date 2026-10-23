<script setup lang="ts">
import { computed } from 'vue';
import { useUITheme } from '../context';
import type { Theme } from '../core';

const props = withDefaults(
  defineProps<{ themes?: readonly Theme[]; label?: string }>(),
  { label: 'Appearance', themes: undefined }
);

const {
  theme,
  themes: availableThemes,
  setTheme,
  resolvedTheme,
} = useUITheme();

const choices = computed(() => {
  const values = (props.themes ?? availableThemes).filter((value) =>
    availableThemes.includes(value)
  );

  if (!values.length)
    throw new Error('UIThemeSwitcher requires at least one configured theme.');

  return values;
});

const selected = computed(() =>
  choices.value.includes(theme.value)
    ? theme.value
    : choices.value.includes(resolvedTheme.value)
      ? resolvedTheme.value
      : ''
);

function change(event: Event) {
  const target = event.currentTarget;

  if (!(target instanceof HTMLSelectElement)) return;
  const value = availableThemes.find((theme) => theme === target.value);

  if (value) void setTheme(value);
}
</script>

<template>
  <select :aria-label="props.label" :value="selected" @change="change">
    <option v-if="!selected" value="" disabled>Choose appearance</option>
    <option v-for="value in choices" :key="value" :value="value">
      {{ value.charAt(0).toUpperCase() + value.slice(1) }}
    </option>
  </select>
</template>
