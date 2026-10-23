# UI Theme · Nuxt

Nuxt 4.6 with Vue 3.5, TypeScript, Tailwind CSS v4, and `uitheme-vue/nuxt`. Use a supported Node runtime: 22.21+, 24.11+, or 26+ within Nuxt's supported ranges.

```sh
pnpm install --frozen-lockfile
pnpm --filter uitheme-vue build
pnpm --filter example-nuxt dev
```

Open http://localhost:4181. This example matches the Vue app's controls, palettes, transitions, and live preview. Nuxt renders the app on the server and restores appearance and palette cookies per request. A head script resolves system appearance before paint. The app does not add a second theme provider.

The shared UI lives in the private `@ui-theme/vue-demo` workspace. Tailwind CSS v4 runs through PostCSS in this example.

```sh
pnpm --filter example-nuxt typecheck
pnpm --filter example-nuxt build
pnpm --filter example-nuxt preview
```

See the [package guide](../../../packages/ui-theme-vue/README.md) for module options and browser checks.
