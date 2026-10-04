'use client';

import { SharedThemeContext } from './shared-theme-context';
import { getThemeLogoOptions } from '../../core/logo';

import React, {
  createContext,
  useContext,
  ReactNode,
  useCallback,
} from 'react';
import { useTheme } from '../hooks/use-theme';
import type { UseThemeReturn, ThemeTransitionInput } from '../types';
import {
  Theme,
  ColorTheme,
  ThemeAnimationType,
  ThemeAnimationOptions,
} from '../../core/types';
import { DEFAULT_DURATION } from '../../core/constants';
import { getSystemTheme } from '../../core/animations';

/**
 * Context type for the Vite UI Theme Provider
 */
export interface ViteUIThemeContextType extends UseThemeReturn {
  /** System theme preference */
  systemTheme: 'light' | 'dark';
  /** Legacy convenience wrapper; does not mutate the shared ref. */
  switchThemeFromElement: (theme: Theme, element: Element) => Promise<void>;
}

const ViteUIThemeContext = createContext<ViteUIThemeContextType | undefined>(
  undefined
);

/**
 * Props for the Vite UI Theme Provider
 */
export type ViteUIThemeProviderProps = ThemeAnimationOptions & {
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
};

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
  clipPathDirection,
  animationPosition,
  logo,
  logoLight,
  logoDark,
  logoWidth,
  logoHeight,
  gradientWidth,
  duration = DEFAULT_DURATION,
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
    clipPathDirection,
    animationPosition,
    ...getThemeLogoOptions({ logo, logoLight, logoDark }),
    logoWidth,
    logoHeight,
    gradientWidth,
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
    [themeState, applyTransitionDisable]
  );

  const wrappedSwitchTheme = useCallback(
    async (theme: Theme, options: ThemeTransitionInput = false) => {
      const cleanup = applyTransitionDisable();

      try {
        await themeState.switchTheme(theme, options);
      } finally {
        cleanup();
      }
    },
    [themeState, applyTransitionDisable]
  );

  const wrappedToggleTheme = useCallback(
    async (options: ThemeTransitionInput = false) => {
      const cleanup = applyTransitionDisable();

      try {
        await themeState.toggleTheme(options);
      } finally {
        cleanup();
      }
    },
    [themeState, applyTransitionDisable]
  );

  const wrappedToggleLightTheme = useCallback(
    async (options: ThemeTransitionInput = false) => {
      const cleanup = applyTransitionDisable();

      try {
        await themeState.toggleLightTheme(options);
      } finally {
        cleanup();
      }
    },
    [themeState, applyTransitionDisable]
  );

  const wrappedToggleDarkTheme = useCallback(
    async (options: ThemeTransitionInput = false) => {
      const cleanup = applyTransitionDisable();

      try {
        await themeState.toggleDarkTheme(options);
      } finally {
        cleanup();
      }
    },
    [themeState, applyTransitionDisable]
  );

  const switchThemeFromElement = (theme: Theme, element: Element) =>
    wrappedSwitchTheme(theme, { element });

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
      <SharedThemeContext.Provider value={contextValue}>
        {children}
      </SharedThemeContext.Provider>
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
