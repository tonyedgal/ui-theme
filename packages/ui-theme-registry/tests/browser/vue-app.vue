<script setup lang="ts">
import { ref } from 'vue';
import { ThemeAnimationType, useUITheme } from 'uitheme-web/vue';
import ThemeToggle from '../../src/templates/vue/reka/theme-toggle.vue';
import AppearanceSelector from '../../src/templates/vue/reka/appearance-selector.vue';
import ColorThemeSelector from '../../src/templates/vue/reka/color-theme-selector.vue';
import TransitionSettings from '../../src/templates/vue/reka/transition-settings.vue';

const state = useUITheme();

const settings = ref({
  animationType: ThemeAnimationType.CIRCLE,
  duration: 400,
});
</script>

<template>
  <ThemeToggle />
  <AppearanceSelector />
  <ColorThemeSelector />
  <TransitionSettings v-model="settings" duration-label="Transition duration" />
  <output id="state"
    >{{ state.theme.value }}/{{ state.colorTheme.value }}/{{
      settings.duration
    }}</output
  >
</template>
