export enum ThemeAnimationType {
  CIRCLE = 'circle',
  BLUR_CIRCLE = 'blur-circle',
  SLIDE = 'slide',
}

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

export interface AnimationConfig {
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
