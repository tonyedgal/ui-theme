export { createUITheme, useUITheme, useTheme } from './context';

export { default as UIThemeProvider } from './components/UIThemeProvider.vue';

export { default as UIThemeSwitcher } from './components/UIThemeSwitcher.vue';

export { default as UIThemeSelector } from './components/UIThemeSelector.vue';

export { getThemeScript } from './bootstrap';

export {
  ThemeAnimationType,
  TRANSITION_DIRECTIONS,
  preloadThemeLogo,
} from './core';

export type {
  Theme,
  ColorTheme,
  SlideDirection,
  TransitionDirection,
  AnimationPosition,
  ThemeAnimationOptions,
  ThemeLogoOptions,
} from './core';

export type {
  UIThemeOptions,
  ThemeStorage,
  TransitionOptions,
  ReactiveTransitionOptions,
  ThemeTransitionInput,
  ThemeTrigger,
} from './types';
