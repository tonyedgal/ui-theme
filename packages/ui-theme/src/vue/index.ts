export { createUITheme, useUITheme, useTheme } from './context';

export { UIThemeProvider } from './provider';

export { getThemeScript } from './bootstrap';

export {
  ThemeAnimationType,
  TRANSITION_DIRECTIONS,
  preloadThemeLogo,
} from 'uitheme-web/core';

export type {
  Theme,
  ThemeConfig,
  ColorTheme,
  SlideDirection,
  TransitionDirection,
  AnimationPosition,
  ThemeAnimationOptions,
  ThemeControlTransitionProps,
  ThemeLogoOptions,
} from '../core/types';

export type {
  UIThemeOptions,
  ThemeStorage,
  TransitionOptions,
  ReactiveTransitionOptions,
  ThemeTransitionInput,
  ThemeTrigger,
} from './types';
