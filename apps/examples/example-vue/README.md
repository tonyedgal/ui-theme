# UI Theme · Vue

Vue 3.5 with Vite, TypeScript, Tailwind CSS v4, and `uitheme-web/vue`.

```sh
pnpm install --frozen-lockfile
pnpm --filter uitheme-web build
pnpm --filter example-vue dev
```

Open http://localhost:4180. The app uses `createUITheme` and a head script for local-storage restoration before paint. It includes appearance controls, six original web palettes, all seven transitions, origin/direction/duration settings, and a live component preview.

The UI and CSS live in the private `@ui-theme/vue-demo` workspace, shared with the Nuxt example. The palettes copy the token blocks from `example-next/app/globals.css`.

The shared demo keeps its Reka controls in `src/components/ui`. The controls use `uitheme-web/vue` for theme state and actions.

Use `pnpm --filter example-vue build` to check types and create the production build. See the [package guide](../../../packages/ui-theme/README.md) for the public API and browser checks.

Build both examples, then run the production Vue/Nuxt acceptance suite:

```sh
pnpm --filter example-vue build
pnpm --filter example-nuxt build
pnpm --filter uitheme-web exec playwright test --config playwright.vue.config.ts
```
