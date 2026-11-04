import {
  addComponent,
  addImports,
  addPluginTemplate,
  defineNuxtModule,
} from 'nuxt/kit';
import type { NuxtModule } from 'nuxt/schema';
import type { ThemeLogoOptions } from './core/types';
import { normalizeConfig } from './vue/config';
import type { UIThemeOptions } from './vue/types';

export type ModuleOptions = Omit<
  UIThemeOptions,
  | 'storage'
  | 'onThemeChange'
  | 'onColorThemeChange'
  | 'logo'
  | 'logoLight'
  | 'logoDark'
> &
  ThemeLogoOptions;

const themeModule: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'uitheme-web',
    configKey: 'uiTheme',
    compatibility: { nuxt: '^4.0.0' },
  },
  defaults: { defaultTheme: 'system' },
  setup(options) {
    normalizeConfig(options);
    const serialized = JSON.stringify(options).replace(/</g, '\\u003c');
    addImports([
      { name: 'useUITheme', from: 'uitheme-web/vue' },
      { name: 'useTheme', as: 'useVueTheme', from: 'uitheme-web/vue' },
    ]);

    addComponent({
      name: 'UIThemeProvider',
      export: 'UIThemeProvider',
      filePath: 'uitheme-web/vue',
    });

    addPluginTemplate({
      filename: 'uitheme-web.plugin.mjs',
      getContents: () => `
import { defineNuxtPlugin, useCookie, useHead } from '#imports';
import { createUITheme } from 'uitheme-web/vue';
import { getThemeScript } from 'uitheme-web/vue/bootstrap';

export default defineNuxtPlugin({
  name: 'uitheme-web',
  setup(nuxtApp) {
    const options = ${serialized};
    const themes = options.themes ?? ['light', 'dark', 'system'];
    const palettes = options.colorThemes ?? ['default'];
    const themeKey = options.storageKey ?? 'theme';
    const paletteKey = options.colorStorageKey ?? 'color-theme';
    const cookieOptions = { path: '/', sameSite: 'lax', maxAge: 31536000 };
    const theme = useCookie(themeKey, cookieOptions);
    const palette = useCookie(paletteKey, cookieOptions);
    const initialTheme = themes.includes(theme.value) ? theme.value : options.defaultTheme ?? 'system';
    const initialPalette = palettes.includes(palette.value) ? palette.value : options.defaultColorTheme ?? palettes[0];
    const initial = { ...options, defaultTheme: initialTheme, defaultColorTheme: initialPalette, storage: false };
    if (import.meta.server) {
      useHead({
        htmlAttrs: { class: [initialTheme === 'dark' ? options.globalClassName ?? 'dark' : '', (options.colorThemePrefix ?? 'theme-') + initialPalette].filter(Boolean).join(' ') },
        script: [{ key: 'uitheme-web', innerHTML: getThemeScript(initial), tagPosition: 'head', tagPriority: 'critical' }],
      });
    }
    nuxtApp.vueApp.use(createUITheme({
      ...initial,
      storage: {
        getItem: key => key === themeKey ? theme.value ?? null : palette.value ?? null,
        setItem: (key, value) => { if (key === themeKey) theme.value = value; else palette.value = value; },
      },
    }));
  },
});`,
    });
  },
});

export default themeModule;
