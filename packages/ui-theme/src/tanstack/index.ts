import { resolveThemeForServer } from '../core/animations';
import type { Theme } from '../core/types';

// Re-export helpers for use inside user-defined createServerFn handlers.
// IMPORTANT: createServerFn() calls must live in application source code,
// not inside a pre-built library, because TanStack Start's Vite plugin
// needs to transform them at build time.

export { STORAGE_KEY, COLOR_STORAGE_KEY } from '../core/constants';
export { resolveThemeForServer } from '../core/animations';
export type { Theme, ColorTheme } from '../core/types';

/** Resolved theme class to apply on <html> */
export type ServerResolvedTheme = 'light' | 'dark' | 'system';

/** Return type from a theme getter server function */
export interface ServerThemeData {
  /** The resolved theme class to use on <html> */
  theme: ServerResolvedTheme;
  /** The stored theme preference (light/dark/system) */
  themePreference: Theme;
  /** The color theme to apply */
  colorTheme: string;
}

/**
 * Builds ServerThemeData from raw cookie values.
 * Call this inside your own `createServerFn().handler()` with cookie values
 * from `getCookie()`.
 *
 * @example
 * ```ts
 * import { createServerFn } from '@tanstack/react-start';
 * import { getCookie, setCookie } from '@tanstack/react-start/server';
 * import { buildServerThemeData, STORAGE_KEY, COLOR_STORAGE_KEY } from '@ui-theme/web/tanstack';
 *
 * export const getThemeServerFn = createServerFn().handler(() =>
 *   buildServerThemeData(getCookie(STORAGE_KEY), getCookie(COLOR_STORAGE_KEY))
 * );
 * ```
 */
export function buildServerThemeData(
  themeCookie: string | undefined,
  colorThemeCookie: string | undefined,
  options: { defaultTheme?: Theme; defaultColorTheme?: string } = {}
): ServerThemeData {
  const { defaultTheme = 'system', defaultColorTheme = 'default' } = options;
  const themePreference = (themeCookie as Theme) ?? defaultTheme;
  const colorTheme = colorThemeCookie ?? defaultColorTheme;
  return {
    theme: resolveThemeForServer(themePreference) as ServerResolvedTheme,
    themePreference,
    colorTheme,
  };
}
