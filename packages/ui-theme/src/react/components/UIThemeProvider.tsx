'use client';

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from 'react';
import { useTheme } from '../hooks/use-theme';
import { Theme, ColorTheme, ThemeAnimationType } from '../../core/types';

/**
 * Context type for the UI Theme Provider
 */
export interface UIThemeContextType {
  /** Ref to attach to the trigger button */
  ref: React.RefObject<HTMLButtonElement | null>;
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
  /** Switch theme from a specific element (for animation origin) */
  switchThemeFromElement: (
    theme: Theme,
    element: HTMLButtonElement
  ) => Promise<void>;
}

const UIThemeContext = createContext<UIThemeContextType | undefined>(undefined);

/**
 * Props for the UI Theme Provider
 */
export interface UIThemeProviderProps {
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
}

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
  duration = 750,
  storageKey,
  colorStorageKey,
}) => {
  const [mounted, setMounted] = useState(false);

  const themeState = useTheme({
    themes,
    colorThemes,
    defaultTheme,
    defaultColorTheme,
    animationType,
    duration,
    storageKey,
    colorStorageKey,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const switchThemeFromElement = async (
    theme: Theme,
    element: HTMLButtonElement
  ) => {
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
  };

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
      switchColorTheme: () => {},
      toggleTheme: async () => {},
      toggleLightTheme: async () => {},
      toggleDarkTheme: async () => {},
      toggleColorTheme: () => {},
      createColorThemeToggle: () => () => {},
      isColorThemeActive: () => false,
    };

    return (
      <UIThemeContext.Provider value={loadingContextValue}>
        {children}
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
      {children}
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
