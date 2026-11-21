# uitheme-cli

## 1.2.1

### Patch Changes

- c56cc32: Link each package to its documentation and issue tracker on npm. Update the package descriptions and search keywords. Remove the Angular and Svelte keywords until UI-Theme supports those frameworks.

## 1.2.0

### Minor Changes

- 901398d: Add UI SDK as a React and Vue component base. Select it with `--base ui-sdk`, or install `@ui-sdk/react` or `@ui-sdk/vue` and the CLI detects it. Vue projects keep `reka` as the default base. UI SDK needs React 19 for React: the CLI stops before it writes a file when the app has an older React. `init` and `add` declare `@layer ui-sdk;` at the top of the app's global stylesheet.

## 1.1.0

### Minor Changes

- 500b56a: `init` now checks for an existing theme setup before it adds the provider, and acts on what it finds:

  - `next-themes` in a React app (Next.js, TanStack Start, Vite React): `init` rewrites the `ThemeProvider` and every `useTheme` import, then removes `next-themes` with the app's package manager. `disableTransitionOnChange` is kept.
  - The shadcn theme provider for Vite or TanStack Start: `init` rewrites `components/theme-provider.tsx` on top of UI-Theme. It keeps the exports and the storage key, so call sites and saved preferences stay unchanged.
  - A UI-Theme provider that does not fit the framework, or a wrapper from an earlier `init`: `init` upgrades it in place.
  - UI-Theme 1 (`@ui-theme/web`, `uitheme-vue`): `init` asks you to run `uitheme migrate` first.
  - Another theme library (for example `@nuxtjs/color-mode`, `remix-themes`, `useDark` from `@vueuse/core`), a custom theme provider, or more than one setup: `init` changes no theme file. It writes the CSS, `uitheme.json` and the `cn` utility, prints each signal with its file and line, and exits with code 2.

  The `--existing <convert|alongside|manual>` option chooses without a prompt. `alongside` is available only for a custom provider: it writes the UI-Theme provider file but does not mount it. Without the option, `init` asks one question that names the setup and the file and offers only the valid choices. With `--yes`, without a terminal, or with `--dry-run`, `init` converts when a converter applies. A conversion that cannot run changes no theme file and ends with manual steps and exit code 2. `--dry-run` prints the setup, the evidence and the planned action. Manual steps link to the docs instead of printing provider code.

### Patch Changes

- 8d2e99b: `init` now sets up TanStack Start with `TanStackUIThemeProvider` instead of `UIThemeProvider`. The generated `theme-provider.tsx` also exports `ThemeScript`, which renders `TanStackStartThemeScript`. `init` adds `<ThemeScript />` to the document head. In Next.js and TanStack Start, `init` adds `suppressHydrationWarning` to `<html>`, so the theme script does not cause a hydration warning. When `init` replaces `next-themes` in a TanStack Start app, it uses `TanStackUIThemeProvider` and `useTanStackUITheme`, and it asks you to add `TanStackStartThemeScript` to the head. Vite React apps keep `UIThemeProvider`.

## 1.0.2

### Patch Changes

- 336771c: Write each file through a temporary file and a rename. An interrupted run no longer leaves a partly written file.
- 3976a0b: Remove the `typescript` dependency. The install is about 1.5 MB instead of about 25 MB.

  The check for an existing `cn` export is now syntactic. The CLI reads the utils file and follows its re-exports, including re-exports from a workspace package. It reads ES module and CommonJS exports. It no longer type-checks the file, so it no longer needs the project's dependencies installed. It accepts `cn` when it is a function, or a value that it cannot prove is not callable. It rejects a missing `cn`, a type-only `cn`, and a `cn` set to a string, number, object, array or class.

- 336771c: Start faster. `--help` and `--version` no longer load TypeScript or PostCSS, and the package no longer ships a source map.
- 336771c: Name the URL and the cause when the CLI cannot reach the registry, for example `Registry request failed (ECONNREFUSED): <url>`.
- 968b0f8: Report a destination file that another program has open as one clear line, treat a `uitheme.json` that differs only by a byte order mark as unchanged, and show a fitting path example in the `uitheme.json` validation message for each field.
- e195f55: Fix `add` and the other commands on Windows. The CLI no longer builds a component folder named `src\*\components\ui` from a `@/*` path alias, and it checks every path with the separators of the platform. A busy file no longer stops a write, `uitheme.json` can start with a byte order mark, and a bad `uitheme.json` field now says what to change.

## 1.0.1

### Patch Changes

- 302f48d: The CLI now rejects a registry item that asks for `uitheme-web` from a URL or another source that is not a version, a dist-tag or a local `.tgz` file.
- 2b16548: The CLI now starts npm, pnpm and Yarn correctly on Windows when it installs dependencies.

## 1.0.0

### Major Changes

- 2e17a41: Unify the browser runtime and framework adapters in uitheme-web. Add framework-neutral root and core entries, React and Next client entries, server-safe bootstrap helpers, Vue composables and providers, and a Nuxt 4 module. Share theme state, storage, transitions, and option validation without mandatory framework or UI primitive dependencies.

  Move styled controls out of the runtime. Install editable Tailwind 3.4 or 4 controls through uitheme-cli and the versioned registry. React controls support Base UI or Radix; Vue controls use Reka. The CLI detects supported applications, previews changes, preserves edited files, installs scoped dependencies, and supports reviewed migration from earlier package imports.

  This is a breaking web release. Replace packaged UIThemeSwitcher, UIThemeSelector, and select primitive imports with local controls. Move uitheme-vue imports to uitheme-web/vue, its bootstrap entry to uitheme-web/vue/bootstrap, and its Nuxt module to uitheme-web/nuxt. The previously published uitheme-vue package remains available. React Native has no release in this changeset.

  Expand the copied controls with Theme Selector, Icon Theme Toggle, and Theme Switcher. Set transition type, duration, and slide direction on each control. Install Theme Disclosure and Color Theme Disclosure separately for inline choices. Support upward and downward disclosure expansion. Remove copied transition and icon helpers. Preserve provider transition defaults for omitted control settings. Keep optional shadow borders on floating controls. Install the runtime through uitheme-web@latest.

  Publish component documentation from MDX with matched source previews, complete registry dependencies, framework-specific examples, theme-aware syntax highlighting, and Markdown exports for agents.

  Reuse one shared `cn` utility at the configured utils alias. Create or repair it when missing, preserve valid existing utilities, and validate exports before replacement. Remove per-component class and border helpers. Keep border styling and Theme Toggle icons in their components.

  Show dependency names without versions in source disclosures. Remove internal registry revision text from consumer documentation and copied pages. Add framework Guides with example repository links and a consumer-first writing guide.

### Minor Changes

- b67700b: Update an outdated dependency instead of stopping. The CLI keeps a dependency that is inside the control's compatible range, for example `lucide-react` 0.397.0 or later. Otherwise the plan shows `update <name> <current> -> <range>`, with a note for a major update, and the existing confirmation applies. An older `uitheme-web` major still requires `uitheme migrate`.
- f2c7a24: Detect the React component base from the app. Radix is selected when the app depends on `radix-ui` or `@radix-ui/*`, and Base UI when it depends on `@base-ui/react`. When the app has both or neither, a shadcn `base-*` style selects Base UI and other shadcn styles select Radix. Without either signal, the CLI uses Base UI. The `init` prompt offers the detected base as its default. `--base` and a saved `uitheme.json` base still win.
- b67700b: Generate a React `ThemeProvider` in `components/theme-provider.tsx` that wraps `UIThemeProvider`. In a Vite entry, place it directly inside `<StrictMode>` and around the other providers, with the children indented one level.

### Patch Changes

- 5c27853: The CLI now asks before it replaces a file that differs from the uitheme version, instead of stopping with an error. You can keep your file, overwrite it, or see the diff. `--yes` and runs without a terminal keep your files and exit with code 2, and `--overwrite` replaces them without asking.

  - Answering "No" at "Apply these changes?" cancels and changes nothing.
  - `add` offers to run `init` first when the app isn't set up.
  - If the saved base doesn't fit the framework, the CLI asks which base to save.
  - When the provider needs a manual step, the CLI prints the code to add.
