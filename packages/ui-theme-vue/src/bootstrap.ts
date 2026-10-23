import { normalizeConfig } from './config';
import type { UIThemeOptions } from './types';

export function getThemeScript(options: UIThemeOptions = {}) {
  const config = JSON.stringify(normalizeConfig(options))
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

  // keep browser code as text so server bundlers cannot replace its globals.
  return `(() => {
    const config = ${config};
    const root = document.documentElement;
    let theme = config.defaultTheme;
    let palette = config.defaultColorTheme;
    if (${options.storage === undefined}) {
      try {
        const value = localStorage.getItem(config.storageKey);
        if (config.themes.includes(value)) theme = value;
      } catch {}
      try {
        const value = localStorage.getItem(config.colorStorageKey);
        if (config.colorThemes.includes(value)) palette = value;
      } catch {}
    }
    const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle(config.globalClassName, dark);
    root.style.colorScheme = dark ? 'dark' : 'light';
    for (const value of config.colorThemes) root.classList.toggle(config.colorThemePrefix + value, value === palette);
  })();`;
}
