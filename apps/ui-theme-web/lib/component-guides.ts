import type { ComponentBase, ComponentDoc } from './component-docs';

export const componentSections = [
  { id: 'preview', title: 'Preview' },
  { id: 'when-to-use', title: 'When to use' },
  { id: 'when-not-to-use', title: 'When not to use' },
  { id: 'installation', title: 'Installation' },
  { id: 'usage', title: 'Usage' },
  { id: 'api-reference', title: 'API reference' },
  { id: 'keyboard', title: 'Keyboard' },
  { id: 'accessibility', title: 'Accessibility' },
  { id: 'theme-behavior', title: 'Theme behavior' },
  { id: 'ai-agent-notes', title: 'AI Agent notes' },
  { id: 'source', title: 'Source' },
  { id: 'customization', title: 'Customization' },
  { id: 'credits', title: 'Credits' },
] as const;

export interface ComponentCredit {
  name: string;
  url: string;
  contribution: string;
}

interface ComponentGuide {
  whenToUse: string[];
  whenNotToUse: string[];
  keyboard: { key: string; action: string }[];
  accessibility: string[];
  themeBehavior: string[];
  agentNotes: string[];
  inspiration?: ComponentCredit[];
}

export const componentGuides: Record<ComponentDoc['name'], ComponentGuide> = {
  'theme-toggle': {
    whenToUse: [
      'Offer a compact light/dark action in a header, toolbar, or account menu.',
      'Let people switch appearance from the control they just pressed, with an animated reveal.',
    ],
    whenNotToUse: [
      'People need to choose or return to the system preference. Use Appearance Selector.',
      'People are choosing a color palette. Use Color Theme Selector.',
    ],
    keyboard: [
      {
        key: 'Enter / Space',
        action: 'Toggle between the resolved light and dark appearance.',
      },
    ],
    accessibility: [
      'Keep a meaningful label when changing the visible content.',
      'The pressed state reports whether the resolved appearance is dark. The control stays disabled until the provider mounts.',
    ],
    themeBehavior: [
      'The toggle reads resolvedTheme and writes an explicit light or dark preference. A system preference becomes an explicit choice after toggling.',
      'The clicked button anchors switchTheme. Reduced motion and unsupported transitions use the engine’s immediate fallback.',
    ],
    agentNotes: [
      'Read resolvedTheme to choose the opposite appearance; do not treat system as a third visual mode.',
      'Keep the canonical switchTheme call and its element origin when customizing the button.',
    ],
  },
  'appearance-selector': {
    whenToUse: [
      'Expose light, dark, and system preferences in application settings.',
      'Show the provider’s configured appearance choices in one labeled control.',
    ],
    whenNotToUse: [
      'A toolbar needs only a quick light/dark action. Use Theme Toggle.',
      'The choice changes brand colors rather than appearance. Use Color Theme Selector.',
    ],
    keyboard: [
      {
        key: 'Enter / Space',
        action: 'Open the selector or confirm the focused option.',
      },
      {
        key: 'Arrow keys',
        action: 'Move between available appearance options.',
      },
      {
        key: 'Escape',
        action: 'Close the menu and return focus to the trigger.',
      },
    ],
    accessibility: [
      'Keep the label associated with the trigger and preserve the primitive’s focus handling.',
      'The option list comes from the provider. Avoid showing a system option when that option is not configured.',
    ],
    themeBehavior: [
      'The selected value is the preference, not resolvedTheme. System stays selected when the operating system changes appearance.',
      'Changes use switchTheme and the trigger as the transition origin. Color theme stays independent.',
    ],
    agentNotes: [
      'Read the provider’s themes array. Do not hard-code three options for a provider with a smaller set.',
      'Use theme for the selected value and resolvedTheme only for visual appearance.',
    ],
  },
  'color-theme-selector': {
    whenToUse: [
      'Let people choose between application palettes without changing light/dark mode.',
      'Expose readable labels for the palette keys configured on the provider.',
    ],
    whenNotToUse: [
      'People are choosing light, dark, or system. Use Appearance Selector.',
      'You need a free-form color picker. This control selects registered palette keys.',
    ],
    keyboard: [
      {
        key: 'Enter / Space',
        action: 'Open the selector or confirm the focused palette.',
      },
      { key: 'Arrow keys', action: 'Move between palette options.' },
      {
        key: 'Escape',
        action: 'Close the menu and return focus to the trigger.',
      },
    ],
    accessibility: [
      'Use readable option labels instead of relying on color swatches alone.',
      'Keep option values aligned with colorThemes; custom labels do not register new palettes.',
    ],
    themeBehavior: [
      'The control calls switchColorTheme and preserves the appearance preference.',
      'Register each palette key on the provider and define its light and dark CSS variables. Selecting a key alone does not create its colors.',
    ],
    agentNotes: [
      'Keep appearance and colorTheme separate. Never set light/dark mode to implement a palette change.',
      'Verify the selected palette changes computed semantic colors in both appearances, not only the selected label.',
    ],
  },
  'transition-settings': {
    whenToUse: [
      'Let people tune the effect and duration of theme changes.',
      'Build a theme playground or an appearance settings screen with app-owned animation preferences.',
    ],
    whenNotToUse: [
      'You only need one fixed effect. Configure the provider directly.',
      'You need to save preferences automatically. This control does not persist settings.',
    ],
    keyboard: [
      {
        key: 'Enter / Space, then Arrow keys',
        action: 'Open the effect selector and choose an effect.',
      },
      { key: 'ArrowRight / ArrowUp', action: 'Increase duration by 50 ms.' },
      { key: 'ArrowLeft / ArrowDown', action: 'Decrease duration by 50 ms.' },
      { key: 'Home / End', action: 'Set duration to 0 or 2000 ms.' },
    ],
    accessibility: [
      'Keep an accessible name on the effect selector and duration slider.',
      'The slider exposes its numeric value. The disabled prop disables both controls.',
    ],
    themeBehavior: [
      'The app owns animationType and duration and passes both to its provider. Updating the control alone does not start a transition.',
      'Duration ranges from 0 to 2000 ms in 50 ms steps. Reduced motion still bypasses movement, regardless of the chosen effect.',
    ],
    agentNotes: [
      'Wire React value/onValueChange or Vue v-model to the same settings passed into the provider.',
      'Use an appearance or palette action to exercise the chosen effect. Add persistence only when the application needs it.',
    ],
  },
};

export const primitiveCredits: Record<ComponentBase, ComponentCredit> = {
  'base-ui': {
    name: 'Base UI',
    url: 'https://base-ui.com',
    contribution: 'Accessible React control primitives.',
  },
  radix: {
    name: 'Radix UI',
    url: 'https://www.radix-ui.com/primitives',
    contribution: 'Accessible React control primitives.',
  },
  reka: {
    name: 'Reka UI',
    url: 'https://reka-ui.com',
    contribution: 'Accessible Vue control primitives.',
  },
};

export function componentApi(doc: ComponentDoc, base: ComponentBase) {
  const rows = [
    {
      name: base === 'reka' ? 'class' : 'className',
      type: 'string',
      description:
        'Extend the root styles. User classes take precedence through the local merge helper.',
    },
    {
      name: 'classes',
      type: 'object',
      description:
        doc.name === 'theme-toggle'
          ? 'Style the root and trigger parts.'
          : doc.name === 'transition-settings'
            ? 'Style the root, trigger, content, item, label, track, and thumb parts.'
            : 'Style the root, trigger, content, item, and label parts.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      description:
        'Disable interaction. Preference controls also wait for the provider to mount.',
    },
  ];

  if (doc.name === 'transition-settings') {
    rows.unshift(
      {
        name: base === 'reka' ? 'v-model' : 'value / onValueChange',
        type: '{ animationType, duration }',
        description:
          'App-owned settings. Pass the same state to the theme provider.',
      },
      {
        name: 'animationLabel / durationLabel',
        type: 'string',
        description: 'Override the accessible labels for the two controls.',
      }
    );
  } else
    rows.unshift({
      name: 'label',
      type: 'string',
      description: 'Override the control’s readable default label.',
    });

  if (doc.name === 'color-theme-selector')
    rows.push({
      name: 'options',
      type: '{ value, label }[]',
      description:
        'Override palette labels. Values must already exist in the provider’s colorThemes.',
    });

  return rows;
}

export function componentAgentNotes(doc: ComponentDoc, base: ComponentBase) {
  return [
    `Use uitheme-web/${base === 'reka' ? 'vue' : 'react'} for the runtime and import ${doc.exportName} from the installed local component file. Styled controls are not runtime exports.`,
    base === 'reka'
      ? 'Use createUITheme or UIThemeProvider for Vue. In Nuxt 4, use the uitheme-web/nuxt module and the documented provider setup.'
      : 'For Next.js, use NextUIThemeProvider from uitheme-web/next. For TanStack Start, follow the server bootstrap guide and keep server state per request.',
    'Select the framework, primitive base, Tailwind major, and language before installing. Run the CLI inside the selected app or pass --cwd.',
    'Preview changes with --dry-run. Preserve edited local files and review differences before --overwrite.',
    ...componentGuides[doc.name].agentNotes,
    'Verify keyboard use, persisted appearance and palette behavior, and reduced motion in the running app.',
  ];
}

export function componentGuidanceMarkdown(
  doc: ComponentDoc,
  base: ComponentBase
) {
  const guide = componentGuides[doc.name];
  const primitive = primitiveCredits[base];

  const list = (title: string, items: string[]) =>
    `## ${title}\n\n${items.map((item) => `- ${item}`).join('\n')}`;

  return {
    whenToUse: list('When to use', guide.whenToUse),
    whenNotToUse: list('When not to use', guide.whenNotToUse),
    apiReference: `## API reference\n\n| Prop | Type | Behavior |\n| --- | --- | --- |\n${componentApi(
      doc,
      base
    )
      .map((row) => `| ${row.name} | ${row.type} | ${row.description} |`)
      .join('\n')}`,
    keyboard: `## Keyboard\n\n${guide.keyboard.map((row) => `- ${row.key}: ${row.action}`).join('\n')}`,
    accessibility: list('Accessibility', guide.accessibility),
    themeBehavior: list('Theme behavior', guide.themeBehavior),
    agentNotes: list('AI Agent notes', componentAgentNotes(doc, base)),
    credits: [
      '## Credits',
      `Implementation: UI-Theme runtime and local controls, built with [${primitive.name}](${primitive.url}). ${primitive.contribution}`,
      ...(guide.inspiration?.map(
        (credit) =>
          `Component inspiration: [${credit.name}](${credit.url}) — ${credit.contribution}`
      ) ?? []),
    ].join('\n\n'),
  };
}
