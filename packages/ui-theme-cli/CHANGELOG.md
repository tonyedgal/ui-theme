# uitheme-cli

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
