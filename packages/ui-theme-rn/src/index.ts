export {
  UIThemeProvider,
  useUITheme,
  useThemeColors,
  useReducedMotion,
  UIThemeColorsProvider,
} from './provider';

export type { UIThemeProviderProps } from './provider';

export { defaultPalettes, themeTokens } from './palettes';

export { toThemeVariables, themeVariableNames } from './css-variables';

export type {
  ThemeColors,
  ThemePalette,
  CSSThemePalette,
  ThemePaletteDefinition,
} from './palettes';

export type {
  Theme,
  ResolvedTheme,
  ThemeStorage,
  ThemeSnapshot,
} from './core/types';
