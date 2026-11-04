import {
  inject,
  onMounted,
  shallowRef,
  toValue,
  watch,
  type App,
  type InjectionKey,
} from 'vue';
import { preloadThemeLogo } from 'uitheme-web/core';
import type { Theme } from '../core/types';
import {
  createVueThemeController,
  type VueThemeController,
} from './controller';
import type {
  ReactiveTransitionOptions,
  ThemeTrigger,
  UIThemeOptions,
} from './types';

export const themeKey: InjectionKey<VueThemeController> =
  Symbol('uitheme-web/vue');

export function createUITheme(options: UIThemeOptions = {}) {
  return {
    install(app: App) {
      const instance = createVueThemeController(options);
      app.provide(themeKey, instance);
      app.onUnmount(instance.dispose);
    },
  };
}

export function useUITheme(settings: ReactiveTransitionOptions = {}) {
  const instance = inject(themeKey);

  if (!instance)
    throw new Error(
      'useUITheme requires app.use(createUITheme()) or UIThemeProvider.'
    );
  const { controller } = instance;
  const ref = shallowRef<HTMLElement | null>(null);
  onMounted(() => {
    instance.mount();
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

  const inputOptions = (input?: ThemeTrigger) => {
    const trigger =
      input === true || input === false
        ? { animationOff: input }
        : input && 'currentTarget' in input
          ? {
              element:
                input.currentTarget instanceof Element
                  ? input.currentTarget
                  : null,
              animationOff: input.detail === 0,
            }
          : input;

    return { ...toValue(settings), element: ref.value, ...trigger };
  };

  const switchTheme = (theme: Theme, input?: ThemeTrigger) =>
    controller.switchTheme(theme, inputOptions(input));

  const switchColorTheme = (theme: string, input?: ThemeTrigger) =>
    controller.switchColorTheme(theme, inputOptions(input));

  return {
    ref,
    theme: instance.theme,
    resolvedTheme: instance.resolvedTheme,
    colorTheme: instance.colorTheme,
    mounted: instance.mounted,
    get themes() {
      return instance.themes;
    },
    get colorThemes() {
      return instance.colorThemes;
    },
    setTheme: controller.setTheme,
    setColorTheme: controller.setColorTheme,
    switchTheme,
    switchColorTheme,
    toggleTheme: (input?: ThemeTrigger) =>
      controller.toggleTheme(inputOptions(input)),
    toggleLightTheme: (input?: ThemeTrigger) =>
      controller.toggleLightTheme(inputOptions(input)),
    toggleDarkTheme: (input?: ThemeTrigger) =>
      controller.toggleDarkTheme(inputOptions(input)),
    toggleColorTheme: (input?: ThemeTrigger) =>
      controller.toggleColorTheme(inputOptions(input)),
    createColorThemeToggle: (theme: string) => (input?: ThemeTrigger) =>
      switchColorTheme(theme, input),
    isColorThemeActive: (theme: string) => instance.colorTheme.value === theme,
  };
}

export const useTheme = useUITheme;
