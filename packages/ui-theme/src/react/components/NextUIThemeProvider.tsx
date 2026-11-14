'use client';

import { buildThemeScript } from '../../core/theme-script';
import { SharedThemeContext } from './shared-theme-context';
import { useHydrated } from '../hooks/use-hydrated';
import { getThemeLogoOptions } from '../../core/logo';

import React, {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import { useTheme } from '../hooks/use-theme';
import type { UseThemeReturn, ThemeTransitionInput } from '../types';
import {
  Theme,
  ColorTheme,
  ThemeAnimationType,
  ThemeAnimationOptions,
} from '../../core/types';
import {
  DEFAULT_DURATION,
  STORAGE_KEY,
  COLOR_STORAGE_KEY,
  GLOBAL_CLASS_NAME,
  COLOR_THEME_PREFIX,
} from '../../core/constants';

/**
 * Context type for the Next.js UI Theme Provider
 */
export interface NextUIThemeContextType extends UseThemeReturn {
  /** System theme preference */
  systemTheme: 'light' | 'dark';
  /** Legacy convenience wrapper; does not mutate the shared ref. */
  switchThemeFromElement: (theme: Theme, element: Element) => Promise<void>;
}

const NextUIThemeContext = createContext<NextUIThemeContextType | undefined>(
  undefined
);

/**
 * Props for the Next.js UI Theme Provider
 */
export type NextUIThemeProviderProps = ThemeAnimationOptions & {
  /** React children to wrap with theme context */
  children: ReactNode;
  /** Available theme options */
  themes?: readonly Theme[];
  /** Available color theme options */
  colorThemes?: readonly ColorTheme[];
  /** Default theme to use */
  defaultTheme?: Theme;
  /** Default color theme to use */
  defaultColorTheme?: ColorTheme;
  /** Animation type for theme transitions */
  animationType?: ThemeAnimationType | `${ThemeAnimationType}`;
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
};

/**
 * Pre-hydration script component
 * Injects inline script before React hydration to prevent theme flash
 */
interface ThemePreHydrationScriptProps {
  themes: readonly Theme[];
  colorThemes: readonly ColorTheme[];
  storageKey: string;
  colorStorageKey: string;
  defaultTheme: Theme;
  defaultColorTheme: ColorTheme;
  attribute: 'class' | 'data-theme';
  globalClassName: string;
  colorThemePrefix: string;
  nonce?: string;
}

const ThemePreHydrationScript = React.memo(
  ({
    themes,
    colorThemes,
    storageKey,
    colorStorageKey,
    defaultTheme,
    defaultColorTheme,
    attribute,
    globalClassName,
    colorThemePrefix,
    nonce,
  }: ThemePreHydrationScriptProps) => {
    const scriptContent = buildThemeScript({
      storageKey,
      colorStorageKey,
      themes,
      colorThemes,
      defaultTheme,
      defaultColorTheme,
      globalClassName,
      colorThemePrefix,
      storage: true,
      dataTheme: attribute === 'data-theme',
      systemClasses: false,
      systemCss: false,
      palette: 'add',
    });

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
  defaultColorTheme = colorThemes[0] ?? 'default',
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
  storageKey = STORAGE_KEY,
  colorStorageKey = COLOR_STORAGE_KEY,
  attribute = 'class',
  globalClassName = GLOBAL_CLASS_NAME,
  colorThemePrefix = COLOR_THEME_PREFIX,
  nonce,
  disableAnimationOnInit = true,
  disablePreHydrationScript = false,
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
    globalClassName: attribute === 'class' ? globalClassName : undefined,
    colorThemePrefix,
  });

  const switchThemeWithHydrationAwareness = useCallback(
    async (theme: Theme, options: ThemeTransitionInput = false) => {
      if (!mounted && disableAnimationOnInit) {
        themeState.setTheme(theme);
      } else {
        await themeState.switchTheme(theme, options);
      }
    },
    [mounted, disableAnimationOnInit, themeState]
  );

  const switchThemeFromElement = useCallback(
    (theme: Theme, element: Element) =>
      switchThemeWithHydrationAwareness(theme, { element }),
    [switchThemeWithHydrationAwareness]
  );

  const contextValue = useMemo<NextUIThemeContextType>(
    () => ({
      ...themeState,
      switchTheme: switchThemeWithHydrationAwareness,
      switchThemeFromElement,
    }),
    [themeState, switchThemeWithHydrationAwareness, switchThemeFromElement]
  );

  if (!mounted) {
    const loadingContextValue: NextUIThemeContextType = {
      themes,
      colorThemes,
      mounted: false,
      ref: { current: null },
      theme: defaultTheme,
      colorTheme: defaultColorTheme,
      resolvedTheme: defaultTheme === 'dark' ? 'dark' : 'light',
      systemTheme: 'light',
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
      <NextUIThemeContext.Provider value={loadingContextValue}>
        <SharedThemeContext.Provider value={loadingContextValue}>
          {!disablePreHydrationScript && (
            <ThemePreHydrationScript
              themes={themes}
              colorThemes={colorThemes}
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
        </SharedThemeContext.Provider>
      </NextUIThemeContext.Provider>
    );
  }

  return (
    <NextUIThemeContext.Provider value={contextValue}>
      <SharedThemeContext.Provider value={contextValue}>
        {!disablePreHydrationScript && (
          <ThemePreHydrationScript
            themes={themes}
            colorThemes={colorThemes}
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
      </SharedThemeContext.Provider>
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
