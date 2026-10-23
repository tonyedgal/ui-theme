import {
  inject,
  onMounted,
  shallowRef,
  toValue,
  watch,
  type App,
  type InjectionKey,
} from 'vue';
import { createThemeController, type ThemeController } from './controller';
import { animationConfig } from './animation';
import type {
  ReactiveTransitionOptions,
  ThemeTrigger,
  UIThemeOptions,
} from './types';
import { getThemeLogoOptions, preloadThemeLogo, type Theme } from './core';

export const themeKey: InjectionKey<ThemeController> = Symbol('uitheme-vue');

export function createUITheme(options: UIThemeOptions = {}) {
  const controller = createThemeController(options);

  return {
    install(app: App) {
      app.provide(themeKey, controller);
      app.onUnmount(controller.dispose);
    },
  };
}

export function useUITheme(settings: ReactiveTransitionOptions = {}) {
  const controller = inject(themeKey);

  if (!controller)
    throw new Error(
      'useUITheme requires app.use(createUITheme()) or UIThemeProvider.'
    );
  onMounted(() => {
    controller.mount();
    watch(
      () => {
        const current = toValue(settings);

        return [current.logo, current.logoLight, current.logoDark];
      },
      (assets) => {
        for (const asset of assets) if (asset) void preloadThemeLogo(asset);
      },
      { immediate: true }
    );
  });
  const ref = shallowRef<HTMLElement | null>(null);

  const config = (input?: ThemeTrigger) => {
    const overrides = toValue(settings);

    const logos = getThemeLogoOptions(
      overrides.logo !== undefined ||
        overrides.logoLight !== undefined ||
        overrides.logoDark !== undefined
        ? overrides
        : controller.options
    );

    return animationConfig(
      {
        ...controller.options,
        ...overrides,
        logo: undefined,
        logoLight: undefined,
        logoDark: undefined,
        ...logos,
      },
      input,
      ref.value,
      controller.resolvedTheme.value
    );
  };

  const switchTheme = (value: Theme, input?: ThemeTrigger) =>
    controller.changeTheme(value, config(input));

  const switchColorTheme = (value: string, input?: ThemeTrigger) =>
    controller.changeColorTheme(value, config(input));

  return {
    ref,
    theme: controller.theme,
    colorTheme: controller.colorTheme,
    resolvedTheme: controller.resolvedTheme,
    mounted: controller.mounted,
    themes: Object.freeze(controller.config.themes),
    colorThemes: Object.freeze(controller.config.colorThemes),
    setTheme: (value: Theme) => controller.changeTheme(value),
    setColorTheme: (value: string) => controller.changeColorTheme(value),
    switchTheme,
    switchColorTheme,
    toggleTheme: (input?: ThemeTrigger) =>
      switchTheme(controller.nextTheme(), input),
    toggleLightTheme: (input?: ThemeTrigger) => switchTheme('light', input),
    toggleDarkTheme: (input?: ThemeTrigger) => switchTheme('dark', input),
    toggleColorTheme: (input?: ThemeTrigger) =>
      switchColorTheme(controller.nextColorTheme(), input),
    createColorThemeToggle: (value: string) => (input?: ThemeTrigger) =>
      switchColorTheme(value, input),
    isColorThemeActive: (value: string) =>
      controller.colorTheme.value === value,
  };
}

export const useTheme = useUITheme;
