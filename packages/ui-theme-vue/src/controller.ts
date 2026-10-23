import { computed, nextTick, readonly, shallowRef } from 'vue';
import {
  getThemeLogoOptions,
  injectBaseStyles,
  preloadThemeLogo,
  runThemeTransition,
  type Theme,
} from './core';
import { normalizeConfig } from './config';
import { applyTheme, browserStorage, readValue, writeValue } from './browser';
import type { UIThemeOptions } from './types';

export function createThemeController(options: UIThemeOptions = {}) {
  const config = normalizeConfig(options);
  getThemeLogoOptions(options);
  const theme = shallowRef<Theme>(config.defaultTheme);
  const colorTheme = shallowRef(config.defaultColorTheme);
  const systemDark = shallowRef(false);
  const mounted = shallowRef(false);

  const resolvedTheme = computed(() =>
    theme.value === 'system'
      ? systemDark.value
        ? 'dark'
        : 'light'
      : theme.value
  );

  let requestedTheme = theme.value;
  let requestedColorTheme = colorTheme.value;
  let dispose = () => {};

  let active = true;
  const storage = options.storage ?? browserStorage();

  const apply = () => {
    if (mounted.value)
      applyTheme(config, theme.value, colorTheme.value, systemDark.value);
  };

  function commitTheme(value: Theme, persist = true) {
    theme.value = value;
    apply();

    if (persist) {
      writeValue(storage, config.storageKey, value);
      options.onThemeChange?.(value);
    }
  }

  function commitColorTheme(value: string, persist = true) {
    colorTheme.value = value;
    apply();

    if (persist) {
      writeValue(storage, config.colorStorageKey, value);
      options.onColorThemeChange?.(value);
    }
  }

  function mount() {
    if (mounted.value || !active || typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    systemDark.value = media.matches;

    const storedTheme = config.themes.find(
      (value) => value === readValue(storage, config.storageKey)
    );

    const storedPalette = readValue(storage, config.colorStorageKey);

    if (storedTheme) theme.value = storedTheme;

    if (storedPalette && config.colorThemes.includes(storedPalette))
      colorTheme.value = storedPalette;
    requestedTheme = theme.value;
    requestedColorTheme = colorTheme.value;
    mounted.value = true;
    injectBaseStyles();
    apply();

    const onSystemChange = () => {
      systemDark.value = media.matches;
      apply();
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === config.storageKey) {
        const value = readValue(storage, config.storageKey);

        const next =
          config.themes.find((theme) => theme === value) ?? config.defaultTheme;

        requestedTheme = next;
        void runThemeTransition(() => commitTheme(next, false), null);
      }

      if (event.key === null || event.key === config.colorStorageKey) {
        const value = readValue(storage, config.colorStorageKey);

        const next =
          value && config.colorThemes.includes(value)
            ? value
            : config.defaultColorTheme;

        requestedColorTheme = next;
        void runThemeTransition(() => commitColorTheme(next, false), null);
      }
    };

    media.addEventListener('change', onSystemChange);

    if (options.storage === undefined)
      window.addEventListener('storage', onStorage);

    for (const logo of [options.logo, options.logoLight, options.logoDark])
      if (logo) void preloadThemeLogo(logo);
    dispose = () => {
      media.removeEventListener('change', onSystemChange);
      window.removeEventListener('storage', onStorage);
      mounted.value = false;
    };
  }

  async function transition(
    update: () => void,
    animation: Parameters<typeof runThemeTransition>[1]
  ) {
    let flushed = Promise.resolve();
    await runThemeTransition(() => {
      update();
      flushed = nextTick();
      void flushed.catch(() => {});

      return flushed;
    }, animation);
    await flushed;
  }

  async function changeTheme(
    value: Theme,
    animation: Parameters<typeof runThemeTransition>[1] = null
  ) {
    if (!config.themes.includes(value))
      throw new Error(`Unknown theme: ${value}`);

    if (value === requestedTheme || !active) return;
    requestedTheme = value;

    try {
      await transition(() => {
        if (active) commitTheme(value);
      }, animation);
    } catch (error) {
      requestedTheme = theme.value;
      throw error;
    }
  }

  async function changeColorTheme(
    value: string,
    animation: Parameters<typeof runThemeTransition>[1] = null
  ) {
    if (!config.colorThemes.includes(value))
      throw new Error(`Unknown color theme: ${value}`);

    if (value === requestedColorTheme || !active) return;
    requestedColorTheme = value;

    try {
      await transition(() => {
        if (active) commitColorTheme(value);
      }, animation);
    } catch (error) {
      requestedColorTheme = colorTheme.value;
      throw error;
    }
  }

  return {
    config,
    options,
    theme: readonly(theme),
    colorTheme: readonly(colorTheme),
    resolvedTheme,
    mounted: readonly(mounted),
    mount,
    dispose: () => {
      active = false;
      dispose();
    },
    changeTheme,
    changeColorTheme,
    nextTheme: () => {
      const resolved =
        requestedTheme === 'system'
          ? systemDark.value
            ? 'dark'
            : 'light'
          : requestedTheme;

      const opposite = resolved === 'dark' ? 'light' : 'dark';

      return config.themes.includes(opposite)
        ? opposite
        : (config.themes.find((value) => value !== requestedTheme) ??
            requestedTheme);
    },
    nextColorTheme: () =>
      config.colorThemes[
        (config.colorThemes.indexOf(requestedColorTheme) + 1) %
          config.colorThemes.length
      ],
  };
}

export type ThemeController = ReturnType<typeof createThemeController>;
