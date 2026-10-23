<script setup lang="ts">
import { useUITheme, type TransitionOptions } from 'uitheme-vue';
import { THEME_SWATCHES } from '../theme-data';

const props = defineProps<{ settings: TransitionOptions }>();

const { resolvedTheme, createColorThemeToggle, isColorThemeActive, mounted } =
  useUITheme(() => props.settings);
</script>

<template>
  <section aria-labelledby="palette-heading" class="grid gap-6">
    <div class="grid gap-2">
      <p
        class="text-xs font-semibold tracking-widest text-muted-foreground uppercase"
      >
        02 / Color systems
      </p>
      <h2 id="palette-heading" class="text-3xl font-semibold tracking-tight">
        One interface. Six palettes.
      </h2>
    </div>
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <button
        v-for="palette in THEME_SWATCHES"
        :key="palette.value"
        type="button"
        class="grid gap-4 p-4! text-left"
        :class="{ 'ring-2 ring-ring': isColorThemeActive(palette.value) }"
        :aria-pressed="isColorThemeActive(palette.value)"
        :disabled="!mounted"
        @click="createColorThemeToggle(palette.value)($event)"
      >
        <span class="flex h-16 overflow-hidden rounded-md" aria-hidden="true"
          ><span
            v-for="color in ['primary', 'secondary', 'accent'] as const"
            :key="color"
            class="flex-1"
            :style="{ backgroundColor: palette.colors[resolvedTheme][color] }"
        /></span>
        <span class="text-sm font-medium">{{ palette.label }}</span>
      </button>
    </div>
  </section>
</template>
