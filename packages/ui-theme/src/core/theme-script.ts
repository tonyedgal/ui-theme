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
 * The inline runtime, kept as source text: serializing a compiled function
 * breaks when a consumer's SSR build rewrites globals such as `document`.
 * Arguments: storage key, color storage key, themes, color themes (or null),
 * default theme, default color theme, dark class, palette prefix, then the
 * 0/1 flags storage, dataTheme, systemClasses, systemCss and the palette mode
 * (0 add, 1 add unless `default`, 2 toggle every configured palette).
 */
// prettier-ignore
const RUNTIME = `(function(k,K,t,c,d,D,g,p,s,a,x,y,m){try{var r=function(n,v,f){try{var o=s&&localStorage.getItem(n);return o&&(v?v.indexOf(o)>-1:!/\\s/.test(o))?o:f}catch(e){return f}},h=document.documentElement,l=h.classList,T=r(k,t,d),P=r(K,c,D),z=T=="system"&&y,q=T=="dark"||T=="system"&&!z&&matchMedia("(prefers-color-scheme: dark)").matches;a?h.setAttribute("data-theme",q?"dark":"light"):l.toggle(g,q);x&&l.remove("auto","system");z&&l.add("system");h.style.colorScheme=z?"":q?"dark":"light";m>1?(c||[]).forEach(function(v){l.toggle(p+v,v==P)}):(m&&P=="default")||l.add(p+P)}catch(e){console.warn(e)}})`;

type RuntimeArgs = [
  string,
  string,
  readonly string[],
  readonly string[] | null,
  string,
  string,
  string,
  string,
  0 | 1,
  0 | 1,
  0 | 1,
  0 | 1,
  0 | 1 | 2,
];

/** Encode JSON for an inline script without allowing an HTML closing tag. */
const serialize = (value: RuntimeArgs) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

/** Builds the one inline no-flash script shared by every provider. */
export const buildThemeScript = (c: ThemeScriptConfig): string => {
  const args: RuntimeArgs = [
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

  return `${RUNTIME}(${serialize(args).slice(1, -1)})`;
};
