import type { ResolvedConfig } from './config';
import type { ThemeStorage } from './types';
import type { Theme } from './core';

export function browserStorage(): ThemeStorage {
  return {
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
  };
}

export function readValue(
  storage: ThemeStorage | false,
  key: string
): string | null {
  try {
    return storage ? storage.getItem(key) : null;
  } catch {
    return null;
  }
}

export function writeValue(
  storage: ThemeStorage | false,
  key: string,
  value: string
) {
  try {
    if (storage) storage.setItem(key, value);
  } catch {
    /* storage can be denied by browser policy */
  }
}

export function applyTheme(
  config: ResolvedConfig,
  theme: Theme,
  palette: string,
  systemDark: boolean
) {
  const root = document.documentElement;
  const dark = theme === 'dark' || (theme === 'system' && systemDark);
  root.classList.toggle(config.globalClassName, dark);
  root.style.colorScheme = dark ? 'dark' : 'light';

  for (const value of config.colorThemes)
    root.classList.toggle(
      `${config.colorThemePrefix}${value}`,
      value === palette
    );
}
