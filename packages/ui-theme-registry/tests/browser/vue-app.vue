<script setup lang="ts">
import { useUITheme } from 'uitheme-web/vue';
import ThemeToggle from '../../src/templates/vue/reka/theme-toggle.vue';
import ThemeSelector from '../../src/templates/vue/reka/theme-selector.vue';
import ColorThemeSelector from '../../src/templates/vue/reka/color-theme-selector.vue';
import ThemeSwitcher from '../../src/templates/vue/reka/theme-switcher.vue';
import IconThemeToggle from '../../src/templates/vue/reka/icon-theme-toggle.vue';
import TactileThemeToggle from '../../src/templates/vue/reka/tactile-theme-toggle.vue';
import ThemeDisclosure from '../../src/templates/vue/reka/theme-disclosure.vue';
import ColorThemeDisclosure from '../../src/templates/vue/reka/color-theme-disclosure.vue';
import SdkThemeToggle from '../../src/templates/vue/ui-sdk/theme-toggle.vue';
import SdkThemeSelector from '../../src/templates/vue/ui-sdk/theme-selector.vue';
import SdkColorThemeSelector from '../../src/templates/vue/ui-sdk/color-theme-selector.vue';
import SdkThemeSwitcher from '../../src/templates/vue/ui-sdk/theme-switcher.vue';
import SdkIconThemeToggle from '../../src/templates/vue/ui-sdk/icon-theme-toggle.vue';
import SdkTactileThemeToggle from '../../src/templates/vue/ui-sdk/tactile-theme-toggle.vue';
import SdkThemeDisclosure from '../../src/templates/vue/ui-sdk/theme-disclosure.vue';
import SdkColorThemeDisclosure from '../../src/templates/vue/ui-sdk/color-theme-disclosure.vue';

const sets = {
  reka: {
    Toggle: ThemeToggle,
    Selector: ThemeSelector,
    ColorSelector: ColorThemeSelector,
    Icon: IconThemeToggle,
    Tactile: TactileThemeToggle,
    Switcher: ThemeSwitcher,
    Disclosure: ThemeDisclosure,
    ColorDisclosure: ColorThemeDisclosure,
  },
  'ui-sdk': {
    Toggle: SdkThemeToggle,
    Selector: SdkThemeSelector,
    ColorSelector: SdkColorThemeSelector,
    Icon: SdkIconThemeToggle,
    Tactile: SdkTactileThemeToggle,
    Switcher: SdkThemeSwitcher,
    Disclosure: SdkThemeDisclosure,
    ColorDisclosure: SdkColorThemeDisclosure,
  },
};

const requested = new URLSearchParams(location.search).get('base') ?? 'reka';

const set = sets[requested === 'ui-sdk' ? 'ui-sdk' : 'reka'];

const state = useUITheme();
</script>

<template>
  <component :is="set.Toggle" />
  <component :is="set.Selector" />
  <component :is="set.ColorSelector" />
  <component :is="set.Icon" /><component :is="set.Switcher" />
  <component :is="set.Tactile" />
  <component :is="set.Disclosure" label="Inline theme" direction="up" />
  <component :is="set.ColorDisclosure" label="Inline color theme" />
  <output id="state"
    >{{ state.theme.value }}/{{ state.colorTheme.value }}</output
  >
</template>
