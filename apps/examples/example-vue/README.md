# UI Theme · Vue

Vue 3.5 with Vite, TypeScript, Tailwind CSS v4, and `uitheme-vue`.

```sh
pnpm install --frozen-lockfile
pnpm --filter uitheme-vue build
pnpm --filter example-vue dev
```

Open http://localhost:4180. The app uses `createUITheme` and a head script for local-storage restoration before paint. It includes appearance controls, six original web palettes, all seven transitions, origin/direction/duration settings, and a live component preview.

The UI and CSS live in the private `@ui-theme/vue-demo` workspace, shared with the Nuxt example. The palettes copy the token blocks from `example-next/app/globals.css`.

Use `pnpm --filter example-vue build` to check types and create the production build. See the [package guide](../../../packages/ui-theme-vue/README.md) for the public API and browser checks.
