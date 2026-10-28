export const componentBases = [
  { name: 'base-ui', title: 'Base UI', framework: 'react' },
  { name: 'radix', title: 'Radix UI', framework: 'react' },
  { name: 'reka', title: 'Vue / Reka', framework: 'vue' },
] as const;

export const componentDocs = [
  {
    name: 'theme-toggle',
    title: 'Theme Toggle',
    exportName: 'ThemeToggle',
    description: 'Switch between light and dark with an animated transition.',
  },
  {
    name: 'appearance-selector',
    title: 'Appearance Selector',
    exportName: 'AppearanceSelector',
    description: 'Choose light, dark, or the system appearance.',
  },
  {
    name: 'color-theme-selector',
    title: 'Color Theme Selector',
    exportName: 'ColorThemeSelector',
    description: 'Choose a color palette without changing the appearance.',
  },
  {
    name: 'transition-settings',
    title: 'Transition Settings',
    exportName: 'TransitionSettings',
    description: 'Choose the effect and duration for theme transitions.',
  },
] as const;

export type ComponentBase = (typeof componentBases)[number]['name'];

export type ComponentDoc = (typeof componentDocs)[number];

export interface ComponentSource {
  tailwind: number;
  language: string;
  dependencies: string[];
  files: { path: string; content: string; type: string }[];
}

export function componentDocUrl(base: ComponentBase, component: string) {
  return `/docs/components/${base}/${component}`;
}

export function componentUsage(doc: ComponentDoc, base: ComponentBase) {
  if (doc.name === 'transition-settings') {
    return base === 'reka'
      ? `<script setup lang="ts">\nimport { ref } from 'vue';\nimport { UIThemeProvider, ThemeAnimationType } from 'uitheme-web/vue';\nimport TransitionSettings from '@/components/ui/transition-settings.vue';\n\nconst settings = ref({ animationType: ThemeAnimationType.CIRCLE, duration: 400 });\n</script>\n\n<template>\n  <UIThemeProvider v-bind="settings">\n    <TransitionSettings v-model="settings" />\n  </UIThemeProvider>\n</template>`
      : `'use client';\n\nimport { useState } from 'react';\nimport { UIThemeProvider, ThemeAnimationType } from 'uitheme-web/react';\nimport { TransitionSettings } from '@/components/ui/transition-settings';\n\nexport function Example() {\n  const [settings, setSettings] = useState({\n    animationType: ThemeAnimationType.CIRCLE,\n    duration: 400,\n  });\n\n  return (\n    <UIThemeProvider {...settings}>\n      <TransitionSettings value={settings} onValueChange={setSettings} />\n    </UIThemeProvider>\n  );\n}`;
  }

  const options =
    doc.name === 'color-theme-selector'
      ? base === 'reka'
        ? " :color-themes=\"['default', 'caffeine']\""
        : " colorThemes={['default', 'caffeine']}"
      : '';

  return base === 'reka'
    ? `<script setup lang="ts">\nimport { UIThemeProvider } from 'uitheme-web/vue';\nimport ${doc.exportName} from '@/components/ui/${doc.name}.vue';\n</script>\n\n<template>\n  <UIThemeProvider${options}>\n    <${doc.exportName} />\n  </UIThemeProvider>\n</template>`
    : `'use client';\n\nimport { UIThemeProvider } from 'uitheme-web/react';\nimport { ${doc.exportName} } from '@/components/ui/${doc.name}';\n\nexport function Example() {\n  return (\n    <UIThemeProvider${options}>\n      <${doc.exportName} />\n    </UIThemeProvider>\n  );\n}`;
}
