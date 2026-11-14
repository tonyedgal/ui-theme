/** Configuration for the inline script that applies a stored theme before hydration. */
export interface ThemeScriptConfig {
  storageKey: string;
  colorStorageKey: string;
  /** Allowed stored themes; anything else falls back to `defaultTheme`. */
  themes: readonly string[];
  /** Allowed stored palettes; `null` accepts any single class token. */
  colorThemes: readonly string[] | null;
  defaultTheme: string;
  defaultColorTheme: string;
  globalClassName: string;
  colorThemePrefix: string;
  /** Read localStorage; false applies the defaults only. */
  storage: boolean;
  /** Write `data-theme` instead of the dark class (Next.js `attribute`). */
  dataTheme: boolean;
  /** Remove `auto`/`system` classes; with `systemCss`, mark system with a class. */
  systemClasses: boolean;
  /** Leave a system theme to CSS media queries (TanStack `systemThemeMode: 'css'`). */
  systemCss: boolean;
  /**
   * `add`: add the selected palette class (Next.js).
   * `custom`: add it unless it is `default` (TanStack Start).
   * `exclusive`: toggle every configured palette class (server bootstrap).
   */
  palette: 'add' | 'custom' | 'exclusive';
}

const PALETTE_MODES = { add: 0, custom: 1, exclusive: 2 } as const;

/**
 * Runs inline in the page, so it must not reference anything outside its body.
 * It is serialized with Function.prototype.toString and takes positional
 * arguments to keep the inline script small.
 */
const applyStoredTheme = (
  storageKey: string,
  colorStorageKey: string,
  themes: readonly string[],
  colorThemes: readonly string[] | null,
  defaultTheme: string,
  defaultColorTheme: string,
  globalClassName: string,
  colorThemePrefix: string,
  storage: 0 | 1,
  dataTheme: 0 | 1,
  systemClasses: 0 | 1,
  systemCss: 0 | 1,
  palette: 0 | 1 | 2
) => {
  try {
    const read = (
      key: string,
      values: readonly string[] | null,
      fallback: string
    ) => {
      try {
        const value = storage && localStorage.getItem(key);

        return value && (values ? values.includes(value) : !/\s/.test(value))
          ? value
          : fallback;
      } catch {
        return fallback;
      }
    };

    const root = document.documentElement;
    const classes = root.classList;
    const theme = read(storageKey, themes, defaultTheme);
    const selected = read(colorStorageKey, colorThemes, defaultColorTheme);
    const css = theme === 'system' && systemCss;

    const dark =
      theme === 'dark' ||
      (theme === 'system' &&
        !css &&
        matchMedia('(prefers-color-scheme: dark)').matches);

    if (dataTheme) root.setAttribute('data-theme', dark ? 'dark' : 'light');
    else classes.toggle(globalClassName, dark);

    if (systemClasses) classes.remove('auto', 'system');

    if (css) classes.add('system');
    root.style.colorScheme = css ? '' : dark ? 'dark' : 'light';

    if (palette === 2)
      for (const value of colorThemes ?? [])
        classes.toggle(colorThemePrefix + value, value === selected);
    else if (!palette || selected !== 'default')
      classes.add(colorThemePrefix + selected);
  } catch (error) {
    console.warn('Theme pre-hydration script failed:', error);
  }
};

/** Encode JSON for an inline script without allowing an HTML closing tag. */
const serialize = (value: Parameters<typeof applyStoredTheme>) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

/** Builds the one inline no-flash script shared by every provider. */
export const buildThemeScript = (c: ThemeScriptConfig): string => {
  const args: Parameters<typeof applyStoredTheme> = [
    c.storageKey,
    c.colorStorageKey,
    c.themes,
    c.colorThemes,
    c.defaultTheme,
    c.defaultColorTheme,
    c.globalClassName,
    c.colorThemePrefix,
    c.storage ? 1 : 0,
    c.dataTheme ? 1 : 0,
    c.systemClasses ? 1 : 0,
    c.systemCss ? 1 : 0,
    PALETTE_MODES[c.palette],
  ];

  return `(${applyStoredTheme.toString()})(${serialize(args).slice(1, -1)})`;
};
