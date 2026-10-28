import type { Theme, ThemeConfig } from '../core/types';
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

  const config = JSON.stringify({
    themes,
    colorThemes,
    defaultTheme,
    defaultColorTheme,
    globalClassName,
    colorThemePrefix,
    storageKey: options.storageKey ?? STORAGE_KEY,
    colorStorageKey: options.colorStorageKey ?? COLOR_STORAGE_KEY,
    browserStorage: options.storage === undefined,
  })
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

  return `(() => {
    const config = ${config};
    const root = document.documentElement;
    let theme = config.defaultTheme;
    let palette = config.defaultColorTheme;
    if (config.browserStorage) {
      try { const value = localStorage.getItem(config.storageKey); if (config.themes.includes(value)) theme = value; } catch {}
      try { const value = localStorage.getItem(config.colorStorageKey); if (config.colorThemes.includes(value)) palette = value; } catch {}
    }
    const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle(config.globalClassName, dark);
    root.style.colorScheme = dark ? 'dark' : 'light';
    for (const value of config.colorThemes) root.classList.toggle(config.colorThemePrefix + value, value === palette);
  })();`;
}
