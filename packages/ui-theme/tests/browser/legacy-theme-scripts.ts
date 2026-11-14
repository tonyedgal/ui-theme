// Reference copies of the no-flash scripts before the shared builder, from
// origin/main (5fee436). Tests compare the builder's DOM output against them.
// Do not change them: they define the DOM that valid stored values must keep.
import type { Theme, ColorTheme, SystemThemeMode } from '../../src/react';
import type { ThemeBootstrapOptions } from '../../src/server';
import {
  STORAGE_KEY,
  COLOR_STORAGE_KEY,
  GLOBAL_CLASS_NAME,
  COLOR_THEME_PREFIX,
} from '../../src/core/constants';

/** Encode a JavaScript literal without allowing an HTML script closing tag. */
function serializeScriptValue(value: string | boolean): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export const legacyNextScript = (
  storageKey: string,
  colorStorageKey: string,
  defaultTheme: Theme,
  defaultColorTheme: ColorTheme,
  attribute: 'class' | 'data-theme',
  globalClassName: string,
  colorThemePrefix: string
): string => {
  return `
(function() {
  try {
    var theme = localStorage.getItem(${serializeScriptValue(storageKey)}) || ${serializeScriptValue(defaultTheme)};
    var colorTheme = localStorage.getItem(${serializeScriptValue(colorStorageKey)}) || ${serializeScriptValue(defaultColorTheme)};
    var resolved = theme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    
    if (${serializeScriptValue(attribute)} === 'class') {
      if (resolved === 'dark') {
        document.documentElement.classList.add(${serializeScriptValue(globalClassName)});
      } else {
        document.documentElement.classList.remove(${serializeScriptValue(globalClassName)});
      }
    } else {
      document.documentElement.setAttribute('data-theme', resolved);
    }
    
    document.documentElement.style.colorScheme = resolved;
    document.documentElement.classList.add(${serializeScriptValue(colorThemePrefix)} + colorTheme);
  } catch (e) {
    console.warn('Theme pre-hydration script failed:', e);
  }
})();
`;
};

export const legacyTanStackScript = (
  storageKey: string,
  colorStorageKey: string,
  defaultTheme: Theme,
  defaultColorTheme: ColorTheme,
  globalClassName: string,
  colorThemePrefix: string,
  systemThemeMode: SystemThemeMode
): string => {
  return `
(function() {
  try {
    var theme = localStorage.getItem(${serializeScriptValue(storageKey)}) || ${serializeScriptValue(defaultTheme)};
    var colorTheme = localStorage.getItem(${serializeScriptValue(colorStorageKey)}) || ${serializeScriptValue(defaultColorTheme)};
    var el = document.documentElement;
    var resolved;
    if (theme === 'system') {
      if (${serializeScriptValue(systemThemeMode)} === 'css') {
        el.classList.remove(${serializeScriptValue(globalClassName)});
        el.classList.remove('auto');
        el.classList.remove('system');
        el.classList.add('system');
        el.style.colorScheme = '';
      } else {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        if (resolved === 'dark') {
          el.classList.add(${serializeScriptValue(globalClassName)});
        } else {
          el.classList.remove(${serializeScriptValue(globalClassName)});
        }
        el.classList.remove('system');
        el.classList.remove('auto');
        el.style.colorScheme = resolved;
      }
    } else {
      resolved = theme;
      el.classList.remove('system');
      el.classList.remove('auto');
      if (resolved === 'dark') {
        el.classList.add(${serializeScriptValue(globalClassName)});
      } else {
        el.classList.remove(${serializeScriptValue(globalClassName)});
      }
      el.style.colorScheme = resolved;
    }
    if (colorTheme && colorTheme !== 'default') {
      el.classList.add(${serializeScriptValue(colorThemePrefix)} + colorTheme);
    }
  } catch (e) {
    console.warn('Theme pre-hydration script failed:', e);
  }
})();
`;
};

export function legacyServerScript(options: ThemeBootstrapOptions = {}) {
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
