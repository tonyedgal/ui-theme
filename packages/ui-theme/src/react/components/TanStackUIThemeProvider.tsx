'use client';

import React, {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useEffect,
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
import { setStoredTheme, setStoredColorTheme } from '../../core/storage';
import type { SystemThemeMode } from '../types';

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
  /**
   * Server-resolved theme class from cookie (e.g., 'light', 'dark', 'system').
   * When provided, prevents flash by using this as the initial value during SSR.
   * Typically obtained via `getThemeServerFn()` in `beforeLoad`.
   */
  serverTheme?: 'light' | 'dark' | 'system';
  /**
   * Server-resolved color theme from cookie.
   * When provided, prevents color theme flash during SSR.
   */
  serverColorTheme?: string;
  /**
   * How to handle 'system' theme resolution.
   * - 'css': Apply 'system' class on <html>, let CSS @media queries handle it (zero flash, requires CSS setup)
   * - 'js': Resolve via matchMedia in JS (works with existing CSS, may flash briefly)
   * @default 'css'
   */
  systemThemeMode?: SystemThemeMode;
  /**
   * Callback to persist theme to server (cookie).
   * Called alongside localStorage updates when user changes theme.
   * Typically `setThemeServerFn` from `createThemeServerFns()`.
   */
  onServerThemeChange?: (theme: Theme) => Promise<void> | void;
  /**
   * Callback to persist color theme to server (cookie).
   * Called alongside localStorage updates when user changes color theme.
   * Typically `setColorThemeServerFn` from `createThemeServerFns()`.
   */
  onServerColorThemeChange?: (colorTheme: string) => Promise<void> | void;
}

/**
 * Props for the TanStackStartThemeScript component
 */
export interface TanStackStartThemeScriptProps {
  /** Storage key for theme preference in localStorage */
  storageKey?: string;
  /** Storage key for color theme preference in localStorage */
  colorStorageKey?: string;
  /** Default theme when nothing is stored */
  defaultTheme?: Theme;
  /** Default color theme when nothing is stored */
  defaultColorTheme?: ColorTheme;
  /** Class name for dark theme */
  globalClassName?: string;
  /** Prefix for color theme classes */
  colorThemePrefix?: string;
  /** CSP nonce for the inline script */
  nonce?: string;
  /**
   * How to handle 'system' theme.
   * - 'css': Apply 'system' class (let CSS handle dark via media query)
   * - 'js': Resolve via matchMedia and apply 'dark' or remove class
   * @default 'js'
   */
  systemThemeMode?: SystemThemeMode;
}

/**
 * Generates the pre-hydration script content for flash prevention.
 * This script runs synchronously before React hydrates.
 */
const generateTanStackPreHydrationScript = (
  storageKey: string,
  colorStorageKey: string,
  defaultTheme: Theme,
  defaultColorTheme: ColorTheme,
  globalClassName: string,
  colorThemePrefix: string,
  systemThemeMode: SystemThemeMode
): string => {
  return `
(function() {
  try {
    var theme = localStorage.getItem('${storageKey}') || '${defaultTheme}';
    var colorTheme = localStorage.getItem('${colorStorageKey}') || '${defaultColorTheme}';
    var el = document.documentElement;
    var resolved;
    if (theme === 'system') {
      if ('${systemThemeMode}' === 'css') {
        el.classList.remove('${globalClassName}');
        el.classList.remove('auto');
        el.classList.remove('system');
        el.classList.add('system');
        el.style.colorScheme = '';
      } else {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        if (resolved === 'dark') {
          el.classList.add('${globalClassName}');
        } else {
          el.classList.remove('${globalClassName}');
        }
        el.classList.remove('system');
        el.classList.remove('auto');
        el.style.colorScheme = resolved;
      }
    } else {
      resolved = theme;
      el.classList.remove('system');
      el.classList.remove('auto');
      if (resolved === 'dark') {
        el.classList.add('${globalClassName}');
      } else {
        el.classList.remove('${globalClassName}');
      }
      el.style.colorScheme = resolved;
    }
    if (colorTheme && colorTheme !== 'default') {
      el.classList.add('${colorThemePrefix}' + colorTheme);
    }
  } catch (e) {
    console.warn('Theme pre-hydration script failed:', e);
  }
})();
`;
};

/**
 * Pre-hydration script for TanStack Start applications.
 *
 * Place this in the `<head>` of your `shellComponent` to prevent theme flash
 * when not using the cookie-based approach.
 *
 * Reads the theme preference from localStorage and applies the correct classes
 * and colorScheme to `<html>` before React hydrates.
 *
 * @example
 * ```tsx
 * function RootDocument({ children }: { children: React.ReactNode }) {
 *   return (
 *     <html lang="en" suppressHydrationWarning>
 *       <head>
 *         <TanStackStartThemeScript />
 *         <HeadContent />
 *       </head>
 *       <body>{children}<Scripts /></body>
 *     </html>
 *   );
 * }
 * ```
 */
export const TanStackStartThemeScript: React.FC<TanStackStartThemeScriptProps> =
  React.memo(
    ({
      storageKey = STORAGE_KEY,
      colorStorageKey = COLOR_STORAGE_KEY,
      defaultTheme = 'system',
      defaultColorTheme = 'default',
      globalClassName = GLOBAL_CLASS_NAME,
      colorThemePrefix = COLOR_THEME_PREFIX,
      nonce,
      systemThemeMode = 'js',
    }) => {
      const scriptContent = generateTanStackPreHydrationScript(
        storageKey,
        colorStorageKey,
        defaultTheme,
        defaultColorTheme,
        globalClassName,
        colorThemePrefix,
        systemThemeMode
      );

      return (
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: scriptContent }}
        />
      );
    }
  );

TanStackStartThemeScript.displayName = 'TanStackStartThemeScript';

/**
 * Custom hook to detect hydration state
 * Compatible with TanStack Start's isomorphic model
 */
const useHydrated = (): boolean => {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
};

/**
 * TanStack Start UI Theme Provider - Flash-free dark mode for TanStack Start
 *
 * Supports two approaches for preventing theme flash:
 *
 * **Option A — Cookie-based (recommended, zero flash):**
 * Pass `serverTheme` and `serverColorTheme` from route context (obtained via
 * `getThemeServerFn()` in `beforeLoad`). The server renders the correct classes
 * on `<html>`, and this provider syncs localStorage on the client.
 *
 * **Option B — Pre-hydration script:**
 * Use `<TanStackStartThemeScript>` in your shellComponent's `<head>`.
 * Reads from localStorage before React hydrates.
 *
 * Both approaches support `systemThemeMode`:
 * - `'css'`: Applies 'system' class, CSS media queries handle dark mode
 * - `'js'`: Resolves system theme via matchMedia in JS
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
  serverTheme,
  serverColorTheme,
  systemThemeMode = 'css',
  onServerThemeChange,
  onServerColorThemeChange,
}) => {
  const isHydrated = useHydrated();
  const hasServerTheme = serverTheme !== undefined;

  // Derive initialTheme from serverTheme for the useTheme hook
  const initialTheme: Theme | undefined = hasServerTheme
    ? serverTheme === 'system'
      ? 'system'
      : serverTheme
    : undefined;

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
    systemThemeMode,
    initialTheme,
    initialColorTheme: serverColorTheme,
  });

  // Sync localStorage with server-provided values on first hydration
  useEffect(() => {
    if (!hasServerTheme) return;
    if (initialTheme) {
      setStoredTheme(initialTheme, storageKey);
    }
    if (serverColorTheme) {
      setStoredColorTheme(serverColorTheme, colorStorageKey);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only on mount

  // Wrap setTheme to also call server callback
  const setThemeWithServer = useCallback(
    (newTheme: Theme) => {
      themeState.setTheme(newTheme);
      if (onServerThemeChange) {
        onServerThemeChange(newTheme);
      }
    },
    [themeState, onServerThemeChange]
  );

  // Wrap setColorTheme to also call server callback
  const setColorThemeWithServer = useCallback(
    (newColorTheme: string) => {
      themeState.setColorTheme(newColorTheme);
      if (onServerColorThemeChange) {
        onServerColorThemeChange(newColorTheme);
      }
    },
    [themeState, onServerColorThemeChange]
  );

  const switchThemeWithHydrationAwareness = useCallback(
    async (theme: Theme, animationOff: boolean = false) => {
      if (!isHydrated) {
        setThemeWithServer(theme);
      } else {
        await themeState.switchTheme(theme, animationOff);
        if (onServerThemeChange) {
          onServerThemeChange(theme);
        }
      }
    },
    [isHydrated, themeState, setThemeWithServer, onServerThemeChange]
  );

  const toggleThemeWithHydrationAwareness = useCallback(
    async (animationOff: boolean = false) => {
      if (!isHydrated) {
        const nextTheme =
          themeState.resolvedTheme === 'dark' ? 'light' : 'dark';
        setThemeWithServer(nextTheme);
      } else {
        await themeState.toggleTheme(animationOff);
        const nextTheme =
          themeState.resolvedTheme === 'dark' ? 'light' : 'dark';
        if (onServerThemeChange) {
          onServerThemeChange(nextTheme);
        }
      }
    },
    [isHydrated, themeState, setThemeWithServer, onServerThemeChange]
  );

  const toggleLightThemeWithHydrationAwareness = useCallback(
    async (animationOff: boolean = false) => {
      if (!isHydrated) {
        setThemeWithServer('light');
      } else {
        await themeState.toggleLightTheme(animationOff);
        if (onServerThemeChange) {
          onServerThemeChange('light');
        }
      }
    },
    [isHydrated, themeState, setThemeWithServer, onServerThemeChange]
  );

  const toggleDarkThemeWithHydrationAwareness = useCallback(
    async (animationOff: boolean = false) => {
      if (!isHydrated) {
        setThemeWithServer('dark');
      } else {
        await themeState.toggleDarkTheme(animationOff);
        if (onServerThemeChange) {
          onServerThemeChange('dark');
        }
      }
    },
    [isHydrated, themeState, setThemeWithServer, onServerThemeChange]
  );

  const switchColorThemeWithServer = useCallback(
    (newColorTheme: string) => {
      themeState.switchColorTheme(newColorTheme);
      if (onServerColorThemeChange) {
        onServerColorThemeChange(newColorTheme);
      }
    },
    [themeState, onServerColorThemeChange]
  );

  const switchThemeFromElement = useCallback(
    async (theme: Theme, element: HTMLButtonElement) => {
      if (!isHydrated) {
        setThemeWithServer(theme);
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
      if (onServerThemeChange) {
        onServerThemeChange(theme);
      }
    },
    [isHydrated, themeState, setThemeWithServer, onServerThemeChange]
  );

  const systemTheme =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';

  // Compute the resolvedTheme for the server (pre-hydration) context
  const serverResolvedTheme: 'light' | 'dark' = (() => {
    if (hasServerTheme) {
      if (serverTheme === 'dark') return 'dark';
      if (serverTheme === 'system') return systemTheme;
      return 'light';
    }
    return defaultTheme === 'dark' ? 'dark' : 'light';
  })();

  if (!isHydrated) {
    const loadingContextValue: TanStackUIThemeContextType = {
      ref: { current: null },
      theme: initialTheme ?? defaultTheme,
      colorTheme: serverColorTheme ?? defaultColorTheme,
      resolvedTheme: serverResolvedTheme,
      systemTheme: 'light',
      isHydrated: false,
      setTheme: setThemeWithServer,
      setColorTheme: setColorThemeWithServer,
      switchTheme: async (theme: Theme) => setThemeWithServer(theme),
      switchThemeFromElement: async (theme: Theme) => setThemeWithServer(theme),
      switchColorTheme: switchColorThemeWithServer,
      toggleTheme: async () => {
        const nextTheme = serverResolvedTheme === 'dark' ? 'light' : 'dark';
        setThemeWithServer(nextTheme);
      },
      toggleLightTheme: async () => setThemeWithServer('light'),
      toggleDarkTheme: async () => setThemeWithServer('dark'),
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
    setTheme: setThemeWithServer,
    setColorTheme: setColorThemeWithServer,
    switchTheme: switchThemeWithHydrationAwareness,
    switchThemeFromElement,
    switchColorTheme: switchColorThemeWithServer,
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
