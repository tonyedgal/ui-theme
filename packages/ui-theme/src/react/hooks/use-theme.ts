import { useEffect, useRef, useState, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { ThemeAnimationType, Theme, AnimationConfig } from '../../core/types';
import {
  injectBaseStyles,
  resolveTheme,
  getSystemTheme,
  getSlideFromCoords,
  getAnimationPosition,
} from '../../core/animations';
import {
  getStoredTheme,
  setStoredTheme,
  getStoredColorTheme,
  setStoredColorTheme,
} from '../../core/storage';
import {
  STORAGE_KEY,
  COLOR_STORAGE_KEY,
  GLOBAL_CLASS_NAME,
  COLOR_THEME_PREFIX,
  DEFAULT_DURATION,
  DEFAULT_EASING,
  DEFAULT_BLUR_AMOUNT,
  DEFAULT_STYLE_ID,
} from '../../core/constants';
import {
  UseThemeProps,
  UseThemeReturn,
  ThemeTransitionInput,
  ColorThemeToggle,
} from '../types';
import { useHydrated } from './use-hydrated';
import { runThemeTransition } from '../../core/transitions';
import { preloadThemeLogo, getThemeLogoOptions } from '../../core/logo';

const isBrowser = typeof window !== 'undefined';

const getColorTransitionOptions = (
  input: Parameters<ColorThemeToggle>[0]
): ThemeTransitionInput | undefined =>
  input && input !== true && 'currentTarget' in input
    ? { element: input.currentTarget, animationOff: input.detail === 0 }
    : input;

/**
 * React hook for theme switching with View Transitions API animations
 * @param props - Configuration options for the theme animation
 * @returns Theme state and control functions
 */
export const useTheme = (props: UseThemeProps = {}): UseThemeReturn => {
  const {
    duration: propsDuration = DEFAULT_DURATION,
    easing = DEFAULT_EASING,
    animationType = ThemeAnimationType.CIRCLE,
    blurAmount = DEFAULT_BLUR_AMOUNT,
    clipPathDirection = 'top-left',
    animationPosition,
    logo,
    logoLight,
    logoDark,
    logoWidth,
    logoHeight,
    gradientWidth,
    styleId = DEFAULT_STYLE_ID,

    themes = ['light', 'dark', 'system'],
    colorThemes = ['default'],
    defaultTheme = 'system',
    defaultColorTheme = 'default',

    globalClassName = GLOBAL_CLASS_NAME,
    colorThemePrefix = COLOR_THEME_PREFIX,

    storageKey = STORAGE_KEY,
    colorStorageKey = COLOR_STORAGE_KEY,

    theme: externalTheme,
    colorTheme: externalColorTheme,

    onThemeChange,
    onColorThemeChange,

    slideDirection = 'left',
    slideFromX,
    slideFromY,
    slideToX = 0,
    slideToY = 0,

    initialTheme,
    initialColorTheme,
    systemThemeMode = 'js',
  } = props;

  // Validate untyped JavaScript callers as well as the public TypeScript union.
  getThemeLogoOptions({ logo, logoLight, logoDark });

  const duration = propsDuration;

  useEffect(() => {
    if (animationType !== ThemeAnimationType.SVG_LOGO) return;

    for (const asset of [logo, logoLight, logoDark]) {
      if (asset) void preloadThemeLogo(asset);
    }
  }, [animationType, logo, logoLight, logoDark]);

  const mounted = useHydrated();

  useEffect(() => {
    injectBaseStyles();
  }, []);

  const [internalTheme, setInternalTheme] = useState<Theme>(() => {
    if (initialTheme !== undefined) return initialTheme;

    return getStoredTheme(storageKey, themes, defaultTheme);
  });

  const [internalColorTheme, setInternalColorTheme] = useState(() => {
    if (initialColorTheme !== undefined) return initialColorTheme;

    return getStoredColorTheme(colorStorageKey, colorThemes, defaultColorTheme);
  });

  const currentTheme = externalTheme ?? internalTheme;
  const currentColorTheme = externalColorTheme ?? internalColorTheme;

  const [, setSystemTheme] = useState<'light' | 'dark'>(() => getSystemTheme());
  const resolvedTheme = resolveTheme(currentTheme);

  useEffect(() => {
    if (!isBrowser) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setSystemTheme(getSystemTheme());

    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!isBrowser || !mounted) return;

    const el = document.documentElement;

    if (systemThemeMode === 'css' && currentTheme === 'system') {
      // CSS mode: use 'system' class, let CSS @media handle dark/light
      el.classList.remove(globalClassName);
      el.classList.remove('auto');
      el.classList.remove('system');
      el.classList.add('system');
      el.style.colorScheme = '';
    } else {
      // JS mode or explicit light/dark: resolve and apply
      el.classList.remove('system');
      el.classList.remove('auto');

      if (resolvedTheme === 'dark') {
        el.classList.add(globalClassName);
      } else {
        el.classList.remove(globalClassName);
      }

      el.style.colorScheme = resolvedTheme;
    }

    colorThemes.forEach((theme) => {
      el.classList.remove(`${colorThemePrefix}${theme}`);
    });
    el.classList.add(`${colorThemePrefix}${currentColorTheme}`);
  }, [
    resolvedTheme,
    currentTheme,
    currentColorTheme,
    globalClassName,
    colorThemePrefix,
    colorThemes,
    mounted,
    systemThemeMode,
  ]);

  const ref = useRef<HTMLButtonElement>(null);
  const requestedTheme = useRef(currentTheme);
  const requestedColorTheme = useRef(currentColorTheme);
  const pendingUpdates = useRef(0);
  useEffect(() => {
    if (pendingUpdates.current === 0) {
      requestedTheme.current = currentTheme;
      requestedColorTheme.current = currentColorTheme;
    }
  }, [currentTheme, currentColorTheme]);

  const commitTheme = useCallback(
    (newTheme: Theme) => {
      setStoredTheme(newTheme, storageKey);

      if (externalTheme === undefined) {
        setInternalTheme(newTheme);
      }

      if (onThemeChange) {
        onThemeChange(newTheme);
      }
    },
    [onThemeChange, externalTheme, storageKey]
  );

  const commitColorTheme = useCallback(
    (newColorTheme: string) => {
      setStoredColorTheme(newColorTheme, colorStorageKey);

      if (externalColorTheme === undefined) {
        setInternalColorTheme(newColorTheme);
      }

      if (onColorThemeChange) {
        onColorThemeChange(newColorTheme);
      }
    },
    [onColorThemeChange, externalColorTheme, colorStorageKey]
  );

  const setTheme = useCallback(
    (newTheme: Theme) => {
      commitTheme(newTheme);
      requestedTheme.current = newTheme;
    },
    [commitTheme]
  );

  const setColorTheme = useCallback(
    (newColorTheme: string) => {
      commitColorTheme(newColorTheme);
      requestedColorTheme.current = newColorTheme;
    },
    [commitColorTheme]
  );

  const animateChange = useCallback(
    async (update: () => void, input: ThemeTransitionInput = false) => {
      const options =
        input === true || input === false ? { animationOff: input } : input;

      let config: AnimationConfig | null = null;

      if (!options.animationOff && duration > 0) {
        if (animationType === ThemeAnimationType.SLIDE) {
          const from =
            slideFromX !== undefined && slideFromY !== undefined
              ? { a: slideFromX, b: slideFromY }
              : getSlideFromCoords(slideDirection);

          config = {
            ...from,
            x: slideToX,
            y: slideToY,
            duration,
            easing,
            animationType,
            blurAmount,
            styleId,
          };
        } else {
          // Read before the first await. A menu may unmount its trigger, and a
          // responsive/moving layout may change during capture. All units are CSS px.
          const element = options.element ?? ref.current;
          const rect = options.origin ? null : element?.getBoundingClientRect();

          const origin =
            (animationType === ThemeAnimationType.SVG_LOGO
              ? getAnimationPosition('center')
              : null) ??
            options.origin ??
            (animationPosition && animationPosition !== 'trigger'
              ? getAnimationPosition(animationPosition)
              : null) ??
            (rect
              ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
              : animationType === ThemeAnimationType.CIRCLE ||
                  animationType === ThemeAnimationType.BLUR_CIRCLE
                ? null
                : getAnimationPosition('center'));

          if (
            origin &&
            Number.isFinite(origin.x) &&
            Number.isFinite(origin.y)
          ) {
            config = {
              ...origin,
              duration,
              easing,
              animationType,
              blurAmount,
              styleId,
              clipPathDirection,
              animationPosition,
              logo:
                logoLight !== undefined
                  ? resolveTheme(requestedTheme.current) === 'light'
                    ? logoLight
                    : logoDark
                  : logo,
              logoWidth,
              logoHeight,
              gradientWidth,
            };
          }
        }
      }

      pendingUpdates.current++;

      try {
        await runThemeTransition(() => flushSync(update), config);
      } finally {
        pendingUpdates.current--;
      }
    },
    [
      duration,
      easing,
      animationType,
      blurAmount,
      styleId,
      slideDirection,
      slideFromX,
      slideFromY,
      slideToX,
      slideToY,
      clipPathDirection,
      animationPosition,
      logo,
      logoLight,
      logoDark,
      logoWidth,
      logoHeight,
      gradientWidth,
    ]
  );

  const switchTheme = useCallback(
    async (newTheme: Theme, options?: ThemeTransitionInput) => {
      if (newTheme === requestedTheme.current) return;
      requestedTheme.current = newTheme;

      try {
        await animateChange(() => commitTheme(newTheme), options);
      } catch (error) {
        if (requestedTheme.current === newTheme)
          requestedTheme.current = currentTheme;
        throw error;
      }
    },
    [animateChange, commitTheme, currentTheme]
  );

  const switchColorTheme = useCallback(
    async (newColorTheme: string, options?: ThemeTransitionInput) => {
      if (!colorThemes.includes(newColorTheme)) {
        console.warn(
          `Color theme "${newColorTheme}" not found in available themes`
        );

        return;
      }

      if (newColorTheme === requestedColorTheme.current) return;
      requestedColorTheme.current = newColorTheme;

      try {
        await animateChange(() => commitColorTheme(newColorTheme), options);
      } catch (error) {
        if (requestedColorTheme.current === newColorTheme)
          requestedColorTheme.current = currentColorTheme;
        throw error;
      }
    },
    [colorThemes, animateChange, commitColorTheme, currentColorTheme]
  );

  const toggleTheme = useCallback(
    async (options?: ThemeTransitionInput) => {
      await switchTheme(
        resolveTheme(requestedTheme.current) === 'dark' ? 'light' : 'dark',
        options
      );
    },
    [switchTheme]
  );

  const toggleLightTheme = useCallback(
    async (options?: ThemeTransitionInput) => {
      if (resolveTheme(requestedTheme.current) === 'light') return;
      await switchTheme('light', options);
    },
    [switchTheme]
  );

  const toggleDarkTheme = useCallback(
    async (options?: ThemeTransitionInput) => {
      if (resolveTheme(requestedTheme.current) === 'dark') return;
      await switchTheme('dark', options);
    },
    [switchTheme]
  );

  const toggleColorTheme = useCallback(
    async (input?: Parameters<ColorThemeToggle>[0]) => {
      if (colorThemes.length === 0) return;
      const index = colorThemes.indexOf(requestedColorTheme.current);
      await switchColorTheme(
        colorThemes[(index + 1) % colorThemes.length],
        getColorTransitionOptions(input)
      );
    },
    [colorThemes, switchColorTheme]
  );

  const createColorThemeToggle = useCallback(
    (target: string): ColorThemeToggle => {
      return (input) => {
        return switchColorTheme(target, getColorTransitionOptions(input));
      };
    },
    [switchColorTheme]
  );

  const isColorThemeActive = useCallback(
    (targetColorTheme: string) => {
      return currentColorTheme === targetColorTheme;
    },
    [currentColorTheme]
  );

  return {
    ref,
    theme: currentTheme,
    colorTheme: currentColorTheme,
    resolvedTheme,
    setTheme,
    setColorTheme,
    switchTheme,
    switchColorTheme,
    toggleTheme,
    toggleLightTheme,
    toggleDarkTheme,
    toggleColorTheme,
    createColorThemeToggle,
    isColorThemeActive,
  };
};
