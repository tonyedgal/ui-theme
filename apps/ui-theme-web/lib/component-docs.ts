export const componentBases = [
  { name: 'base-ui', title: 'Base UI', framework: 'react' },
  { name: 'radix', title: 'Radix UI', framework: 'react' },
  { name: 'reka', title: 'Vue / Reka', framework: 'vue' },
] as const;

export const componentCategories = [
  {
    name: 'toggles',
    title: 'Toggles',
    description: 'Switch between light and dark.',
  },
  {
    name: 'switchers',
    title: 'Switchers',
    description: 'Keep system, light, and dark choices visible.',
  },
  {
    name: 'selectors',
    title: 'Selectors',
    description: 'Open a menu to choose an appearance or color palette.',
  },
  {
    name: 'disclosures',
    title: 'Disclosures',
    description: 'Expand theme choices within the page layout.',
  },
] as const;

export const componentDocs = [
  {
    name: 'theme-toggle',
    category: 'toggles',
    title: 'Theme Toggle',
    exportName: 'ThemeToggle',
    description: 'Switch between light and dark with an animated transition.',
  },
  {
    name: 'icon-theme-toggle',
    category: 'toggles',
    title: 'Icon Theme Toggle',
    exportName: 'IconThemeToggle',
    description:
      'Animate between sun and moon icons while changing the UI theme.',
  },
  {
    name: 'theme-switcher',
    category: 'switchers',
    title: 'Theme Switcher',
    exportName: 'ThemeSwitcher',
    description:
      'Choose system, light, or dark with a moving selection surface.',
  },
  {
    name: 'theme-selector',
    category: 'selectors',
    title: 'Theme Selector',
    exportName: 'ThemeSelector',
    description: 'Choose light, dark, or the system appearance.',
  },
  {
    name: 'color-theme-selector',
    category: 'selectors',
    title: 'Color Theme Selector',
    exportName: 'ColorThemeSelector',
    description: 'Choose a color palette without changing the appearance.',
  },
  {
    name: 'theme-disclosure',
    category: 'disclosures',
    title: 'Theme Disclosure',
    exportName: 'ThemeDisclosure',
    description: 'Expand light, dark, and system choices inside a muted frame.',
  },
  {
    name: 'color-theme-disclosure',
    category: 'disclosures',
    title: 'Color Theme Disclosure',
    exportName: 'ColorThemeDisclosure',
    description: 'Expand color palette choices within the page layout.',
  },
] as const;

export const componentGroups = componentCategories.map((category) => ({
  ...category,
  components: componentDocs.filter((doc) => doc.category === category.name),
}));

export type ComponentBase = (typeof componentBases)[number]['name'];

export type ComponentDoc = Omit<
  (typeof componentDocs)[number],
  'title' | 'description'
> & {
  title: string;
  description: string;
};

export interface ComponentSource {
  tailwind: number;
  language: string;
  dependencies: string[];
  files: { path: string; content: string; html?: string; type: string }[];
}

export function componentDocUrl(base: ComponentBase, component: string) {
  return `/docs/components/${base}/${component}`;
}

export interface ComponentExample {
  id: string;
  title: string;
  description: string;
  display?: 'text' | 'icon-text';
  borderStyle?: 'solid' | 'shadow';
  effect?: 'rotate' | 'slide' | 'blur';
  animationType?: 'slide';
  duration?: number;
  slideDirection?: 'right';
  direction?: 'up' | 'down';
}

export function componentExamples(doc: ComponentDoc): ComponentExample[] {
  const examples: ComponentExample[] = [];

  examples.push({
    id: 'theme-transition',
    title: 'Theme transition',
    description:
      'A slide transition declared on this control. Duration is 500 milliseconds. Other controls keep their own settings.',
    animationType: 'slide',
    duration: 500,
    slideDirection: 'right',
  });

  if (doc.category === 'disclosures')
    examples.push({
      id: 'opens-upward',
      title: 'Opens upward',
      description:
        'Place the choices above the trigger and the label below it. Reserved space keeps the preview and trigger in place.',
      direction: 'up',
    });

  if (doc.category !== 'disclosures')
    examples.push({
      id: 'shadow-borders',
      title: 'Shadow borders',
      description:
        'Use a prominent ambient shadow and inset edge in place of a solid border.',
      borderStyle: 'shadow',
    });

  if (
    doc.name === 'theme-toggle' ||
    doc.name === 'theme-selector' ||
    doc.name === 'theme-disclosure'
  )
    examples.push({
      id: 'icon-with-text',
      title: 'Icon with text',
      description: 'Show an icon beside the theme label.',
      display: 'icon-text',
    });

  if (doc.name === 'icon-theme-toggle')
    examples.push(
      {
        id: 'slide-icons',
        title: 'Slide icons',
        description:
          'Sun and moon exchange places with a short sideways movement.',
        effect: 'slide',
      },
      {
        id: 'blur-icons',
        title: 'Blur icons',
        description: 'A brief blur and crossfade joins the two states.',
        effect: 'blur',
      }
    );

  return examples;
}

export function componentUsage(
  doc: ComponentDoc,
  base: ComponentBase,
  example?: ComponentExample
) {
  let source = defaultComponentUsage(doc, base);
  const attributes: string[] = [];

  if (example?.borderStyle)
    attributes.push(
      base === 'reka'
        ? `border-style="${example.borderStyle}"`
        : `borderStyle="${example.borderStyle}"`
    );

  if (example?.display) attributes.push(`display="${example.display}"`);

  if (example?.direction) attributes.push(`direction="${example.direction}"`);

  if (example?.effect) attributes.push(`effect="${example.effect}"`);

  if (example?.animationType) {
    source = source.replace(
      'UIThemeProvider }',
      'UIThemeProvider, ThemeAnimationType }'
    );

    if (example.slideDirection)
      attributes.push(
        base === 'reka'
          ? `slide-direction="${example.slideDirection}"`
          : `slideDirection="${example.slideDirection}"`
      );
    attributes.push(
      base === 'reka'
        ? ':animation-type="ThemeAnimationType.SLIDE"'
        : 'animationType={ThemeAnimationType.SLIDE}'
    );
    attributes.push(
      base === 'reka'
        ? `:duration="${example.duration}"`
        : `duration={${example.duration}}`
    );
  }

  if (attributes.length)
    source = source.replace(
      `<${doc.exportName}`,
      `<${doc.exportName} ${attributes.join(' ')}`
    );

  if (doc.category === 'disclosures') {
    const indent = base === 'reka' ? '    ' : '      ';
    source = source.replace(
      new RegExp(`${indent}(<${doc.exportName}[^\\n]* />)`),
      `${indent}<div class${base === 'reka' ? '' : 'Name'}="flex h-96 flex-col ${example?.direction === 'up' ? 'justify-end' : 'justify-start'}">\n${indent}  $1\n${indent}</div>`
    );
  }

  return source;
}

function defaultComponentUsage(doc: ComponentDoc, base: ComponentBase) {
  const options = doc.name.startsWith('color-theme-')
    ? base === 'reka'
      ? " :color-themes=\"['default', 'caffeine']\""
      : " colorThemes={['default', 'caffeine']}"
    : '';

  return base === 'reka'
    ? `<script setup lang="ts">\nimport { UIThemeProvider } from 'uitheme-web/vue';\nimport ${doc.exportName} from '@/components/ui/${doc.name}.vue';\n</script>\n\n<template>\n  <UIThemeProvider${options}>\n    <${doc.exportName} />\n  </UIThemeProvider>\n</template>`
    : `'use client';\n\nimport { UIThemeProvider } from 'uitheme-web/react';\nimport { ${doc.exportName} } from '@/components/ui/${doc.name}';\n\nexport function Example() {\n  return (\n    <UIThemeProvider${options}>\n      <${doc.exportName} />\n    </UIThemeProvider>\n  );\n}`;
}
