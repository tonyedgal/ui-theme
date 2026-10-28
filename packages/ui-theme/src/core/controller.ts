import {
  ThemeAnimationType,
  type AnimationConfig,
  type Theme,
  type ThemeAnimationOptions,
  type ThemeConfig,
  type ThemeState,
  type SlideDirection,
} from './types';
import {
  injectBaseStyles,
  getSystemTheme,
  resolveTheme,
  getSlideFromCoords,
  getAnimationPosition,
} from './animations';
import {
  getStoredTheme,
  getStoredColorTheme,
  setStoredTheme,
  setStoredColorTheme,
} from './storage';
import {
  STORAGE_KEY,
  COLOR_STORAGE_KEY,
  DEFAULT_DURATION,
  DEFAULT_EASING,
  DEFAULT_BLUR_AMOUNT,
  DEFAULT_STYLE_ID,
} from './constants';
import { runThemeTransition } from './transitions';
import { getThemeLogoOptions, preloadThemeLogo } from './logo';
import {
  resolveThemeConfig,
  validateThemeValue,
  validateColorThemeValue,
} from './config';

export type SystemThemeMode = 'css' | 'js';

export type ThemeTransitionSettings = ThemeAnimationOptions & {
  duration?: number;
  easing?: string;
  animationType?: ThemeAnimationType;
  blurAmount?: number;
  styleId?: string;
  slideDirection?: SlideDirection;
  slideFromX?: number;
  slideFromY?: number;
  slideToX?: number;
  slideToY?: number;
};

export type ThemeTransitionOptions = ThemeTransitionSettings & {
  animationOff?: boolean;
  element?: Element | null;
  origin?: { x: number; y: number };
};

export type ThemeTransitionInput = boolean | ThemeTransitionOptions;

export type ColorThemeToggleInput =
  ThemeTransitionInput | { currentTarget: Element; detail: number };

export type ColorThemeToggle = (input?: ColorThemeToggleInput) => Promise<void>;

export interface ThemeStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export type ThemeControllerOptions = ThemeTransitionSettings &
  ThemeConfig & {
    storage?: ThemeStorage | false;
    theme?: Theme;
    colorTheme?: string;
    onThemeChange?: (theme: Theme) => void;
    onColorThemeChange?: (colorTheme: string) => void;
    initialTheme?: Theme;
    initialColorTheme?: string;
    systemThemeMode?: SystemThemeMode;
  };

export interface ThemeControllerSnapshot extends ThemeState {
  readonly systemTheme: 'light' | 'dark';
  readonly themes: readonly Theme[];
  readonly colorThemes: readonly string[];
  readonly mounted: boolean;
}

export interface ThemeControllerAdapter {
  commit?: (update: () => void) => void | Promise<void>;
  getElement?: () => Element | null;
  onBrowserStorageError?: (error: Error) => void;
}

export interface ThemeController {
  getSnapshot: () => ThemeControllerSnapshot;
  getServerSnapshot: () => ThemeControllerSnapshot;
  subscribe: (listener: () => void) => () => void;
  mount: () => () => void;
  dispose: () => void;
  updateOptions: (options: Partial<ThemeControllerOptions>) => void;
  setTheme: (theme: Theme) => void;
  setColorTheme: (theme: string) => void;
  switchTheme: (theme: Theme, input?: ThemeTransitionInput) => Promise<void>;
  switchColorTheme: (
    theme: string,
    input?: ThemeTransitionInput
  ) => Promise<void>;
  toggleTheme: (input?: ThemeTransitionInput) => Promise<void>;
  toggleLightTheme: (input?: ThemeTransitionInput) => Promise<void>;
  toggleDarkTheme: (input?: ThemeTransitionInput) => Promise<void>;
  toggleColorTheme: ColorThemeToggle;
  createColorThemeToggle: (theme: string) => ColorThemeToggle;
  isColorThemeActive: (theme: string) => boolean;
}

const sameValues = <T>(left: readonly T[], right: readonly T[]) =>
  left.length === right.length &&
  left.every((value, index) => value === right[index]);

const transitionInput = (
  input?: ColorThemeToggleInput
): ThemeTransitionInput | undefined =>
  input && input !== true && 'currentTarget' in input
    ? { element: input.currentTarget, animationOff: input.detail === 0 }
    : input;

export const createThemeController = (
  initialOptions: ThemeControllerOptions = {},
  adapter: ThemeControllerAdapter = {}
): ThemeController => {
  let options = initialOptions;
  let config = resolveThemeConfig(options);
  getThemeLogoOptions(options);

  const validateStateOptions = (
    next: ThemeControllerOptions,
    prefix: string
  ) => {
    if (next.theme !== undefined) validateThemeValue(next.theme);

    if (next.initialTheme !== undefined) validateThemeValue(next.initialTheme);

    if (next.colorTheme !== undefined)
      validateColorThemeValue(next.colorTheme, prefix);

    if (next.initialColorTheme !== undefined)
      validateColorThemeValue(next.initialColorTheme, prefix);
  };

  validateStateOptions(options, config.colorThemePrefix);

  const readStored = (key: string) => {
    try {
      return options.storage ? options.storage.getItem(key) : null;
    } catch {
      return null;
    }
  };

  const readTheme = (): Theme => {
    if (options.storage === undefined)
      return getStoredTheme(
        options.storageKey,
        config.themes,
        config.defaultTheme
      );
    const value = readStored(options.storageKey ?? STORAGE_KEY);

    return (
      config.themes.find((theme) => theme === value) ?? config.defaultTheme
    );
  };

  const readColorTheme = () => {
    if (options.storage === undefined)
      return getStoredColorTheme(
        options.colorStorageKey,
        config.colorThemes,
        config.defaultColorTheme
      );
    const value = readStored(options.colorStorageKey ?? COLOR_STORAGE_KEY);

    return (
      config.colorThemes.find((theme) => theme === value) ??
      config.defaultColorTheme
    );
  };

  let internalTheme = options.initialTheme ?? readTheme();
  let internalColorTheme = options.initialColorTheme ?? readColorTheme();
  let themeChanged = false;
  let colorThemeChanged = false;
  let systemTheme = getSystemTheme();
  let mounted = false;
  let pendingUpdates = 0;
  let lifecycle = 0;
  let detach: (() => void) | undefined;
  let updateStorageListener: (() => void) | undefined;
  let appliedColorClass: string | undefined;
  let appliedDarkClass: string | undefined;
  const listeners = new Set<() => void>();

  const serverTheme =
    options.theme ?? options.initialTheme ?? config.defaultTheme;

  const serverSnapshot: ThemeControllerSnapshot = {
    theme: serverTheme,
    colorTheme:
      options.colorTheme ??
      options.initialColorTheme ??
      config.defaultColorTheme,
    resolvedTheme: serverTheme === 'dark' ? 'dark' : 'light',
    systemTheme: 'light',
    themes: config.themes,
    colorThemes: config.colorThemes,
    mounted: false,
  };

  let snapshot: ThemeControllerSnapshot = {
    ...serverSnapshot,
    theme: options.theme ?? internalTheme,
    colorTheme: options.colorTheme ?? internalColorTheme,
    resolvedTheme: resolveTheme(options.theme ?? internalTheme),
    systemTheme,
  };

  let committedTheme = snapshot.theme;
  let committedColorTheme = snapshot.colorTheme;
  let requestedTheme = snapshot.theme;
  let requestedColorTheme = snapshot.colorTheme;

  const applyDocument = () => {
    if (!mounted || typeof document === 'undefined') return;
    const root = document.documentElement;
    const darkClass = config.globalClassName;
    const prefix = config.colorThemePrefix;

    if (appliedDarkClass && appliedDarkClass !== darkClass)
      root.classList.remove(appliedDarkClass);
    root.classList.remove('auto', 'system');

    if (options.systemThemeMode === 'css' && snapshot.theme === 'system') {
      root.classList.remove(darkClass);
      root.classList.add('system');
      root.style.colorScheme = '';
    } else {
      root.classList.toggle(darkClass, snapshot.resolvedTheme === 'dark');
      root.style.colorScheme = snapshot.resolvedTheme;
    }

    appliedDarkClass = darkClass;

    if (appliedColorClass) root.classList.remove(appliedColorClass);
    snapshot.colorThemes.forEach((theme) =>
      root.classList.remove(`${prefix}${theme}`)
    );
    appliedColorClass = `${prefix}${snapshot.colorTheme}`;
    root.classList.add(appliedColorClass);
  };

  const publish = () => {
    const theme = options.theme ?? internalTheme;
    const colorTheme = options.colorTheme ?? internalColorTheme;
    const themes = config.themes;
    const colorThemes = config.colorThemes;

    const next: ThemeControllerSnapshot = {
      theme,
      colorTheme,
      resolvedTheme: theme === 'system' ? systemTheme : theme,
      systemTheme,
      themes: sameValues(snapshot.themes, themes) ? snapshot.themes : themes,
      colorThemes: sameValues(snapshot.colorThemes, colorThemes)
        ? snapshot.colorThemes
        : colorThemes,
      mounted,
    };

    const changed =
      next.theme !== snapshot.theme ||
      next.colorTheme !== snapshot.colorTheme ||
      next.resolvedTheme !== snapshot.resolvedTheme ||
      next.systemTheme !== snapshot.systemTheme ||
      next.themes !== snapshot.themes ||
      next.colorThemes !== snapshot.colorThemes ||
      next.mounted !== snapshot.mounted;

    if (changed) snapshot = next;
    applyDocument();

    if (changed) listeners.forEach((listener) => listener());
  };

  const preload = () => {
    if (options.animationType !== ThemeAnimationType.SVG_LOGO) return;

    for (const asset of [options.logo, options.logoLight, options.logoDark]) {
      if (asset) void preloadThemeLogo(asset);
    }
  };

  const writeBrowserStorage = (write: () => void) => {
    try {
      write();
    } catch (error) {
      if (!adapter.onBrowserStorageError) throw error;
      adapter.onBrowserStorageError(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  };

  const commitTheme = (theme: Theme) => {
    validateThemeValue(theme);

    if (options.storage === undefined)
      writeBrowserStorage(() =>
        setStoredTheme(theme, options.storageKey ?? STORAGE_KEY)
      );
    else if (options.storage)
      options.storage.setItem(options.storageKey ?? STORAGE_KEY, theme);
    themeChanged = true;
    committedTheme = theme;

    if (options.theme === undefined) internalTheme = theme;
    publish();
    options.onThemeChange?.(theme);
  };

  const commitColorTheme = (theme: string) => {
    validateColorThemeValue(theme, config.colorThemePrefix);

    if (options.storage === undefined)
      writeBrowserStorage(() =>
        setStoredColorTheme(theme, options.colorStorageKey ?? COLOR_STORAGE_KEY)
      );
    else if (options.storage)
      options.storage.setItem(
        options.colorStorageKey ?? COLOR_STORAGE_KEY,
        theme
      );
    colorThemeChanged = true;
    committedColorTheme = theme;

    if (options.colorTheme === undefined) internalColorTheme = theme;
    publish();
    options.onColorThemeChange?.(theme);
  };

  const animationConfig = (
    input: ThemeTransitionInput = false
  ): AnimationConfig | null => {
    const call =
      input === true || input === false ? { animationOff: input } : input;

    const hasLogo =
      call.logo !== undefined ||
      call.logoLight !== undefined ||
      call.logoDark !== undefined;

    const settings = { ...options, ...call };

    if (hasLogo)
      Object.assign(settings, {
        logo: undefined,
        logoLight: undefined,
        logoDark: undefined,
        ...getThemeLogoOptions(call),
      });

    getThemeLogoOptions(settings);
    const duration = settings.duration ?? DEFAULT_DURATION;

    if (call.animationOff || duration <= 0 || typeof window === 'undefined')
      return null;
    const animationType = settings.animationType ?? ThemeAnimationType.CIRCLE;

    const shared = {
      duration,
      easing: settings.easing ?? DEFAULT_EASING,
      animationType,
      blurAmount: settings.blurAmount ?? DEFAULT_BLUR_AMOUNT,
      styleId: settings.styleId ?? DEFAULT_STYLE_ID,
    };

    if (animationType === ThemeAnimationType.SLIDE) {
      const from =
        settings.slideFromX !== undefined && settings.slideFromY !== undefined
          ? { a: settings.slideFromX, b: settings.slideFromY }
          : getSlideFromCoords(settings.slideDirection ?? 'left');

      return {
        ...shared,
        ...from,
        x: settings.slideToX ?? 0,
        y: settings.slideToY ?? 0,
      };
    }

    const element = call.element ?? adapter.getElement?.();
    const rect = call.origin ? null : element?.getBoundingClientRect();

    const origin =
      (animationType === ThemeAnimationType.SVG_LOGO
        ? getAnimationPosition('center')
        : null) ??
      call.origin ??
      (settings.animationPosition && settings.animationPosition !== 'trigger'
        ? getAnimationPosition(settings.animationPosition)
        : null) ??
      (rect
        ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        : animationType === ThemeAnimationType.CIRCLE ||
            animationType === ThemeAnimationType.BLUR_CIRCLE
          ? null
          : getAnimationPosition('center'));

    if (!origin || !Number.isFinite(origin.x) || !Number.isFinite(origin.y))
      return null;

    return {
      ...shared,
      ...origin,
      clipPathDirection: settings.clipPathDirection ?? 'top-left',
      animationPosition: settings.animationPosition,
      logo:
        settings.logoLight !== undefined
          ? resolveTheme(committedTheme) === 'light'
            ? settings.logoLight
            : settings.logoDark
          : settings.logo,
      logoWidth: settings.logoWidth,
      logoHeight: settings.logoHeight,
      gradientWidth: settings.gradientWidth,
    };
  };

  const animateChange = async (
    update: () => void,
    input?: ThemeTransitionInput
  ) => {
    const config = animationConfig(input);
    const currentLifecycle = lifecycle;

    const commit = () => {
      if (currentLifecycle === lifecycle) update();
    };

    pendingUpdates++;

    try {
      await runThemeTransition(() => {
        if (currentLifecycle !== lifecycle) return;

        return adapter.commit ? adapter.commit(commit) : commit();
      }, config);
    } finally {
      if (currentLifecycle === lifecycle) pendingUpdates--;
    }
  };

  const switchTheme: ThemeController['switchTheme'] = async (theme, input) => {
    validateThemeValue(theme);

    if (!config.themes.includes(theme)) {
      console.warn(`Theme "${theme}" not found in available themes`);

      return;
    }

    if (theme === requestedTheme) return;
    requestedTheme = theme;
    const currentLifecycle = lifecycle;

    try {
      await animateChange(() => commitTheme(theme), input);
    } catch (error) {
      if (currentLifecycle === lifecycle && requestedTheme === theme)
        requestedTheme = committedTheme;
      throw error;
    }
  };

  const switchColorTheme: ThemeController['switchColorTheme'] = async (
    theme,
    input
  ) => {
    if (!config.colorThemes.includes(theme)) {
      console.warn(`Color theme "${theme}" not found in available themes`);

      return;
    }

    if (theme === requestedColorTheme) return;
    requestedColorTheme = theme;
    const currentLifecycle = lifecycle;

    try {
      await animateChange(() => commitColorTheme(theme), input);
    } catch (error) {
      if (currentLifecycle === lifecycle && requestedColorTheme === theme)
        requestedColorTheme = committedColorTheme;
      throw error;
    }
  };

  const dispose = () => {
    lifecycle++;
    pendingUpdates = 0;
    detach?.();
    detach = undefined;
    updateStorageListener = undefined;
    mounted = false;
    publish();
  };

  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => serverSnapshot,
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    mount: () => {
      if (
        mounted ||
        typeof window === 'undefined' ||
        typeof document === 'undefined'
      )
        return dispose;
      mounted = true;

      if (!themeChanged && options.initialTheme === undefined)
        internalTheme = readTheme();

      if (!colorThemeChanged && options.initialColorTheme === undefined)
        internalColorTheme = readColorTheme();
      committedTheme = requestedTheme = options.theme ?? internalTheme;
      committedColorTheme = requestedColorTheme =
        options.colorTheme ?? internalColorTheme;
      systemTheme = getSystemTheme();
      const media = window.matchMedia('(prefers-color-scheme: dark)');

      const onSystemChange = () => {
        systemTheme = getSystemTheme();
        publish();
      };

      const onStorage = (event: StorageEvent) => {
        if (event.storageArea && event.storageArea !== window.localStorage)
          return;
        const themes = config.themes;
        const colorThemes = config.colorThemes;

        if (
          (event.key === null ||
            event.key === (options.storageKey ?? STORAGE_KEY)) &&
          options.theme === undefined
        ) {
          const value = event.newValue ?? config.defaultTheme;

          const theme = themes.find((theme) => theme === value);

          if (theme !== undefined)
            internalTheme = committedTheme = requestedTheme = theme;
        }

        if (
          (event.key === null ||
            event.key === (options.colorStorageKey ?? COLOR_STORAGE_KEY)) &&
          options.colorTheme === undefined
        ) {
          const value = event.newValue ?? config.defaultColorTheme;

          if (colorThemes.includes(value))
            internalColorTheme =
              committedColorTheme =
              requestedColorTheme =
                value;
        }

        publish();
      };

      media.addEventListener('change', onSystemChange);
      updateStorageListener = () => {
        window.removeEventListener('storage', onStorage);

        if (options.storage === undefined)
          window.addEventListener('storage', onStorage);
      };

      updateStorageListener();
      detach = () => {
        media.removeEventListener('change', onSystemChange);
        window.removeEventListener('storage', onStorage);
      };

      injectBaseStyles();
      preload();
      publish();

      return dispose;
    },
    dispose,
    updateOptions: (next) => {
      const previousTheme = snapshot.theme;
      const previousColorTheme = snapshot.colorTheme;
      const updated = { ...options, ...next };
      const { logo, logoLight, logoDark, ...settings } = updated;

      const nextOptions = {
        ...settings,
        ...getThemeLogoOptions({ logo, logoLight, logoDark }),
      };

      const nextConfig = resolveThemeConfig(nextOptions);
      validateStateOptions(nextOptions, nextConfig.colorThemePrefix);

      if (
        !sameValues(config.themes, nextConfig.themes) &&
        !nextConfig.themes.includes(internalTheme)
      )
        internalTheme = nextConfig.defaultTheme;

      if (
        !sameValues(config.colorThemes, nextConfig.colorThemes) &&
        !nextConfig.colorThemes.includes(internalColorTheme)
      )
        internalColorTheme = nextConfig.defaultColorTheme;
      options = nextOptions;
      config = nextConfig;
      publish();

      if (pendingUpdates === 0) {
        if (previousTheme !== snapshot.theme)
          committedTheme = requestedTheme = snapshot.theme;

        if (previousColorTheme !== snapshot.colorTheme)
          committedColorTheme = requestedColorTheme = snapshot.colorTheme;
      }

      if (mounted) {
        preload();
        updateStorageListener?.();
      }
    },
    setTheme: (theme) => {
      commitTheme(theme);
      requestedTheme = theme;
    },
    setColorTheme: (theme) => {
      commitColorTheme(theme);
      requestedColorTheme = theme;
    },
    switchTheme,
    switchColorTheme,
    toggleTheme: (input) => {
      const opposite =
        resolveTheme(requestedTheme) === 'dark' ? 'light' : 'dark';

      const theme = config.themes.includes(opposite)
        ? opposite
        : config.themes[
            (config.themes.indexOf(requestedTheme) + 1) % config.themes.length
          ];

      return switchTheme(theme, input);
    },
    toggleLightTheme: async (input) => {
      if (resolveTheme(requestedTheme) !== 'light')
        await switchTheme('light', input);
    },
    toggleDarkTheme: async (input) => {
      if (resolveTheme(requestedTheme) !== 'dark')
        await switchTheme('dark', input);
    },
    toggleColorTheme: async (input) => {
      const themes = config.colorThemes;

      if (themes.length === 0) return;
      await switchColorTheme(
        themes[(themes.indexOf(requestedColorTheme) + 1) % themes.length],
        transitionInput(input)
      );
    },
    createColorThemeToggle: (theme) => (input) =>
      switchColorTheme(theme, transitionInput(input)),
    isColorThemeActive: (theme) => snapshot.colorTheme === theme,
  };
};
