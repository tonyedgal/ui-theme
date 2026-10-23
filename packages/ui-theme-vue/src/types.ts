import type { MaybeRefOrGetter } from 'vue';
import type {
  Theme,
  ThemeConfig,
  ThemeAnimationOptions,
  ThemeAnimationType,
  SlideDirection,
} from './core';

export type ThemeTransitionInput =
  | boolean
  | {
      element?: Element | null;
      origin?: { x: number; y: number };
      animationOff?: boolean;
    };

export type ThemeTrigger = ThemeTransitionInput | MouseEvent;

export type TransitionOptions = ThemeAnimationOptions & {
  animationType?: ThemeAnimationType;
  duration?: number;
  easing?: string;
  blurAmount?: number;
  styleId?: string;
  slideDirection?: SlideDirection;
  slideFromX?: number;
  slideFromY?: number;
  slideToX?: number;
  slideToY?: number;
};

export interface ThemeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type UIThemeOptions = Omit<ThemeConfig, 'themes' | 'colorThemes'> &
  TransitionOptions & {
    themes?: readonly Theme[];
    colorThemes?: readonly string[];
    storage?: ThemeStorage | false;
    onThemeChange?: (theme: Theme) => void;
    onColorThemeChange?: (theme: string) => void;
  };

export type ReactiveTransitionOptions = MaybeRefOrGetter<TransitionOptions>;
