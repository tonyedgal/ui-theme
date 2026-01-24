import { RefObject } from 'react';
import {
  Theme,
  ColorTheme,
  ThemeAnimationType,
  SlideDirection,
} from '../../core/types';

/**
 * Props for the useTheme hook
 */
export interface UseThemeProps {
  /** Animation duration in milliseconds */
  duration?: number;
  /** CSS easing function */
  easing?: string;
  /** Type of animation to use */
  animationType?: ThemeAnimationType;
  /** Blur amount for blur circle animation */
  blurAmount?: number;
  /** ID for injected style element */
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
}

/**
 * Return type for the useTheme hook
 */
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
  /** Set color theme */
  setColorTheme: (colorTheme: ColorTheme) => void;

  /** Switch theme with animation */
  switchTheme: (theme: Theme, animationOff?: boolean) => Promise<void>;
  /** Switch color theme */
  switchColorTheme: (colorTheme: string) => void;

  /** Toggle between light and dark */
  toggleTheme: (animationOff?: boolean) => Promise<void>;
  /** Switch to light theme with animation */
  toggleLightTheme: (animationOff?: boolean) => Promise<void>;
  /** Switch to dark theme with animation */
  toggleDarkTheme: (animationOff?: boolean) => Promise<void>;
  /** Cycle through color themes */
  toggleColorTheme: () => void;

  /** Create a toggle function for a specific color theme */
  createColorThemeToggle: (targetColorTheme: string) => () => void;
  /** Check if a color theme is active */
  isColorThemeActive: (targetColorTheme: string) => boolean;
}

/**
 * Props for UIThemeSwitcher component
 */
export interface UIThemeSwitcherProps {
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
}

/**
 * Props for UIThemeSelector component
 */
export interface UIThemeSelectorProps {
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
}
