---
'uitheme-cli': minor
---

`init` now checks for an existing theme setup before it adds the provider, and acts on what it finds:

- `next-themes` in a React app (Next.js, TanStack Start, Vite React): `init` rewrites the `ThemeProvider` and every `useTheme` import, then removes `next-themes` with the app's package manager. `disableTransitionOnChange` is kept.
- The shadcn theme provider for Vite or TanStack Start: `init` rewrites `components/theme-provider.tsx` on top of UI-Theme. It keeps the exports and the storage key, so call sites and saved preferences stay unchanged.
- A UI-Theme provider that does not fit the framework, or a wrapper from an earlier `init`: `init` upgrades it in place.
- UI-Theme 1 (`@ui-theme/web`, `uitheme-vue`): `init` asks you to run `uitheme migrate` first.
- Another theme library (for example `@nuxtjs/color-mode`, `remix-themes`, `useDark` from `@vueuse/core`), a custom theme provider, or more than one setup: `init` changes no theme file. It writes the CSS, `uitheme.json` and the `cn` utility, prints each signal with its file and line, and exits with code 2.

The `--existing <convert|alongside|manual>` option chooses without a prompt. `alongside` is available only for a custom provider: it writes the UI-Theme provider file but does not mount it. Without the option, `init` asks one question that names the setup and the file and offers only the valid choices. With `--yes`, without a terminal, or with `--dry-run`, `init` converts when a converter applies. A conversion that cannot run changes no theme file and ends with manual steps and exit code 2. `--dry-run` prints the setup, the evidence and the planned action. Manual steps link to the docs instead of printing provider code.
