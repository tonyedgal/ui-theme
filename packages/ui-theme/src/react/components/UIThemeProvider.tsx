'use client';

import { SharedThemeContext } from './shared-theme-context';
import { useHydrated } from '../hooks/use-hydrated';
import { getThemeLogoOptions } from '../../core/logo';

import React, { createContext, useContext, ReactNode } from 'react';
import { useTheme } from '../hooks/use-theme';
import type { UseThemeReturn } from '../types';
import {
  Theme,
  ColorTheme,
  ThemeAnimationType,
  ThemeAnimationOptions,
} from '../../core/types';
import { DEFAULT_DURATION } from '../../core/constants';

/**
 * Context type for the UI Theme Provider
 */
export interface UIThemeContextType extends UseThemeReturn {
  /** Legacy convenience wrapper; does not mutate the shared ref. */
  switchThemeFromElement: (theme: Theme, element: Element) => Promise<void>;
}

const UIThemeContext = createContext<UIThemeContextType | undefined>(undefined);

/**
 * Props for the UI Theme Provider
 */
export type UIThemeProviderProps = ThemeAnimationOptions & {
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
  /** Storage key for theme */
  storageKey?: string;
  /** Storage key for color theme */
  colorStorageKey?: string;
};

/**
 * UI Theme Provider - Provides centralized theme state management
 *
 * This provider creates a single source of truth for theme state using the useTheme hook.
 * All theme-related components should consume from this context to ensure synchronization.
 *
 * @param props - Provider configuration options
 */
export const UIThemeProvider: React.FC<UIThemeProviderProps> = ({
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
  storageKey,
  colorStorageKey,
}) => {
  const mounted = useHydrated();

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
  });

  const switchThemeFromElement = (theme: Theme, element: Element) =>
    themeState.switchTheme(theme, { element });

  if (!mounted) {
    const loadingContextValue: UIThemeContextType = {
      ref: { current: null },
      theme: defaultTheme,
      colorTheme: defaultColorTheme,
      resolvedTheme: defaultTheme === 'dark' ? 'dark' : 'light',
      setTheme: () => {},
      setColorTheme: () => {},
      switchTheme: async () => {},
      switchThemeFromElement: async () => {},
      switchColorTheme: async () => {},
      toggleTheme: async () => {},
      toggleLightTheme: async () => {},
      toggleDarkTheme: async () => {},
      toggleColorTheme: async () => {},
      createColorThemeToggle: () => async () => {},
      isColorThemeActive: () => false,
    };

    return (
      <UIThemeContext.Provider value={loadingContextValue}>
        <SharedThemeContext.Provider value={loadingContextValue}>
          {children}
        </SharedThemeContext.Provider>
      </UIThemeContext.Provider>
    );
  }

  const contextValue: UIThemeContextType = {
    ref: themeState.ref,
    theme: themeState.theme,
    colorTheme: themeState.colorTheme,
    resolvedTheme: themeState.resolvedTheme,
    setTheme: themeState.setTheme,
    setColorTheme: themeState.setColorTheme,
    switchTheme: themeState.switchTheme,
    switchThemeFromElement,
    switchColorTheme: themeState.switchColorTheme,
    toggleTheme: themeState.toggleTheme,
    toggleLightTheme: themeState.toggleLightTheme,
    toggleDarkTheme: themeState.toggleDarkTheme,
    toggleColorTheme: themeState.toggleColorTheme,
    createColorThemeToggle: themeState.createColorThemeToggle,
    isColorThemeActive: themeState.isColorThemeActive,
  };

  return (
    <UIThemeContext.Provider value={contextValue}>
      <SharedThemeContext.Provider value={contextValue}>
        {children}
      </SharedThemeContext.Provider>
    </UIThemeContext.Provider>
  );
};

/**
 * Hook to consume the UI Theme context
 *
 * @returns Theme context value with all theme state and methods
 * @throws Error if used outside of UIThemeProvider
 */
export const useUITheme = (): UIThemeContextType => {
  const context = useContext(UIThemeContext);

  if (context === undefined) {
    throw new Error('useUITheme must be used within a UIThemeProvider');
  }

  return context;
};
