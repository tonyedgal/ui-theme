export enum ThemeAnimationType {
  CIRCLE = 'circle',
  BLUR_CIRCLE = 'blur-circle',
  SLIDE = 'slide',
  CLIP_PATH = 'clip-path',
  POLYGON_GRADIENT = 'polygon-gradient',
  TRIANGLE = 'triangle',
  SVG_LOGO = 'svg-logo',
}

/** Clockwise from the top-left corner. */
export const TRANSITION_DIRECTIONS = [
  'top-left',
  'top',
  'top-right',
  'right',
  'bottom-right',
  'bottom',
  'bottom-left',
  'left',
] as const;

export type TransitionDirection = (typeof TRANSITION_DIRECTIONS)[number];

export type AnimationPosition = TransitionDirection | 'center' | 'trigger';

interface ThemeAnimationSettings {
  /** Starting edge/corner for polygon wipes. Defaults to top-left. */
  clipPathDirection?: TransitionDirection;
  /** Fixed circle/triangle origin; SVG_LOGO always uses the viewport center. */
  animationPosition?: AnimationPosition;
  /** Stationary logo width in CSS pixels or auto; default is 96 when both are omitted. */
  logoWidth?: number | 'auto';
  /** Logo height in CSS pixels or auto; omitted dimensions preserve the SVG aspect ratio. */
  logoHeight?: number | 'auto';
  /** Gradient wipe feather in CSS pixels; defaults to 80. */
  gradientWidth?: number;
}

/** Choose one shared asset, or both destination-specific assets. */
export type ThemeLogoOptions =
  | { logo?: string; logoLight?: never; logoDark?: never }
  | { logo?: never; logoLight: string; logoDark: string };

export type ThemeAnimationOptions = ThemeAnimationSettings & ThemeLogoOptions;

export type Theme = 'light' | 'dark' | 'system';

export type ColorTheme = string;

export type SlideDirection =
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface AnimationConfig extends ThemeAnimationSettings {
  /** Asset already selected for the destination theme before capture. */
  logo?: string;
  a?: number;
  b?: number;
  x: number;
  y: number;
  duration: number;
  easing: string;
  animationType: ThemeAnimationType;
  blurAmount: number;
  styleId: string;
}

export interface ThemeConfig {
  themes?: Theme[];
  colorThemes?: ColorTheme[];
  defaultTheme?: Theme;
  defaultColorTheme?: ColorTheme;
  globalClassName?: string;
  colorThemePrefix?: string;
  storageKey?: string;
  colorStorageKey?: string;
}

export interface ThemeState {
  theme: Theme;
  colorTheme: ColorTheme;
  resolvedTheme: 'light' | 'dark';
}
