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
  ColorTheme,
  SlideDirection,
  TransitionDirection,
  AnimationPosition,
  ThemeAnimationOptions,
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
