import type { BundledTheme, ThemeRegistration } from 'shiki';

export const codeLightTheme: ThemeRegistration = {
  name: 'docs-light',
  type: 'light',
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#8388AD',
  },
  tokenColors: [
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: {
        foreground: '#8388AD',
        fontStyle: 'italic',
      },
    },
    {
      scope: [
        'string',
        'string.quoted',
        'string.quoted.single',
        'string.quoted.double',
        'string.template',
      ],
      settings: {
        foreground: '#10a380',
      },
    },
    {
      scope: ['constant.numeric', 'constant.language', 'constant.other'],
      settings: {
        foreground: '#de8601',
      },
    },
    {
      scope: [
        'keyword',
        'keyword.control',
        'keyword.control.import',
        'keyword.control.export',
        'keyword.control.from',
        'keyword.control.default',
        'storage.type',
        'storage.modifier',
      ],
      settings: {
        foreground: '#1585b3',
      },
    },
    {
      scope: ['keyword.operator', 'keyword.operator.assignment'],
      settings: {
        foreground: '#1585b3',
      },
    },
    {
      scope: ['entity.name.tag', 'support.class.component'],
      settings: {
        foreground: '#6366b3',
      },
    },
    {
      scope: ['entity.other.attribute-name'],
      settings: {
        foreground: '#b81ae6',
      },
    },
    {
      scope: ['entity.name.function', 'support.function', 'meta.function-call'],
      settings: {
        foreground: '#de8601',
      },
    },
    {
      scope: [
        'variable',
        'variable.other',
        'variable.other.readwrite',
        'variable.other.object',
        'variable.parameter',
        'meta.import variable.other.readwrite',
      ],
      settings: {
        foreground: '#8388AD',
      },
    },
    {
      scope: [
        'punctuation',
        'punctuation.definition.block',
        'punctuation.separator',
        'punctuation.terminator',
        'meta.brace',
        'meta.bracket',
      ],
      settings: {
        foreground: '#6366b3',
      },
    },
    {
      scope: ['support.type', 'support.class', 'entity.name.type'],
      settings: {
        foreground: '#6366b3',
      },
    },
    {
      scope: ['meta.property-name', 'support.type.property-name'],
      settings: {
        foreground: '#6366b3',
      },
    },
    {
      scope: ['meta.property-value', 'support.constant.property-value'],
      settings: {
        foreground: '#10a380',
      },
    },
    {
      scope: ['meta.import', 'meta.export'],
      settings: {
        foreground: '#8388AD',
      },
    },
  ],
};

export const codeDarkTheme: ThemeRegistration = {
  name: 'docs-dark',
  type: 'dark',
  colors: {
    'editor.background': '#0F1014',
    'editor.foreground': '#9898A2',
  },
  tokenColors: [
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: {
        foreground: '#686974',
        fontStyle: 'italic',
      },
    },
    {
      scope: [
        'string',
        'string.quoted',
        'string.quoted.single',
        'string.quoted.double',
        'string.template',
      ],
      settings: {
        foreground: '#23ebc0',
      },
    },
    {
      scope: ['constant.numeric', 'constant.language', 'constant.other'],
      settings: {
        foreground: '#FFD493',
      },
    },
    {
      scope: [
        'keyword',
        'keyword.control',
        'keyword.control.import',
        'keyword.control.export',
        'keyword.control.from',
        'keyword.control.default',
        'storage.type',
        'storage.modifier',
      ],
      settings: {
        foreground: '#5cc9f5',
      },
    },
    {
      scope: ['keyword.operator', 'keyword.operator.assignment'],
      settings: {
        foreground: '#5cc9f5',
      },
    },
    {
      scope: ['entity.name.tag', 'support.class.component'],
      settings: {
        foreground: '#ACAFFF',
      },
    },
    {
      scope: ['entity.other.attribute-name'],
      settings: {
        foreground: '#da68fb',
      },
    },
    {
      scope: ['entity.name.function', 'support.function', 'meta.function-call'],
      settings: {
        foreground: '#FFD493',
      },
    },
    {
      scope: [
        'variable',
        'variable.other',
        'variable.other.readwrite',
        'variable.other.object',
        'variable.parameter',
        'meta.import variable.other.readwrite',
      ],
      settings: {
        foreground: '#9898A2',
      },
    },
    {
      scope: [
        'punctuation',
        'punctuation.definition.block',
        'punctuation.separator',
        'punctuation.terminator',
        'meta.brace',
        'meta.bracket',
      ],
      settings: {
        foreground: '#ACAFFF',
      },
    },
    {
      scope: ['support.type', 'support.class', 'entity.name.type'],
      settings: {
        foreground: '#ACAFFF',
      },
    },
    {
      scope: ['meta.property-name', 'support.type.property-name'],
      settings: {
        foreground: '#ACAFFF',
      },
    },
    {
      scope: ['meta.property-value', 'support.constant.property-value'],
      settings: {
        foreground: '#23ebc0',
      },
    },
    {
      scope: ['meta.import', 'meta.export'],
      settings: {
        foreground: '#9898A2',
      },
    },
  ],
};

export const codeThemes = {
  light: 'min-light',
  dark: 'min-dark',
  'custom-light': codeLightTheme,
  'custom-dark': codeDarkTheme,
  'caffeine-light': 'gruvbox-light-medium',
  'caffeine-dark': 'gruvbox-dark-medium',
  'mono-light': 'github-light',
  'mono-dark': 'github-dark-default',
} satisfies Record<string, BundledTheme | ThemeRegistration>;
