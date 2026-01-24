import { useEffect, useRef, useState, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { ThemeAnimationType, Theme, AnimationConfig } from '../../core/types';
import {
  injectBaseStyles,
  resolveTheme,
  getSystemTheme,
  supportsViewTransitions,
  prefersReducedMotion,
  createCircleAnimation,
  createBlurCircleAnimation,
  createSlideAnimation,
  getSlideFromCoords,
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
import { UseThemeProps, UseThemeReturn } from '../types';

const isBrowser = typeof window !== 'undefined';

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
  } = props;

  const isHighResolution =
    isBrowser && (window.innerWidth >= 3000 || window.innerHeight >= 2000);
  const duration = isHighResolution
    ? Math.max(propsDuration * 0.8, 500)
    : propsDuration;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    injectBaseStyles();
    setMounted(true);
  }, []);

  const [internalTheme, setInternalTheme] = useState<Theme>(() => {
    return getStoredTheme(storageKey, themes, defaultTheme);
  });

  const [internalColorTheme, setInternalColorTheme] = useState(() => {
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

    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add(globalClassName);
    } else {
      document.documentElement.classList.remove(globalClassName);
    }

    colorThemes.forEach((theme) => {
      document.documentElement.classList.remove(`${colorThemePrefix}${theme}`);
    });
    document.documentElement.classList.add(
      `${colorThemePrefix}${currentColorTheme}`
    );
  }, [
    resolvedTheme,
    currentColorTheme,
    globalClassName,
    colorThemePrefix,
    colorThemes,
    mounted,
  ]);

  const ref = useRef<HTMLButtonElement>(null);

  const setTheme = useCallback(
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

  const setColorTheme = useCallback(
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

  const switchTheme = useCallback(
    async (newTheme: Theme, animationOff: boolean = false) => {
      if (
        !ref.current ||
        !supportsViewTransitions() ||
        prefersReducedMotion() ||
        animationOff
      ) {
        setTheme(newTheme);
        return;
      }

      let animationConfig: AnimationConfig;

      if (animationType === ThemeAnimationType.SLIDE) {
        const fromCoords =
          slideFromX !== undefined && slideFromY !== undefined
            ? { a: slideFromX, b: slideFromY }
            : getSlideFromCoords(slideDirection);

        animationConfig = {
          a: fromCoords.a,
          b: fromCoords.b,
          x: slideToX,
          y: slideToY,
          duration,
          easing,
          animationType,
          blurAmount,
          styleId,
        };
      } else {
        const { top, left, width, height } =
          ref.current.getBoundingClientRect();
        const x = left + width / 2;
        const y = top + height / 2;

        animationConfig = {
          x,
          y,
          duration,
          easing,
          animationType,
          blurAmount,
          styleId,
        };
      }

      if (animationType === ThemeAnimationType.BLUR_CIRCLE) {
        createBlurCircleAnimation(animationConfig);
      }

      if (animationType === ThemeAnimationType.SLIDE) {
        createSlideAnimation(animationConfig);
      }

      await (document as Document).startViewTransition(() => {
        flushSync(() => {
          setTheme(newTheme);
        });
      }).ready;

      if (animationType === ThemeAnimationType.CIRCLE) {
        createCircleAnimation(animationConfig);
      }
    },
    [
      setTheme,
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
    ]
  );

  const switchColorTheme = useCallback(
    (newColorTheme: string) => {
      if (colorThemes.indexOf(newColorTheme) === -1) {
        console.warn(
          `Color theme "${newColorTheme}" not found in available themes`
        );
        return;
      }
      setColorTheme(newColorTheme);
    },
    [colorThemes, setColorTheme]
  );

  const toggleTheme = useCallback(
    async (animationOff: boolean = false) => {
      const newTheme: Theme = resolvedTheme === 'dark' ? 'light' : 'dark';
      await switchTheme(newTheme, animationOff);
    },
    [resolvedTheme, switchTheme]
  );

  const toggleLightTheme = useCallback(
    async (animationOff: boolean = false) => {
      if (resolvedTheme === 'light') return;
      await switchTheme('light', animationOff);
    },
    [resolvedTheme, switchTheme]
  );

  const toggleDarkTheme = useCallback(
    async (animationOff: boolean = false) => {
      if (resolvedTheme === 'dark') return;
      await switchTheme('dark', animationOff);
    },
    [resolvedTheme, switchTheme]
  );

  const toggleColorTheme = useCallback(() => {
    const currentIndex = colorThemes.indexOf(currentColorTheme);
    const nextIndex = (currentIndex + 1) % colorThemes.length;
    const nextColorTheme = colorThemes[nextIndex];
    setColorTheme(nextColorTheme);
  }, [currentColorTheme, colorThemes, setColorTheme]);

  const createColorThemeToggle = useCallback(
    (targetColorTheme: string) => {
      return () => {
        if (colorThemes.indexOf(targetColorTheme) === -1) {
          console.warn(
            `Color theme "${targetColorTheme}" not found in available themes`
          );
          return;
        }
        setColorTheme(targetColorTheme);
      };
    },
    [colorThemes, setColorTheme]
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
