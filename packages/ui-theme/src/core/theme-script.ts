/** Configuration for the inline script that applies a stored theme before hydration. */
export interface ThemeScriptConfig {
  storageKey: string;
  colorStorageKey: string;
  /** Allowed stored themes; anything else falls back to `defaultTheme`. */
  themes: readonly string[];
  /** Allowed stored palettes; `null` accepts any stored value, as before. */
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

/** Encode a value as a JavaScript literal that cannot close an HTML script. */
const js = (value: string | readonly string[]) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

/**
 * Builds the inline no-flash script from only the statements this
 * configuration needs. The result is source text, not a serialized function,
 * because SSR builds may rewrite globals such as `document` inside functions.
 * Locals: d root, l class list, g storage read, t theme, p palette, q dark.
 */
export const buildThemeScript = (c: ThemeScriptConfig): string => {
  // A stored value is kept only when it is in the inlined allowed list.
  const read = (
    key: string,
    list: readonly string[] | null,
    fallback: string
  ) =>
    !c.storage
      ? js(fallback)
      : list
        ? `(v=g(${js(key)}),${js(list)}.includes(v)?v:${js(fallback)})`
        : `g(${js(key)})||${js(fallback)}`;

  const css = c.systemClasses && c.systemCss;
  const system = c.themes.includes('system');

  const dark = css
    ? 't=="dark"'
    : system
      ? 't=="dark"||t=="system"&&matchMedia("(prefers-color-scheme: dark)").matches'
      : 't=="dark"';

  const statements = [
    `var ${[
      'd=document.documentElement',
      'l=d.classList',
      c.storage &&
        'v,g=function(k){try{return localStorage.getItem(k)}catch(e){}}',
      `t=${read(c.storageKey, c.themes, c.defaultTheme)}`,
      `p=${read(c.colorStorageKey, c.colorThemes, c.defaultColorTheme)}`,
      `q=${dark}`,
    ]
      .filter(Boolean)
      .join(',')}`,
    c.dataTheme
      ? 'd.setAttribute("data-theme",q?"dark":"light")'
      : `l.toggle(${js(c.globalClassName)},q)`,
    c.systemClasses && 'l.remove("auto","system")',
    css && 't=="system"&&l.add("system")',
    css
      ? 'd.style.colorScheme=t=="system"?"":q?"dark":"light"'
      : 'd.style.colorScheme=q?"dark":"light"',
    c.palette === 'exclusive'
      ? `${js(c.colorThemes ?? [])}.forEach(function(v){l.toggle(${js(c.colorThemePrefix)}+v,v==p)})`
      : `${c.palette === 'custom' ? 'p!="default"&&' : ''}l.add(${js(c.colorThemePrefix)}+p)`,
  ];

  return `(function(){try{${statements.filter(Boolean).join(';')}}catch(e){console.warn(e)}})()`;
};
