import { RefObject } from 'react';
import { Theme, ColorTheme } from '../../core/types';

import type {
  ThemeControllerOptions,
  ThemeControllerSnapshot,
  ThemeTransitionInput,
  ColorThemeToggle,
} from '../../core/controller';

export type {
  SystemThemeMode,
  ThemeTransitionOptions,
  ThemeTransitionInput,
  ColorThemeToggle,
} from '../../core/controller';

export type UseThemeProps = ThemeControllerOptions;

export interface UseThemeReturn extends ThemeControllerSnapshot {
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
