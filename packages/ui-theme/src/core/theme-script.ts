/**
 * Pieces for the inline no-flash scripts. Each caller composes only the
 * statements its configuration needs, so the shipped text carries no unused
 * provider branches. The result is source text, not a serialized function,
 * because SSR builds may rewrite globals such as `document` inside functions.
 * Script locals: d root, l class list, g storage read, t theme, p palette,
 * q dark.
 */

/** Encode a value as a JavaScript literal that cannot close an HTML script. */
export const js = (value: string | readonly string[]) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

/** True when the theme is dark, resolving `system` through the media query. */
export const DARK =
  't=="dark"||t=="system"&&matchMedia("(prefers-color-scheme: dark)").matches';

/**
 * A stored value kept only when it is in the inlined allowed list. Without a
 * list any stored value is kept; without storage the fallback is used.
 */
const read = (
  storage: boolean,
  key: string,
  list: readonly string[] | null,
  fallback: string
) =>
  !storage
    ? js(fallback)
    : list
      ? `(v=g(${js(key)}),${js(list)}.includes(v)?v:${js(fallback)})`
      : `g(${js(key)})||${js(fallback)}`;

/** Declares d, l, t, p and q (q = `dark`), then runs `statements`. */
export const themeScript = (
  storage: boolean,
  [storageKey, themes, defaultTheme]: [string, readonly string[], string],
  [colorKey, colorThemes, defaultColor]: [
    string,
    readonly string[] | null,
    string,
  ],
  dark: string,
  statements: string
) =>
  `(function(){try{var d=document.documentElement,l=d.classList,${
    storage
      ? 'v,g=function(k){try{return localStorage.getItem(k)}catch(e){}},'
      : ''
  }t=${read(storage, storageKey, themes, defaultTheme)},p=${read(
    storage,
    colorKey,
    colorThemes,
    defaultColor
  )},q=${dark};${statements}}catch(e){console.warn(e)}})()`;
