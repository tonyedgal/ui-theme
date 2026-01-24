'use client';

import React, {
  createContext,
  useContext,
  ReactNode,
  useCallback,
} from 'react';
import { useTheme } from '../hooks/use-theme';
import { Theme, ColorTheme, ThemeAnimationType } from '../../core/types';
import { getSystemTheme } from '../../core/animations';

/**
 * Context type for the Vite UI Theme Provider
 */
export interface ViteUIThemeContextType {
  /** Ref to attach to the trigger button */
  ref: React.RefObject<HTMLButtonElement | null>;
  /** Current theme value */
  theme: Theme;
  /** Current color theme value */
  colorTheme: ColorTheme;
  /** Resolved theme (light or dark) */
  resolvedTheme: 'light' | 'dark';
  /** System theme preference */
  systemTheme: 'light' | 'dark';
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
  /** Switch theme from a specific element (for animation origin) */
  switchThemeFromElement: (
    theme: Theme,
    element: HTMLButtonElement
  ) => Promise<void>;
}

const ViteUIThemeContext = createContext<ViteUIThemeContextType | undefined>(
  undefined
);

/**
 * Props for the Vite UI Theme Provider
 */
export interface ViteUIThemeProviderProps {
  /** React children to wrap with theme context */
  children: ReactNode;
  /** Available theme options */
  themes?: Theme[];
  /** Available color theme options */
  colorThemes?: ColorTheme[];
  /** Default theme to use */
  defaultTheme?: Theme;
  /** Default color theme to use */
  defaultColorTheme?: ColorTheme;
  /** Animation type for theme transitions */
  animationType?: ThemeAnimationType;
  /** Animation duration in milliseconds */
  duration?: number;
  /** Attribute to use for theme ('class' or 'data-theme') */
  attribute?: 'class' | 'data-theme';
  /** Disable transitions during theme change */
  disableTransitionOnChange?: boolean;
  /** Storage key for theme */
  storageKey?: string;
  /** Storage key for color theme */
  colorStorageKey?: string;
  /** Class name for dark mode */
  globalClassName?: string;
  /** Prefix for color theme classes */
  colorThemePrefix?: string;
}

/**
 * Vite UI Theme Provider - Theme provider optimized for Vite/SPA applications
 *
 * This provider includes additional features like transition disabling
 * and system theme tracking that are useful in client-side applications.
 *
 * Note: For flash prevention on initial load, add a script to your index.html
 * or inject it via Vite plugin to apply theme before React loads.
 *
 * @param props - Provider configuration options
 */
export const ViteUIThemeProvider: React.FC<ViteUIThemeProviderProps> = ({
  children,
  themes = ['light', 'dark', 'system'],
  colorThemes = ['default'],
  defaultTheme = 'system',
  defaultColorTheme = 'default',
  animationType = ThemeAnimationType.CIRCLE,
  duration = 750,
  attribute = 'class',
  disableTransitionOnChange = false,
  storageKey = 'ui-theme',
  colorStorageKey = 'ui-color-theme',
  globalClassName = 'dark',
  colorThemePrefix = 'theme-',
}) => {
  const themeState = useTheme({
    themes,
    colorThemes,
    defaultTheme,
    defaultColorTheme,
    animationType,
    duration,
    storageKey,
    colorStorageKey,
    globalClassName: attribute === 'class' ? globalClassName : undefined,
    colorThemePrefix,
  });

  const applyTransitionDisable = useCallback(() => {
    if (!disableTransitionOnChange) return () => {};

    const css = document.createElement('style');
    css.textContent = `*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`;
    document.head.appendChild(css);

    window.getComputedStyle(document.body);

    return () => {
      setTimeout(() => {
        document.head.removeChild(css);
      }, 1);
    };
  }, [disableTransitionOnChange]);

  const wrappedSetTheme = useCallback(
    (theme: Theme) => {
      const cleanup = applyTransitionDisable();
      themeState.setTheme(theme);
      cleanup();
    },
    [themeState.setTheme, applyTransitionDisable]
  );

  const wrappedSwitchTheme = useCallback(
    async (theme: Theme, animationOff: boolean = false) => {
      const cleanup = applyTransitionDisable();
      await themeState.switchTheme(theme, animationOff);
      cleanup();
    },
    [themeState.switchTheme, applyTransitionDisable]
  );

  const wrappedToggleTheme = useCallback(
    async (animationOff: boolean = false) => {
      const cleanup = applyTransitionDisable();
      await themeState.toggleTheme(animationOff);
      cleanup();
    },
    [themeState.toggleTheme, applyTransitionDisable]
  );

  const wrappedToggleLightTheme = useCallback(
    async (animationOff: boolean = false) => {
      const cleanup = applyTransitionDisable();
      await themeState.toggleLightTheme(animationOff);
      cleanup();
    },
    [themeState.toggleLightTheme, applyTransitionDisable]
  );

  const wrappedToggleDarkTheme = useCallback(
    async (animationOff: boolean = false) => {
      const cleanup = applyTransitionDisable();
      await themeState.toggleDarkTheme(animationOff);
      cleanup();
    },
    [themeState.toggleDarkTheme, applyTransitionDisable]
  );

  const switchThemeFromElement = async (
    theme: Theme,
    element: HTMLButtonElement
  ) => {
    const cleanup = applyTransitionDisable();
    if (themeState.ref.current) {
      const originalRef = themeState.ref.current;
      Object.defineProperty(themeState.ref, 'current', {
        value: element,
        writable: true,
        configurable: true,
      });
      await themeState.switchTheme(theme);
      Object.defineProperty(themeState.ref, 'current', {
        value: originalRef,
        writable: true,
        configurable: true,
      });
    } else {
      Object.defineProperty(themeState.ref, 'current', {
        value: element,
        writable: true,
        configurable: true,
      });
      await themeState.switchTheme(theme);
    }
    cleanup();
  };

  const systemTheme = getSystemTheme();

  const contextValue: ViteUIThemeContextType = {
    ref: themeState.ref,
    theme: themeState.theme,
    colorTheme: themeState.colorTheme,
    resolvedTheme: themeState.resolvedTheme,
    systemTheme,
    setTheme: wrappedSetTheme,
    setColorTheme: themeState.setColorTheme,
    switchTheme: wrappedSwitchTheme,
    switchThemeFromElement,
    switchColorTheme: themeState.switchColorTheme,
    toggleTheme: wrappedToggleTheme,
    toggleLightTheme: wrappedToggleLightTheme,
    toggleDarkTheme: wrappedToggleDarkTheme,
    toggleColorTheme: themeState.toggleColorTheme,
    createColorThemeToggle: themeState.createColorThemeToggle,
    isColorThemeActive: themeState.isColorThemeActive,
  };

  return (
    <ViteUIThemeContext.Provider value={contextValue}>
      {children}
    </ViteUIThemeContext.Provider>
  );
};

/**
 * Hook to consume the Vite UI Theme context
 *
 * @returns Theme context value with all theme state and methods
 * @throws Error if used outside of ViteUIThemeProvider
 */
export const useViteUITheme = (): ViteUIThemeContextType => {
  const context = useContext(ViteUIThemeContext);
  if (context === undefined) {
    throw new Error('useViteUITheme must be used within a ViteUIThemeProvider');
  }
  return context;
};
