import type { ComponentBase, ComponentDoc } from './component-docs';

export function componentApi(doc: ComponentDoc, base: ComponentBase) {
  const rows = [
    {
      name: 'borderStyle',
      type: "'solid' | 'shadow'",
      description:
        'Use the default solid border or prominent shadow borders. Both use the same space and theme tokens.',
    },
    {
      name: base === 'reka' ? 'class' : 'className',
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
        name: base === 'reka' ? 'update:open' : 'onOpenChange',
        type: base === 'reka' ? 'event' : '(open: boolean) => void',
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
