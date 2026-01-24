// Re-export core types and utilities for convenience
export {
  ThemeAnimationType,
  type Theme,
  type ColorTheme,
  type SlideDirection,
  type AnimationConfig,
  type ThemeConfig,
  type ThemeState,
} from '../core/types';

export {
  injectBaseStyles,
  getSystemTheme,
  resolveTheme,
  supportsViewTransitions,
  prefersReducedMotion,
} from '../core/animations';

export {
  STORAGE_KEY,
  COLOR_STORAGE_KEY,
  GLOBAL_CLASS_NAME,
  COLOR_THEME_PREFIX,
  DEFAULT_DURATION,
  DEFAULT_EASING,
  DEFAULT_BLUR_AMOUNT,
  DEFAULT_STYLE_ID,
} from '../core/constants';

// React hook
export { useTheme } from './hooks/use-theme';

// React providers - Next.js
export {
  NextUIThemeProvider,
  useNextUITheme,
  type NextUIThemeProviderProps,
  type NextUIThemeContextType,
} from './components/NextUIThemeProvider';

// React providers - TanStack Start
export {
  TanStackUIThemeProvider,
  useTanStackUITheme,
  type TanStackUIThemeProviderProps,
  type TanStackUIThemeContextType,
} from './components/TanStackUIThemeProvider';

// React providers - Vite
export {
  ViteUIThemeProvider,
  useViteUITheme,
  type ViteUIThemeProviderProps,
  type ViteUIThemeContextType,
} from './components/ViteUIThemeProvider';

// Backward compatibility - alias UIThemeProvider to NextUIThemeProvider
export {
  UIThemeProvider,
  useUITheme,
  type UIThemeProviderProps,
  type UIThemeContextType,
} from './components/UIThemeProvider';

// React components
export { UIThemeSwitcher } from './components/UIThemeSwitcher';
export { UIThemeSelector } from './components/UIThemeSelector';

// UI Components
export {
  UISelect,
  UISelectContent,
  UISelectGroup,
  UISelectItem,
  UISelectLabel,
  UISelectScrollDownButton,
  UISelectScrollUpButton,
  UISelectSeparator,
  UISelectTrigger,
  UISelectValue,
} from './components/ui/UISelect';

// Types
export type {
  UseThemeProps,
  UseThemeReturn,
  UIThemeSwitcherProps,
  UIThemeSelectorProps,
} from './types';
