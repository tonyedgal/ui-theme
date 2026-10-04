import { RefObject } from 'react';
import {
  Theme,
  ColorTheme,
  ThemeAnimationType,
  SlideDirection,
  ThemeAnimationOptions,
} from '../../core/types';

/** System theme resolution mode */
export type SystemThemeMode = 'css' | 'js';

/**
 * Props for the useTheme hook
 */
export type UseThemeProps = ThemeAnimationOptions & {
  /** Animation duration in milliseconds */
  duration?: number;
  /** CSS easing function */
  easing?: string;
  /** Type of animation to use */
  animationType?: ThemeAnimationType;
  /** Reveal edge feather in CSS pixels, capped at 20 (0 uses a sharp circle). */
  blurAmount?: number;
  /** Legacy style ID, retained for compatibility with the native animation path. */
  styleId?: string;

  /** Available themes */
  themes?: Theme[];
  /** Available color themes */
  colorThemes?: ColorTheme[];
  /** Default theme on first load */
  defaultTheme?: Theme;
  /** Default color theme on first load */
  defaultColorTheme?: ColorTheme;

  /** Class name for dark mode */
  globalClassName?: string;
  /** Prefix for color theme classes */
  colorThemePrefix?: string;

  /** Storage key for theme */
  storageKey?: string;
  /** Storage key for color theme */
  colorStorageKey?: string;

  /** Controlled theme value */
  theme?: Theme;
  /** Controlled color theme value */
  colorTheme?: ColorTheme;

  /** Callback when theme changes */
  onThemeChange?: (theme: Theme) => void;
  /** Callback when color theme changes */
  onColorThemeChange?: (colorTheme: ColorTheme) => void;

  /** Direction for slide animation */
  slideDirection?: SlideDirection;
  /** Custom X start position for slide */
  slideFromX?: number;
  /** Custom Y start position for slide */
  slideFromY?: number;
  /** X end position for slide */
  slideToX?: number;
  /** Y end position for slide */
  slideToY?: number;

  /**
   * Server-provided initial theme (from cookie).
   * When set, used as the initial useState value instead of reading localStorage.
   */
  initialTheme?: Theme;
  /**
   * Server-provided initial color theme (from cookie).
   * When set, used as the initial useState value instead of reading localStorage.
   */
  initialColorTheme?: ColorTheme;
  /**
   * How to handle 'system' theme resolution.
   * - 'css': Apply 'system' class on <html>, let CSS @media queries handle dark mode
   * - 'js': Resolve via matchMedia in JS (current behavior)
   * @default 'js'
   */
  systemThemeMode?: SystemThemeMode;
};

/** Per-call animation controls shared by all providers. */
export interface ThemeTransitionOptions {
  /** Skip the view transition (also automatically skipped for reduced motion). */
  animationOff?: boolean;
  /** Trigger element; its viewport rectangle is read synchronously. */
  element?: Element | null;
  /** Viewport-relative CSS pixels. Never multiply these coordinates by DPR. */
  origin?: { x: number; y: number };
}

/** Boolean arguments remain supported for backward compatibility. */
export type ThemeTransitionInput = boolean | ThemeTransitionOptions;

export type ColorThemeToggle = (
  options?:
    | ThemeTransitionInput
    | Pick<React.MouseEvent<HTMLElement>, 'currentTarget' | 'detail'>
) => Promise<void>;

export interface UseThemeReturn {
  /** Ref to attach to the trigger button */
  ref: RefObject<HTMLButtonElement | null>;

  /** Current theme value */
  theme: Theme;
  /** Current color theme value */
  colorTheme: ColorTheme;
  /** Resolved theme (light or dark) */
  resolvedTheme: 'light' | 'dark';

  /** Set theme without animation */
  setTheme: (theme: Theme) => void;
  /** Set color theme without animation */
  setColorTheme: (colorTheme: ColorTheme) => void;

  /** Switch theme with animation */
  switchTheme: (theme: Theme, options?: ThemeTransitionInput) => Promise<void>;
  /** Switch color theme with animation */
  switchColorTheme: (
    colorTheme: string,
    options?: ThemeTransitionInput
  ) => Promise<void>;

  /** Toggle between light and dark */
  toggleTheme: (options?: ThemeTransitionInput) => Promise<void>;
  /** Switch to light theme with animation */
  toggleLightTheme: (options?: ThemeTransitionInput) => Promise<void>;
  /** Switch to dark theme with animation */
  toggleDarkTheme: (options?: ThemeTransitionInput) => Promise<void>;
  /** Cycle through color themes */
  toggleColorTheme: ColorThemeToggle;

  /** Create a toggle function for a specific color theme */
  createColorThemeToggle: (targetColorTheme: string) => ColorThemeToggle;
  /** Check if a color theme is active */
  isColorThemeActive: (targetColorTheme: string) => boolean;
}

/**
 * Props for UIThemeSwitcher component
 */
export type UIThemeSwitcherProps = ThemeAnimationOptions & {
  /** Available themes */
  themes?: Theme[];
  /** Current theme (controlled) */
  currentTheme?: Theme;
  /** Callback when theme changes */
  onThemeChange?: (theme: Theme) => void;

  /** Animation type */
  animationType?: ThemeAnimationType;
  /** Animation duration */
  duration?: number;

  /** Additional CSS class */
  className?: string;
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost';

  /** Custom icons for themes */
  icons?: {
    light?: React.ReactNode;
    dark?: React.ReactNode;
    system?: React.ReactNode;
  };
};

/**
 * Props for UIThemeSelector component
 */
export type UIThemeSelectorProps = ThemeAnimationOptions & {
  /** Available themes */
  themes?: Theme[];
  /** Available color themes */
  colorThemes?: ColorTheme[];
  /** Current theme (controlled) */
  currentTheme?: Theme;
  /** Current color theme (controlled) */
  currentColorTheme?: ColorTheme;

  /** Callback when theme changes */
  onThemeChange?: (theme: Theme) => void;
  /** Callback when color theme changes */
  onColorThemeChange?: (colorTheme: ColorTheme) => void;

  /** Animation type */
  animationType?: ThemeAnimationType;
  /** Animation duration */
  duration?: number;

  /** Additional CSS class */
  className?: string;
  /** Placeholder text */
  placeholder?: string;

  /** Label for theme selector */
  themeLabel?: string;
  /** Label for color theme selector */
  colorThemeLabel?: string;
};
