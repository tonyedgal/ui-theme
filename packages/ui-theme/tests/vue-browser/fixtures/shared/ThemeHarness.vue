<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import { ThemeAnimationType, useUITheme } from 'uitheme-web/vue';
import AppearanceSelect from './AppearanceSelect.vue';
import ThemeSelect from './ThemeSelect.vue';

const effect = shallowRef(ThemeAnimationType.CIRCLE);

const logo = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="#34a85a" d="M50 0 100 50 50 100 0 50z"/></svg>')}`;

const settings = computed(() => ({
  animationType: effect.value,
  duration: 600,
  logo,
}));

const theme = useUITheme(settings);

const effects = Object.values(ThemeAnimationType);

const title = (value: string) => value[0]!.toUpperCase() + value.slice(1);
</script>

<template>
  <main :data-ready="theme.mounted.value">
    <h1>Theme harness</h1>
    <button
      type="button"
      :disabled="!theme.mounted.value"
      @click="theme.toggleTheme($event)"
    >
      Preview transition
    </button>
    <AppearanceSelect />
    <ThemeSelect
      label="Color theme"
      :value="theme.colorTheme.value"
      :options="theme.colorThemes"
      :disabled="!theme.mounted.value"
      @select="(value, element) => theme.switchColorTheme(value, { element })"
    />
    <select v-model="effect" aria-label="Transition style">
      <option v-for="value in effects" :key="value" :value="value">
        {{ value }}
      </option>
    </select>
    <div>
      <button
        v-for="palette in theme.colorThemes"
        :key="palette"
        type="button"
        :aria-pressed="theme.isColorThemeActive(palette)"
        :disabled="!theme.mounted.value"
        @click="theme.createColorThemeToggle(palette)($event)"
      >
        {{ title(palette) }}
      </button>
    </div>
  </main>
</template>
