import type { Theme, ThemeConfig } from './types';
import {
  COLOR_STORAGE_KEY,
  COLOR_THEME_PREFIX,
  GLOBAL_CLASS_NAME,
  STORAGE_KEY,
} from './constants';

export function validateThemeValue(theme: Theme) {
  if (!['light', 'dark', 'system'].includes(theme))
    throw new Error('Theme must be light, dark, or system.');
}

export function validateColorThemeValue(theme: string, prefix: string) {
  const token = `${prefix}${theme}`;

  if (!token.length || /\s/.test(token))
    throw new Error('Theme classes must be nonempty CSS class tokens.');
}

export function resolveThemeConfig(options: ThemeConfig = {}) {
  const themes: readonly Theme[] = options.themes ?? [
    'light',
    'dark',
    'system',
  ];

  const colorThemes = options.colorThemes ?? ['default'];
  const defaultTheme = options.defaultTheme ?? 'system';
  const defaultColorTheme = options.defaultColorTheme ?? colorThemes[0];
  const globalClassName = options.globalClassName ?? GLOBAL_CLASS_NAME;
  const colorThemePrefix = options.colorThemePrefix ?? COLOR_THEME_PREFIX;

  if (
    !themes.length ||
    !themes.every((theme) => ['light', 'dark', 'system'].includes(theme)) ||
    !themes.includes(defaultTheme)
  ) {
    throw new Error(
      'themes must include the defaultTheme and contain light, dark, or system.'
    );
  }

  if (
    defaultColorTheme === undefined ||
    !colorThemes.includes(defaultColorTheme)
  ) {
    throw new Error('colorThemes must include the defaultColorTheme.');
  }

  if (
    ![
      globalClassName,
      ...colorThemes.map((theme) => `${colorThemePrefix}${theme}`),
    ].every((token) => token.length > 0 && !/\s/.test(token))
  ) {
    throw new Error('Theme classes must be nonempty CSS class tokens.');
  }

  return {
    themes: Object.freeze([...themes]),
    colorThemes: Object.freeze([...colorThemes]),
    defaultTheme,
    defaultColorTheme,
    globalClassName,
    colorThemePrefix,
    storageKey: options.storageKey ?? STORAGE_KEY,
    colorStorageKey: options.colorStorageKey ?? COLOR_STORAGE_KEY,
  };
}
