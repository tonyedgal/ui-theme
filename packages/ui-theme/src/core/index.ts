export {
  ThemeAnimationType,
  type Theme,
  type ColorTheme,
  type SlideDirection,
  type AnimationConfig,
  type ThemeConfig,
  type ThemeState,
} from './types';

export {
  injectBaseStyles,
  getSystemTheme,
  resolveTheme,
  supportsViewTransitions,
  prefersReducedMotion,
  createCircleAnimation,
  createBlurCircleAnimation,
  createSlideAnimation,
  createBlurCircleMask,
  getSlideFromCoords,
} from './animations';

export {
  STORAGE_KEY,
  COLOR_STORAGE_KEY,
  GLOBAL_CLASS_NAME,
  COLOR_THEME_PREFIX,
  DEFAULT_DURATION,
  DEFAULT_EASING,
  DEFAULT_BLUR_AMOUNT,
  DEFAULT_STYLE_ID,
} from './constants';

export {
  getStoredTheme,
  setStoredTheme,
  getStoredColorTheme,
  setStoredColorTheme,
} from './storage';
