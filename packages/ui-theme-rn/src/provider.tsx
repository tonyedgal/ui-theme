import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import type { ReactNode } from 'react';
import { AccessibilityInfo, Appearance, AppState } from 'react-native';
import { createThemeStore } from './core/store';
import type { ThemeStore } from './core/store';
import type { ThemeStoreOptions } from './core/types';
import { defaultPalettes } from './palettes';
import type { ThemeColors, ThemePaletteDefinition } from './palettes';

interface ThemeContextValue {
  store: ThemeStore;
  palettes: Readonly<Record<string, ThemePaletteDefinition>>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const ResolvedColorsContext = createContext<ThemeColors | null>(null);

/** Bridge CSS-resolved colors to native components without changing preferences. */
export function UIThemeColorsProvider({
  colors,
  children,
}: {
  colors: ThemeColors;
  children: ReactNode;
}) {
  return (
    <ResolvedColorsContext.Provider value={colors}>
      {children}
    </ResolvedColorsContext.Provider>
  );
}

export interface UIThemeProviderProps extends Omit<
  ThemeStoreOptions,
  'colorThemes' | 'systemTheme'
> {
  children: ReactNode;
  palettes?: Readonly<Record<string, ThemePaletteDefinition>>;
  /** Rendered while preferences restore. Use null to keep the launch screen visible. */
  fallback?: ReactNode;
}

/** Configuration belongs to the provider lifetime. Remount with a key to replace it. */
export function UIThemeProvider({
  children,
  fallback,
  palettes = defaultPalettes,
  ...options
}: UIThemeProviderProps) {
  const [context] = useState<ThemeContextValue>(() => ({
    palettes,
    store: createThemeStore({
      ...options,
      colorThemes: Object.keys(palettes),
      systemTheme: Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
    }),
  }));

  const snapshot = useSyncExternalStore(
    context.store.subscribe,
    context.store.getSnapshot,
    context.store.getSnapshot
  );

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      context.store.setSystemTheme(colorScheme === 'dark' ? 'dark' : 'light');
    });

    // Refresh after subscribing so an appearance change during mount is not missed.
    context.store.setSystemTheme(
      Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
    );

    const appSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        context.store.setSystemTheme(
          Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
        );
      }
    });

    void context.store.hydrate();

    return () => {
      subscription.remove();
      appSubscription.remove();
    };
  }, [context]);

  return (
    <ThemeContext.Provider value={context}>
      <ResolvedColorsContext.Provider value={null}>
        {!snapshot.isHydrated && fallback !== undefined ? fallback : children}
      </ResolvedColorsContext.Provider>
    </ThemeContext.Provider>
  );
}

export function useUITheme() {
  const context = useContext(ThemeContext);
  const resolvedColors = useContext(ResolvedColorsContext);

  if (!context)
    throw new Error('useUITheme must be used within UIThemeProvider.');

  const snapshot = useSyncExternalStore(
    context.store.subscribe,
    context.store.getSnapshot,
    context.store.getSnapshot
  );

  return useMemo(
    () => ({
      ...snapshot,
      get colors(): ThemeColors {
        if (resolvedColors) return resolvedColors;

        const colors =
          context.palettes[snapshot.colorTheme][snapshot.resolvedTheme];

        if (!colors)
          throw new Error(
            'CSS palette colors require a styling adapter around this component.'
          );

        return colors;
      },
      palettes: context.palettes,
      colorThemes: Object.keys(context.palettes),
      setTheme: context.store.setTheme,
      setColorTheme: context.store.setColorTheme,
      toggleTheme: context.store.toggleTheme,
      toggleColorTheme: context.store.toggleColorTheme,
      flush: context.store.flush,
    }),
    [context, snapshot, resolvedColors]
  );
}

/** Use the OS setting conservatively until its asynchronous first read finishes. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let active = true;
    let receivedEvent = false;

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (value) => {
        receivedEvent = true;
        setReduced(value);
      }
    );

    void AccessibilityInfo.isReduceMotionEnabled().then(
      (value) => {
        if (active && !receivedEvent) setReduced(value);
      },
      () => {
        /* Keep the conservative setting when the native query is unavailable. */
      }
    );

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}

export function useThemeColors(): ThemeColors {
  return useUITheme().colors;
}
