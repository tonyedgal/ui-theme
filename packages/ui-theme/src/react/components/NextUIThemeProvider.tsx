'use client';

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
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
 * Context type for the Next.js UI Theme Provider
 */
export interface NextUIThemeContextType {
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

const NextUIThemeContext = createContext<NextUIThemeContextType | undefined>(
  undefined
);

/**
 * Props for the Next.js UI Theme Provider
 */
export interface NextUIThemeProviderProps {
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
  /** HTML attribute to use for theme ('class' or 'data-theme') */
  attribute?: 'class' | 'data-theme';
  /** Class name for dark theme (when using 'class' attribute) */
  globalClassName?: string;
  /** Prefix for color theme classes */
  colorThemePrefix?: string;
  /** CSP nonce for inline script (SSR apps) */
  nonce?: string;
  /** Skip animation during initial hydration */
  disableAnimationOnInit?: boolean;
  /** Disable flash prevention script (for SPAs without SSR) */
  disablePreHydrationScript?: boolean;
}

/**
 * Pre-hydration script content generator
 * This script runs BEFORE React hydrates to prevent flash of wrong theme
 */
const generatePreHydrationScript = (
  storageKey: string,
  colorStorageKey: string,
  defaultTheme: Theme,
  defaultColorTheme: ColorTheme,
  attribute: 'class' | 'data-theme',
  globalClassName: string,
  colorThemePrefix: string
): string => {
  return `
(function() {
  try {
    var theme = localStorage.getItem('${storageKey}') || '${defaultTheme}';
    var colorTheme = localStorage.getItem('${colorStorageKey}') || '${defaultColorTheme}';
    var resolved = theme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    
    if ('${attribute}' === 'class') {
      if (resolved === 'dark') {
        document.documentElement.classList.add('${globalClassName}');
      } else {
        document.documentElement.classList.remove('${globalClassName}');
      }
    } else {
      document.documentElement.setAttribute('data-theme', resolved);
    }
    
    document.documentElement.style.colorScheme = resolved;
    document.documentElement.classList.add('${colorThemePrefix}' + colorTheme);
  } catch (e) {
    console.warn('Theme pre-hydration script failed:', e);
  }
})();
`;
};

/**
 * Pre-hydration script component
 * Injects inline script before React hydration to prevent theme flash
 */
const ThemePreHydrationScript: React.FC<{
  storageKey: string;
  colorStorageKey: string;
  defaultTheme: Theme;
  defaultColorTheme: ColorTheme;
  attribute: 'class' | 'data-theme';
  globalClassName: string;
  colorThemePrefix: string;
  nonce?: string;
}> = React.memo(
  ({
    storageKey,
    colorStorageKey,
    defaultTheme,
    defaultColorTheme,
    attribute,
    globalClassName,
    colorThemePrefix,
    nonce,
  }) => {
    const scriptContent = generatePreHydrationScript(
      storageKey,
      colorStorageKey,
      defaultTheme,
      defaultColorTheme,
      attribute,
      globalClassName,
      colorThemePrefix
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

ThemePreHydrationScript.displayName = 'ThemePreHydrationScript';

/**
 * Next.js UI Theme Provider - Universal React theme management with animations
 *
 * This provider works with Next.js and provides flash prevention
 * via pre-hydration script injection.
 *
 * Features:
 * - Pre-hydration script for flash prevention (SSR apps)
 * - Animated theme transitions via View Transitions API
 * - Multi-dimensional theming (theme + colorTheme)
 * - System theme detection
 * - CSP support via nonce prop
 *
 * @param props - Provider configuration options
 */
export const NextUIThemeProvider: React.FC<NextUIThemeProviderProps> = ({
  children,
  themes = ['light', 'dark', 'system'],
  colorThemes = ['default'],
  defaultTheme = 'system',
  defaultColorTheme = 'default',
  animationType = ThemeAnimationType.CIRCLE,
  duration = 750,
  storageKey = STORAGE_KEY,
  colorStorageKey = COLOR_STORAGE_KEY,
  attribute = 'class',
  globalClassName = GLOBAL_CLASS_NAME,
  colorThemePrefix = COLOR_THEME_PREFIX,
  nonce,
  disableAnimationOnInit = true,
  disablePreHydrationScript = false,
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
    globalClassName: attribute === 'class' ? globalClassName : undefined,
    colorThemePrefix,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const switchThemeWithHydrationAwareness = useCallback(
    async (theme: Theme, animationOff: boolean = false) => {
      if (!mounted && disableAnimationOnInit) {
        themeState.setTheme(theme);
      } else {
        await themeState.switchTheme(theme, animationOff);
      }
    },
    [mounted, disableAnimationOnInit, themeState]
  );

  const switchThemeFromElement = useCallback(
    async (theme: Theme, element: HTMLButtonElement) => {
      if (!mounted && disableAnimationOnInit) {
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
    [mounted, disableAnimationOnInit, themeState]
  );

  const systemTheme =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';

  if (!mounted) {
    const loadingContextValue: NextUIThemeContextType = {
      ref: { current: null },
      theme: defaultTheme,
      colorTheme: defaultColorTheme,
      resolvedTheme: defaultTheme === 'dark' ? 'dark' : 'light',
      systemTheme: 'light',
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
      <NextUIThemeContext.Provider value={loadingContextValue}>
        {!disablePreHydrationScript && (
          <ThemePreHydrationScript
            storageKey={storageKey}
            colorStorageKey={colorStorageKey}
            defaultTheme={defaultTheme}
            defaultColorTheme={defaultColorTheme}
            attribute={attribute}
            globalClassName={globalClassName}
            colorThemePrefix={colorThemePrefix}
            nonce={nonce}
          />
        )}
        {children}
      </NextUIThemeContext.Provider>
    );
  }

  const contextValue: NextUIThemeContextType = {
    ref: themeState.ref,
    theme: themeState.theme,
    colorTheme: themeState.colorTheme,
    resolvedTheme: themeState.resolvedTheme,
    systemTheme,
    setTheme: themeState.setTheme,
    setColorTheme: themeState.setColorTheme,
    switchTheme: switchThemeWithHydrationAwareness,
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
    <NextUIThemeContext.Provider value={contextValue}>
      {!disablePreHydrationScript && (
        <ThemePreHydrationScript
          storageKey={storageKey}
          colorStorageKey={colorStorageKey}
          defaultTheme={defaultTheme}
          defaultColorTheme={defaultColorTheme}
          attribute={attribute}
          globalClassName={globalClassName}
          colorThemePrefix={colorThemePrefix}
          nonce={nonce}
        />
      )}
      {children}
    </NextUIThemeContext.Provider>
  );
};

/**
 * Hook to consume the Next.js UI Theme context
 *
 * @returns Theme context value with all theme state and methods
 * @throws Error if used outside of NextUIThemeProvider
 */
export const useNextUITheme = (): NextUIThemeContextType => {
  const context = useContext(NextUIThemeContext);
  if (context === undefined) {
    throw new Error('useNextUITheme must be used within a NextUIThemeProvider');
  }
  return context;
};
