<script setup lang="ts">
import { useUITheme } from 'uitheme-web/vue';
import ThemeToggle from '../../src/templates/vue/reka/theme-toggle.vue';
import ThemeSelector from '../../src/templates/vue/reka/theme-selector.vue';
import ColorThemeSelector from '../../src/templates/vue/reka/color-theme-selector.vue';
import ThemeSwitcher from '../../src/templates/vue/reka/theme-switcher.vue';
import IconThemeToggle from '../../src/templates/vue/reka/icon-theme-toggle.vue';

import ThemeDisclosure from '../../src/templates/vue/reka/theme-disclosure.vue';
import ColorThemeDisclosure from '../../src/templates/vue/reka/color-theme-disclosure.vue';

const state = useUITheme();
</script>

<template>
  <ThemeToggle />
  <ThemeSelector />
  <ColorThemeSelector />
  <IconThemeToggle /><ThemeSwitcher />
  <ThemeDisclosure label="Inline theme" direction="up" />
  <ColorThemeDisclosure label="Inline color theme" />
  <output id="state"
    >{{ state.theme.value }}/{{ state.colorTheme.value }}</output
  >
</template>
