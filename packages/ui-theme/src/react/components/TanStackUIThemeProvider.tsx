'use client';

import React, {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useSyncExternalStore,
} from 'react';
import { useTheme } from '../hooks/use-theme';
import { Theme, ColorTheme, ThemeAnimationType } from '../../core/types';
import {
  STORAGE_KEY,
  COLOR_STORAGE_KEY,
  GLOBAL_CLASS_NAME,
  COLOR_THEME_PREFIX,
} from '../../core/constants';

/**
 * Context type for the TanStack Start UI Theme Provider
 */
export interface TanStackUIThemeContextType {
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
  /** Whether the component is hydrated */
  isHydrated: boolean;
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

const TanStackUIThemeContext = createContext<
  TanStackUIThemeContextType | undefined
>(undefined);

/**
 * Props for the TanStack Start UI Theme Provider
 */
export interface TanStackUIThemeProviderProps {
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
  /** Storage key for theme preference */
  storageKey?: string;
  /** Storage key for color theme preference */
  colorStorageKey?: string;
  /** Class name for dark theme */
  globalClassName?: string;
  /** Prefix for color theme classes */
  colorThemePrefix?: string;
}

/**
 * Custom hook to detect hydration state
 * Compatible with TanStack Start's isomorphic model
 *
 * In TanStack Start, you can also use the built-in `useHydrated()` hook
 * from `@tanstack/start` if available
 */
const useHydrated = (): boolean => {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
};

/**
 * TanStack Start UI Theme Provider - Optimized for TanStack Start Framework
 *
 * This provider leverages TanStack Start's isomorphic architecture, which
 * eliminates the need for pre-hydration scripts. The theme is resolved
 * consistently on both server and client.
 *
 * Features:
 * - No pre-hydration script needed (isomorphic execution)
 * - Uses useHydrated pattern for hydration detection
 * - Animations are safely enabled only after hydration
 * - Simpler architecture with no CSP concerns
 *
 * @param props - Provider configuration options
 */
export const TanStackUIThemeProvider: React.FC<
  TanStackUIThemeProviderProps
> = ({
  children,
  themes = ['light', 'dark', 'system'],
  colorThemes = ['default'],
  defaultTheme = 'system',
  defaultColorTheme = 'default',
  animationType = ThemeAnimationType.CIRCLE,
  duration = 750,
  storageKey = STORAGE_KEY,
  colorStorageKey = COLOR_STORAGE_KEY,
  globalClassName = GLOBAL_CLASS_NAME,
  colorThemePrefix = COLOR_THEME_PREFIX,
}) => {
  const isHydrated = useHydrated();

  const themeState = useTheme({
    themes,
    colorThemes,
    defaultTheme,
    defaultColorTheme,
    animationType,
    duration,
    storageKey,
    colorStorageKey,
    globalClassName,
    colorThemePrefix,
  });

  const switchThemeWithHydrationAwareness = useCallback(
    async (theme: Theme, animationOff: boolean = false) => {
      if (!isHydrated) {
        themeState.setTheme(theme);
      } else {
        await themeState.switchTheme(theme, animationOff);
      }
    },
    [isHydrated, themeState]
  );

  const toggleThemeWithHydrationAwareness = useCallback(
    async (animationOff: boolean = false) => {
      if (!isHydrated) {
        const nextTheme =
          themeState.resolvedTheme === 'dark' ? 'light' : 'dark';
        themeState.setTheme(nextTheme);
      } else {
        await themeState.toggleTheme(animationOff);
      }
    },
    [isHydrated, themeState]
  );

  const toggleLightThemeWithHydrationAwareness = useCallback(
    async (animationOff: boolean = false) => {
      if (!isHydrated) {
        themeState.setTheme('light');
      } else {
        await themeState.toggleLightTheme(animationOff);
      }
    },
    [isHydrated, themeState]
  );

  const toggleDarkThemeWithHydrationAwareness = useCallback(
    async (animationOff: boolean = false) => {
      if (!isHydrated) {
        themeState.setTheme('dark');
      } else {
        await themeState.toggleDarkTheme(animationOff);
      }
    },
    [isHydrated, themeState]
  );

  const switchThemeFromElement = useCallback(
    async (theme: Theme, element: HTMLButtonElement) => {
      if (!isHydrated) {
        themeState.setTheme(theme);
        return;
      }

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
    },
    [isHydrated, themeState]
  );

  const systemTheme =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';

  if (!isHydrated) {
    const loadingContextValue: TanStackUIThemeContextType = {
      ref: { current: null },
      theme: defaultTheme,
      colorTheme: defaultColorTheme,
      resolvedTheme: defaultTheme === 'dark' ? 'dark' : 'light',
      systemTheme: 'light',
      isHydrated: false,
      setTheme: themeState.setTheme,
      setColorTheme: themeState.setColorTheme,
      switchTheme: async (theme: Theme) => themeState.setTheme(theme),
      switchThemeFromElement: async (theme: Theme) =>
        themeState.setTheme(theme),
      switchColorTheme: themeState.switchColorTheme,
      toggleTheme: async () => {
        const nextTheme =
          themeState.resolvedTheme === 'dark' ? 'light' : 'dark';
        themeState.setTheme(nextTheme);
      },
      toggleLightTheme: async () => themeState.setTheme('light'),
      toggleDarkTheme: async () => themeState.setTheme('dark'),
      toggleColorTheme: themeState.toggleColorTheme,
      createColorThemeToggle: themeState.createColorThemeToggle,
      isColorThemeActive: themeState.isColorThemeActive,
    };

    return (
      <TanStackUIThemeContext.Provider value={loadingContextValue}>
        {children}
      </TanStackUIThemeContext.Provider>
    );
  }

  const contextValue: TanStackUIThemeContextType = {
    ref: themeState.ref,
    theme: themeState.theme,
    colorTheme: themeState.colorTheme,
    resolvedTheme: themeState.resolvedTheme,
    systemTheme,
    isHydrated: true,
    setTheme: themeState.setTheme,
    setColorTheme: themeState.setColorTheme,
    switchTheme: switchThemeWithHydrationAwareness,
    switchThemeFromElement,
    switchColorTheme: themeState.switchColorTheme,
    toggleTheme: toggleThemeWithHydrationAwareness,
    toggleLightTheme: toggleLightThemeWithHydrationAwareness,
    toggleDarkTheme: toggleDarkThemeWithHydrationAwareness,
    toggleColorTheme: themeState.toggleColorTheme,
    createColorThemeToggle: themeState.createColorThemeToggle,
    isColorThemeActive: themeState.isColorThemeActive,
  };

  return (
    <TanStackUIThemeContext.Provider value={contextValue}>
      {children}
    </TanStackUIThemeContext.Provider>
  );
};

/**
 * Hook to consume the TanStack UI Theme context
 *
 * @returns Theme context value with all theme state and methods
 * @throws Error if used outside of TanStackUIThemeProvider
 */
export const useTanStackUITheme = (): TanStackUIThemeContextType => {
  const context = useContext(TanStackUIThemeContext);
  if (context === undefined) {
    throw new Error(
      'useTanStackUITheme must be used within a TanStackUIThemeProvider'
    );
  }
  return context;
};
