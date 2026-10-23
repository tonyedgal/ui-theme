# uitheme-vue

Vue 3.5+ theme switching for appearance (`light`, `dark`, `system`) and named color palettes. Includes a Nuxt 4 module, accessible native selects, and all seven UI-Theme web transitions. This is an unpublished alpha package in the monorepo.

## Vue

```ts
import { createApp } from 'vue';
import { createUITheme } from 'uitheme-vue';
import App from './App.vue';

createApp(App)
  .use(
    createUITheme({
      defaultTheme: 'system',
      colorThemes: ['default', 'caffeine', 'mocha'],
    })
  )
  .mount('#app');
```

```vue
<script setup lang="ts">
import { UIThemeSwitcher, UIThemeSelector, useUITheme } from 'uitheme-vue';

const { theme, colorTheme, mounted, toggleTheme, createColorThemeToggle } =
  useUITheme();
</script>

<template>
  <UIThemeSwitcher />
  <UIThemeSelector />
  <button :disabled="!mounted" @click="toggleTheme($event)">
    Change appearance
  </button>
  <button :disabled="!mounted" @click="createColorThemeToggle('mocha')($event)">
    Mocha
  </button>
  <p>{{ theme }} / {{ colorTheme }}</p>
</template>
```

The plugin creates one state owner. Each composable and control consumes that owner. `useTheme` is an alias for `useUITheme`. Missing a provider throws a clear error; consumers do not silently create independent theme state.

For component-owned setup, wrap descendants in `<UIThemeProvider :options="options">`. Options initialize the provider once. Use one document theme owner at the app root: all themes apply to `<html>`, rather than an isolated subtree.

## CSS and Tailwind v4

The package controls classes; your application owns the CSS. A dark appearance adds `.dark`. A palette adds `.theme-<name>`, including `.theme-default`. The package preserves other root classes. Configure `globalClassName` and `colorThemePrefix` for other conventions.

```css
@import 'tailwindcss';
@custom-variant dark (&:where(.dark, .dark *));

:root {
  --background: white;
  --foreground: #171717;
  --primary: #34a85a;
}
.dark {
  --background: #171717;
  --foreground: white;
}
.theme-mocha {
  --primary: #a37764;
}
.theme-mocha.dark {
  --primary: #c39e88;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
}
```

The two examples use the actual six palettes from `apps/examples/example-next/app/globals.css`. The shared example UI lives in the private `@ui-theme/vue-demo` workspace.

## Transitions

```vue
<script setup lang="ts">
import { shallowRef } from 'vue';
import { useUITheme, ThemeAnimationType } from 'uitheme-vue';

const duration = shallowRef(600);
const {
  ref: trigger,
  toggleTheme,
  switchColorTheme,
} = useUITheme(() => ({
  animationType: ThemeAnimationType.CIRCLE,
  duration: duration.value,
  animationPosition: 'trigger',
}));
</script>

<template>
  <button ref="trigger" @click="toggleTheme($event)">Preview</button>
  <button @click="switchColorTheme('mocha', $event)">Mocha</button>
</template>
```

Use a ref, computed value, or getter to update transition settings reactively. Settings supplied to a composable affect that composable's actions. Set plugin options for app-wide defaults.

`ThemeAnimationType` includes `CIRCLE`, `BLUR_CIRCLE`, `SLIDE`, `CLIP_PATH`, `POLYGON_GRADIENT`, `TRIANGLE`, and `SVG_LOGO`. Options include `duration`, `easing`, `blurAmount`, `slideDirection`, `slideFromX/Y`, `slideToX/Y`, `animationPosition`, `clipPathDirection`, and `gradientWidth`.

Use one `logo` or both `logoLight` and `logoDark` with `SVG_LOGO`. Both themed assets are required. Set `logoWidth`/`logoHeight` to a number or `'auto'`. The composable preloads its assets on mount and when the assets change. Missing or undecodable logos fall back to a circle.

Origins use viewport CSS pixels. Pointer events use the triggering element. Keyboard activation, reduced motion, a zero duration, and unavailable View Transitions apply the change without animation. Pending requests retain their order; the newest request controls the visible transition. Vue updates finish before the new snapshot is captured.

| Action                                                 | Behavior                                   |
| ------------------------------------------------------ | ------------------------------------------ |
| `setTheme(theme)`                                      | Change appearance without animation        |
| `setColorTheme(name)`                                  | Change palette without animation           |
| `switchTheme(theme, input?)`                           | Animate appearance                         |
| `switchColorTheme(name, input?)`                       | Animate palette                            |
| `toggleTheme(input?)`                                  | Toggle the requested light/dark appearance |
| `toggleLightTheme(input?)` / `toggleDarkTheme(input?)` | Select an explicit appearance              |
| `toggleColorTheme(input?)`                             | Cycle the configured palettes              |
| `createColorThemeToggle(name)`                         | Create a palette event handler             |
| `isColorThemeActive(name)`                             | Check the active palette                   |

Transition inputs accept `true` to disable motion, or `{ element, origin, animationOff }`. Event handlers also accept a `MouseEvent`. If the opposite appearance is unavailable, toggling chooses another configured appearance. A single appearance makes toggling a no-op. Switcher subsets exclude unavailable appearances and show a placeholder when the current mode is excluded. Unknown themes reject the action. Catch errors when calling these methods with external data.

The returned `theme`, `colorTheme`, `resolvedTheme`, and `mounted` refs are readonly. `themes` and `colorThemes` are readonly arrays. Use actions to change state.

## Persistence and first paint

Vue uses local storage by default, under `theme` and `color-theme`. Storage failures do not prevent switching. Local-storage changes synchronize other open tabs. System appearance stays reactive without replacing the user's `system` preference. Listeners are removed when the app or provider unmounts.

Use `storage: false` to disable persistence, or supply a `ThemeStorage` adapter with `getItem` and `setItem`. Custom adapters own synchronization. `onThemeChange` and `onColorThemeChange` run for committed user changes.

For a Vite app, inject `getThemeScript(options)` from `uitheme-vue/bootstrap` into the document head before the application renders. Use the same class, palette, and storage options as the plugin. The Vue example shows a `transformIndexHtml` integration. The returned value is script text, not an HTML tag. Add the application's CSP nonce to the script element when required.

SSR initially renders configured defaults. Wait for `mounted` before rendering text or icons that depend on the client system appearance. Do not read storage or create a shared theme instance at module scope on the server.

## Nuxt 4

```ts
export default defineNuxtConfig({
  modules: ['uitheme-vue/nuxt'],
  uiTheme: {
    defaultTheme: 'system',
    colorThemes: ['default', 'caffeine', 'mocha'],
  },
});
```

The module auto-imports `useUITheme` and `useVueTheme` and registers `UIThemeProvider`, `UIThemeSwitcher`, and `UIThemeSelector`. It creates a plugin for each Nuxt app/request, validates cookies, sets the server HTML classes, and injects a blocking theme script in the head. The browser resolves system appearance before paint. State starts from the same cookie values on the server and client, then resolves system appearance after hydration.

Nuxt stores preferences in cookies under `storageKey` and `colorStorageKey` (`theme` and `color-theme` by default). Cookies use path `/`, `SameSite=Lax`, and a one-year lifetime. Cookie persistence replaces local storage for this integration. Do not add a second provider around the root example. The example uses Nuxt 4.6.2; use Node 22.21+, Node 24.11+, or Node 26+ within Nuxt's supported version ranges.

## Monorepo commands

```sh
pnpm install --frozen-lockfile
pnpm --filter uitheme-vue build
pnpm --filter example-vue dev
pnpm --filter example-nuxt dev
```

The Vue app uses port 4180. The Nuxt app uses port 4181.

```sh
pnpm --filter uitheme-vue typecheck
pnpm --filter example-vue build
pnpm --filter example-nuxt build
pnpm --filter example-nuxt typecheck
pnpm --filter uitheme-vue test:package
pnpm --filter uitheme-vue exec playwright install chromium webkit
pnpm --filter uitheme-vue test:browser
```

Browser checks use production builds of both examples. The checks save screenshots and a report under `test-results/` and `playwright-report/`. The package check extracts a tarball and checks ESM imports, server rendering, request isolation, script serialization, and consumer declarations.

The ESM build bundles the existing framework-neutral web core at build time. Consumers do not import repository source paths or require React. Turbo tracks changes to the shared core as package build inputs. Declarations include the internal shared core types inside the tarball.

## References

- [Vue SSR and request isolation](https://vuejs.org/guide/scaling-up/ssr)
- [Vue provide/inject](https://vuejs.org/guide/components/provide-inject)
- [Nuxt hydration](https://nuxt.com/docs/4.x/guide/best-practices/hydration)
- [Nuxt module plugins](https://nuxt.com/docs/4.x/api/kit/plugins)
- [View Transitions](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition)

Browser regression checks start fresh production servers on ports 4280–4282.
These checks do not reuse development demos on ports 4180–4181.
