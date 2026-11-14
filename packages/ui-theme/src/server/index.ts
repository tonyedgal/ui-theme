import type { Theme, ThemeConfig } from '../core/types';
import { buildThemeScript } from '../core/theme-script';
import {
  STORAGE_KEY,
  COLOR_STORAGE_KEY,
  GLOBAL_CLASS_NAME,
  COLOR_THEME_PREFIX,
} from '../core/constants';

export type ThemeBootstrapOptions = Omit<
  ThemeConfig,
  'themes' | 'colorThemes'
> & {
  themes?: readonly Theme[];
  colorThemes?: readonly string[];
  storage?: unknown;
};

export function getThemeScript(options: ThemeBootstrapOptions = {}) {
  const themes = options.themes ?? ['light', 'dark', 'system'];
  const colorThemes = options.colorThemes ?? ['default'];
  const defaultTheme = options.defaultTheme ?? 'system';
  const defaultColorTheme = options.defaultColorTheme ?? colorThemes[0];
  const globalClassName = options.globalClassName ?? GLOBAL_CLASS_NAME;
  const colorThemePrefix = options.colorThemePrefix ?? COLOR_THEME_PREFIX;

  if (
    !themes.length ||
    !themes.every((value) => ['light', 'dark', 'system'].includes(value)) ||
    !themes.includes(defaultTheme)
  ) {
    throw new Error(
      'themes must include defaultTheme and contain light, dark, or system.'
    );
  }

  if (
    !defaultColorTheme ||
    !colorThemes.includes(defaultColorTheme) ||
    ![
      globalClassName,
      ...colorThemes.map((value) => `${colorThemePrefix}${value}`),
    ].every((value) => value.length > 0 && !/\s/.test(value))
  ) {
    throw new Error(
      'Color themes and class names must be valid CSS class tokens.'
    );
  }

  return buildThemeScript({
    themes,
    colorThemes,
    defaultTheme,
    defaultColorTheme,
    globalClassName,
    colorThemePrefix,
    storageKey: options.storageKey ?? STORAGE_KEY,
    colorStorageKey: options.colorStorageKey ?? COLOR_STORAGE_KEY,
    storage: options.storage === undefined,
    dataTheme: false,
    systemClasses: false,
    systemCss: false,
    palette: 'exclusive',
  });
}
