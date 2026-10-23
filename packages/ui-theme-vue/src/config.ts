import type { UIThemeOptions } from './types';
import {
  COLOR_STORAGE_KEY,
  COLOR_THEME_PREFIX,
  GLOBAL_CLASS_NAME,
  STORAGE_KEY,
} from './core';

export function normalizeConfig(options: UIThemeOptions = {}) {
  const themes = options.themes ?? (['light', 'dark', 'system'] as const);
  const colorThemes = options.colorThemes ?? ['default'];
  const defaultTheme = options.defaultTheme ?? 'system';

  const defaultColorTheme =
    options.defaultColorTheme ?? colorThemes[0] ?? 'default';

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

  if (!colorThemes.length || !colorThemes.includes(defaultColorTheme)) {
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
    themes: [...themes],
    colorThemes: [...colorThemes],
    defaultTheme,
    defaultColorTheme,
    globalClassName,
    colorThemePrefix,
    storageKey: options.storageKey ?? STORAGE_KEY,
    colorStorageKey: options.colorStorageKey ?? COLOR_STORAGE_KEY,
  };
}

export type ResolvedConfig = ReturnType<typeof normalizeConfig>;
