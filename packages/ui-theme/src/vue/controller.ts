import { computed, nextTick, shallowRef } from 'vue';
import { createThemeController } from 'uitheme-web/core';
import type { ThemeControllerOptions } from '../core/controller';
import { normalizeConfig } from './config';
import type { UIThemeOptions } from './types';

function controllerOptions(options: UIThemeOptions): ThemeControllerOptions {
  const config = normalizeConfig(options);

  return {
    ...options,
    ...config,
  };
}

export function createVueThemeController(options: UIThemeOptions = {}) {
  let previousOptions = { ...options };

  const controller = createThemeController(controllerOptions(options), {
    onBrowserStorageError: () => {},
    commit: async (update) => {
      update();
      await nextTick();
    },
  });

  const snapshot = shallowRef(controller.getServerSnapshot());

  const unsubscribe = controller.subscribe(() => {
    snapshot.value = controller.getSnapshot();
  });

  return {
    controller,
    theme: computed(() => snapshot.value.theme),
    colorTheme: computed(() => snapshot.value.colorTheme),
    resolvedTheme: computed(() => snapshot.value.resolvedTheme),
    mounted: computed(() => snapshot.value.mounted),
    get themes() {
      return snapshot.value.themes;
    },
    get colorThemes() {
      return snapshot.value.colorThemes;
    },
    mount: () => {
      controller.mount();
      snapshot.value = controller.getSnapshot();
    },
    updateOptions: (options: UIThemeOptions) => {
      const removed = Object.fromEntries(
        Object.keys(previousOptions)
          .filter((key) => !(key in options))
          .map((key) => [key, undefined])
      );

      controller.updateOptions({ ...removed, ...controllerOptions(options) });
      previousOptions = { ...options };
    },
    dispose: () => {
      controller.dispose();
      unsubscribe();
    },
  };
}

export type VueThemeController = ReturnType<typeof createVueThemeController>;
