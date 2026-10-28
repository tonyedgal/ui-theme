# uitheme-web

Theme state and animated appearance and color transitions for web applications.
The runtime has no mandatory framework or UI primitive dependencies.

```sh
pnpm add uitheme-web
```

Install the framework in your app. Import only the adapter you use.

| Import                              | Purpose                                                         |
| ----------------------------------- | --------------------------------------------------------------- |
| `uitheme-web` or `uitheme-web/core` | Framework-neutral controller, transitions, types, and constants |
| `uitheme-web/react`                 | React providers and hooks                                       |
| `uitheme-web/next`                  | Next.js client provider                                         |
| `uitheme-web/next/server`           | Server-safe pre-hydration script generator                      |
| `uitheme-web/tanstack`              | Stateless TanStack Start server helpers                         |
| `uitheme-web/vue`                   | Vue 3.5 plugin, provider, and composables                       |
| `uitheme-web/vue/bootstrap`         | Server-safe pre-hydration script generator                      |
| `uitheme-web/nuxt`                  | Nuxt 4 module                                                   |

Core and React support ESM and CommonJS. Vue and Nuxt use ESM. React, React DOM,
Vue, and Nuxt are optional peer dependencies. The selected adapter requires its
framework in the app. Importing the core does not load a framework.

## React

```tsx
'use client';

import { UIThemeProvider, useUITheme } from 'uitheme-web/react';

function Toggle() {
  const { resolvedTheme, switchTheme, mounted } = useUITheme();

  return (
    <button
      disabled={!mounted}
      onClick={(event) =>
        void switchTheme(resolvedTheme === 'dark' ? 'light' : 'dark', {
          element: event.currentTarget,
        })
      }
    >
      Change appearance
    </button>
  );
}

export function App() {
  return (
    <UIThemeProvider>
      <Toggle />
    </UIThemeProvider>
  );
}
```

For Next.js, use `NextUIThemeProvider` from `uitheme-web/next`. It provides
pre-hydration setup and accepts a CSP nonce. For TanStack Start, retain your
existing server helpers and cookie callbacks. Each provider shares state with
`useUITheme` from `uitheme-web/react`.

## Vue

```ts
import { createApp } from 'vue';
import { createUITheme } from 'uitheme-web/vue';
import App from './App.vue';

createApp(App)
  .use(createUITheme({ colorThemes: ['default', 'ocean'] }))
  .mount('#app');
```

Use `useUITheme()` in setup. It returns readonly `theme`, `resolvedTheme`,
`colorTheme`, and `mounted` refs, plus `setTheme`, `setColorTheme`, `switchTheme`,
and `switchColorTheme`. `UIThemeProvider` can provide an isolated nested scope.
Use `getThemeScript` from `uitheme-web/vue/bootstrap` in SSR document setup.

For Nuxt 4:

```ts
export default defineNuxtConfig({
  modules: ['uitheme-web/nuxt'],
  uiTheme: { colorThemes: ['default', 'ocean'] },
});
```

The module provides composables, cookie persistence, and initial theme setup.
It does not register styled controls. Automatic Nuxt 3 setup is unsupported.

## State and styles

`theme` is `light`, `dark`, or `system`. `colorTheme` is a separate palette key.
Configure your CSS for the `dark` class and `theme-<palette>` classes. The runtime
does not supply a design system or require Tailwind. Immediate `set*` actions
change state without animation. Await `switch*` actions for animated changes.
Pass the clicked element for a transition origin in viewport CSS pixels.

The runtime respects reduced motion and falls back when browser View Transitions
are unavailable. Keep provider instances stable. Each provider owns its state;
server requests do not share a global theme store.

## Optional styled controls

Controls are editable app source. They are not runtime exports.

```sh
npx uitheme-cli init --dry-run
npx uitheme-cli init
npx uitheme-cli add theme-toggle appearance-selector color-theme-selector transition-settings
```

The CLI requires an existing Tailwind 3.4 or 4 app. Choose Base UI or Radix for
React, or Reka for Vue. The installer adds only the chosen controls and their
required dependencies. Customize local files, root classes, and internal part
classes. Keep transition settings in your app and pass them to the provider.

## Migration from v1

This is the v2 API. Packaged `UIThemeSwitcher`, `UIThemeSelector`, select
primitives, and their prop types have moved out of the runtime. The old runtime
binary has moved to `uitheme-cli`.

Run `npx uitheme-cli migrate --dry-run` to inspect supported import changes.
For old styled controls, upgrade the runtime to `^2.0.0` on a migration branch,
install the local controls, then review the migration preview. The app can have
unresolved imports until the migration is complete. Custom props and unknown
provider wiring require manual changes. `--yes` never accepts edited controls
as verified replacements.

Replace `uitheme-vue` with `uitheme-web/vue`, `uitheme-vue/bootstrap` with
`uitheme-web/vue/bootstrap`, and `uitheme-vue/nuxt` with `uitheme-web/nuxt`.
The published Vue v1 package remains available. No bridge release is required.

See the [documentation](https://www.ui-theme.dev/docs) for integration guides.
