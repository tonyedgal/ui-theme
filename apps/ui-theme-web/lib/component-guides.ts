import {
  componentBase,
  type ComponentBase,
  type ComponentDoc,
} from './component-docs';

export function componentApi(doc: ComponentDoc, base: ComponentBase) {
  const vue = componentBase(base).framework === 'vue';

  const rows = [
    {
      name: 'borderStyle',
      type: "'solid' | 'shadow'",
      description:
        'Use the default solid border or prominent shadow borders. Both use the same space and theme tokens.',
    },
    {
      name: vue ? 'class' : 'className',
      type: 'string',
      description:
        'Extend the root styles. Your classes replace default classes through the local merge helper.',
    },
    {
      name: 'classes',
      type: 'object',
      description:
        doc.name === 'theme-switcher'
          ? 'Style root, item, and selection indicator parts.'
          : doc.name === 'tactile-theme-toggle'
            ? 'Style the root, track, and thumb parts.'
            : doc.name === 'theme-toggle' || doc.name === 'icon-theme-toggle'
              ? 'Style the root and trigger parts.'
              : 'Style root, trigger, content, item, and label parts.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      description:
        'Disable interaction. Preference controls also wait for the provider to mount.',
    },
  ];

  rows.unshift({
    name: 'label',
    type: 'string',
    description: 'Override the readable accessible label.',
  });
  rows.push(
    {
      name: 'animationType',
      type: 'ThemeAnimationType',
      description:
        'Override the UI theme transition for this control. Defaults to the provider setting.',
    },
    {
      name: 'duration',
      type: 'number',
      description:
        'UI theme transition duration in milliseconds. Defaults to the provider setting.',
    },
    {
      name: 'slideDirection',
      type: 'SlideDirection',
      description:
        'Valid only with animationType set to ThemeAnimationType.SLIDE. Other animation types do not accept this prop.',
    }
  );

  if (doc.name === 'icon-theme-toggle')
    rows.push({
      name: 'effect',
      type: "'rotate' | 'slide' | 'blur'",
      description:
        'Icon motion only. Defaults to rotate and is separate from the page transition.',
    });

  if (
    doc.name === 'theme-toggle' ||
    doc.name === 'theme-selector' ||
    doc.name === 'theme-disclosure'
  )
    rows.push({
      name: 'display',
      type: "'text' | 'icon-text'",
      description:
        'Use text by default, or an icon with text. For an icon-only action, use Icon Theme Toggle. Light uses a sun, dark uses a moon, and system uses a monitor.',
    });

  if (doc.name.startsWith('color-theme-'))
    rows.push({
      name: 'options',
      type: '{ value, label }[]',
      description:
        'Change palette labels. Values must already exist in the provider’s colorThemes.',
    });

  if (doc.name === 'tactile-theme-toggle')
    rows.splice(
      rows.findIndex((row) => row.name === 'borderStyle'),
      1
    );

  if (doc.category === 'disclosures') {
    rows.splice(
      rows.findIndex((row) => row.name === 'borderStyle'),
      1
    );
    rows.push(
      {
        name: 'open',
        type: 'boolean',
        description: 'Control whether the inline panel is expanded.',
      },
      {
        name: 'defaultOpen',
        type: 'boolean',
        description: 'Start with the panel expanded. Defaults to false.',
      },
      {
        name: vue ? 'update:open' : 'onOpenChange',
        type: vue ? 'event' : '(open: boolean) => void',
        description:
          'Receive the next expanded state when the trigger is pressed.',
      },
      {
        name: 'direction',
        type: "'down' | 'up'",
        description:
          'Place choices below or above the trigger. Defaults to down. Use a bottom-anchored layout to keep an upward trigger in place.',
      },
      {
        name: 'maxHeight',
        type: 'number',
        description:
          'Limit the scroll area in pixels. Defaults to 240 and never exceeds 60% of the viewport height.',
      }
    );
  }

  return rows;
}

const uiSdkPrimitives = {
  'theme-toggle': [{ name: 'Toggle', entry: 'toggle' }],
  'icon-theme-toggle': [{ name: 'Toggle', entry: 'toggle' }],
  'tactile-theme-toggle': [{ name: 'Switch', entry: 'switch' }],
  'theme-switcher': [{ name: 'SegmentedControl', entry: 'segmented-control' }],
  'theme-selector': [{ name: 'Select', entry: 'select' }],
  'color-theme-selector': [{ name: 'Select', entry: 'select' }],
  'theme-disclosure': [
    { name: 'Collapsible', entry: 'collapsible' },
    { name: 'RadioGroup', entry: 'radio' },
  ],
  'color-theme-disclosure': [
    { name: 'Collapsible', entry: 'collapsible' },
    { name: 'RadioGroup', entry: 'radio' },
  ],
} satisfies Record<string, { name: string; entry: string }[]>;

// Facts that only some bases have. Each line may use `code` spans.
export function componentBaseFacts(doc: ComponentDoc, base: ComponentBase) {
  const entry = componentBase(base);
  const installation: string[] = [];
  const accessibility: string[] = [];

  if (entry.base !== 'ui-sdk') return { installation, accessibility };

  const scope = `@ui-sdk/${entry.framework}`;

  const primitives =
    new Map<string, { name: string; entry: string }[]>(
      Object.entries(uiSdkPrimitives)
    ).get(doc.name) ?? [];

  if (doc.name !== 'icon-theme-toggle')
    installation.push(
      `This control uses the UI SDK ${primitives.map((item) => `\`${item.name}\` from \`${scope}/${item.entry}\``).join(' and ')}.`
    );
  else
    installation.push(
      'This control wraps Theme Toggle, which uses `Toggle` from UI SDK.'
    );

  if (entry.requires)
    installation.push(
      `UI SDK needs \`${entry.requires.package} ${entry.requires.range}\`${entry.requires.package === 'react' ? ' and `@types/react >=19.2.10`' : ''}. The CLI stops before it writes a file when the app has an older \`${entry.requires.package}\`.`
    );

  if (entry.cssLayer)
    installation.push(
      `UI SDK adds styles to the \`${entry.cssLayer}\` cascade layer. Declare \`@layer ${entry.cssLayer};\` at the top of your global stylesheet, before other layers. The CLI adds this line for you.`
    );

  if (doc.name === 'tactile-theme-toggle')
    accessibility.push(
      'Enter and Space both toggle the switch. The control handles Enter itself, because the UI SDK `Switch` responds to Space only.'
    );

  if (doc.category === 'disclosures')
    accessibility.push(
      'The choices form a `radiogroup` named by the visible label. Each choice is a button with the `radio` role, not a native radio input.'
    );

  return { installation, accessibility };
}
