# uitheme-web

## 2.0.0

### Major Changes

- 2e17a41: Unify the browser runtime and framework adapters in uitheme-web. Add framework-neutral root and core entries, React and Next client entries, server-safe bootstrap helpers, Vue composables and providers, and a Nuxt 4 module. Share theme state, storage, transitions, and option validation without mandatory framework or UI primitive dependencies.

  Move styled controls out of the runtime. Install editable Tailwind 3.4 or 4 controls through uitheme-cli and the versioned registry. React controls support Base UI or Radix; Vue controls use Reka. The CLI detects supported applications, previews changes, preserves edited files, installs scoped dependencies, and supports reviewed migration from earlier package imports.

  This is a breaking web release. Replace packaged UIThemeSwitcher, UIThemeSelector, and select primitive imports with local controls. Move uitheme-vue imports to uitheme-web/vue, its bootstrap entry to uitheme-web/vue/bootstrap, and its Nuxt module to uitheme-web/nuxt. The previously published uitheme-vue package remains available. React Native has no release in this changeset.

  Expand the copied controls with Theme Selector, Icon Theme Toggle, and Theme Switcher. Set transition type, duration, and slide direction on each control. Install Theme Disclosure and Color Theme Disclosure separately for inline choices. Support upward and downward disclosure expansion. Remove copied transition and icon helpers. Preserve provider transition defaults for omitted control settings. Keep optional shadow borders on floating controls. Install the runtime through uitheme-web@latest.

  Publish component documentation from MDX with matched source previews, complete registry dependencies, framework-specific examples, theme-aware syntax highlighting, and Markdown exports for agents.

  Reuse one shared `cn` utility at the configured utils alias. Create or repair it when missing, preserve valid existing utilities, and validate exports before replacement. Remove per-component class and border helpers. Keep border styling and Theme Toggle icons in their components.

  Show dependency names without versions in source disclosures. Remove internal registry revision text from consumer documentation and copied pages. Add framework Guides with example repository links and a consumer-first writing guide.

### Patch Changes

- 4ba8e03: Accept animation names as strings on the React providers, for example `<UIThemeProvider animationType="slide">`. `UIThemeProvider`, `NextUIThemeProvider`, `TanStackUIThemeProvider`, and `ViteUIThemeProvider` now accept the same values as `switchTheme` and the Vue adapter. The `ThemeAnimationType` enum still works.

## 1.2.0

### Minor Changes

- cac47d1: Animate color palette switching, cycling, and target helpers through the same View Transition lifecycle as light and dark themes.
- cac47d1: Keep caller-provided SVG logos stationary at the viewport center while the theme reveal expands underneath. Preload assets and clean up the logo layer after completion or interruption.
- cac47d1: Add sharp clip-path and feathered polygon wipes in all eight clockwise directions, plus expanding triangle reveals and configurable fixed origins.
- cac47d1: Accept an explicit trigger element or viewport CSS-pixel origin without mutating button refs. Preserve existing ref and boolean arguments.
- cac47d1: Allow numeric CSS-pixel dimensions or auto for logoWidth and logoHeight. Default an omitted dimension to auto and preserve the asset aspect ratio.
- cac47d1: Add paired logoLight and logoDark assets selected for the destination theme. Require both assets together and reject mixing the pair with the single logo option.
- cac47d1: Report rejected asynchronous server notifications through onServerError without rolling back a successfully applied local theme. Seed server preferences once after hydration, including when storage is blocked.
- cac47d1: Export useHydrated from the React entry and share its React 18 useSyncExternalStore implementation across providers and controls.

### Patch Changes

- cac47d1: Minify and share ESM and CommonJS chunks while retaining React client boundaries, server-safe helpers, and the CLI shebang. Update supported dependencies and validate published imports, declarations, and CLI migrations.
- eb8d705: Fix paired SVG logo transitions to use the current theme's logo. Dark-to-light transitions show logoDark (a light or white asset), and light-to-dark transitions show logoLight (a dark or black asset). Keep the current theme's logo when changing color palettes.
- cac47d1: Preserve reduced-motion updates, cancellation, interrupted captures, and cleanup. Fall back to CSS pseudo-element animations when a browser accepts but does not apply Web Animations pseudo targets.
- cac47d1: Use configured defaults when storage reads fail. After a failed write, restore the requested destination to the last committed theme so the same destination can be retried.
- cac47d1: Safely serialize bootstrap values as JavaScript literals, escaping HTML-sensitive characters and Unicode separators. Validate server cookie preferences before applying them.
- cac47d1: Share provider state with built-in controls and mount a standalone theme hook only outside a provider. Track selector keyboard input through its portal.
- cac47d1: Improve high-DPI circle coverage and bounded feathering, including fractional viewport bounds. Use a responsive 400 ms default while respecting explicit durations.

## 1.1.0

### Minor Changes

- c373ad2: Add `npx uitheme-web migrate`, a command that rewrites `@ui-theme/web` imports, the Tailwind `@source` path and the `package.json` dependency to the new name.

## 1.0.1

### Patch Changes

- 822f02a: Require `@radix-ui/react-select` so the react entry loads for a new user
  instead of failing with `ERR_MODULE_NOT_FOUND`.

  Also drop the peer dependencies for the frameworks the package does not
  build, stop publishing sourcemaps, and document the Tailwind `@source`
  setup in the Next.js and Vite guides.

## 1.0.0

### Major Changes

- Rename the package from `@ui-theme/web` to `uitheme-web` and reset the version to 1.0.0.

  Framework-agnostic UI theme switching library with smooth View Transitions, multi-theme
  support, and synchronized state management. The entry points `uitheme-web/core`,
  `uitheme-web/react` and `uitheme-web/tanstack` keep their existing names.

  Migration: replace `@ui-theme/web` with `uitheme-web` in your dependencies and imports.

> The releases below were published under the previous package name, `@ui-theme/web`.

## 1.0.2

### Patch Changes

- df1d176: Add a deprecation notice to the README and point users to `uitheme-web`.

## 1.0.1

### Patch Changes

- 570eac9: - Add support for Tanstack SSR in `@ui-theme/web`.
  - Add example apps for Tanstack starter and Next.js.
  - Update documentation to reflect the new SSR support and example apps and enable tailwind for pre-built components.

## 1.0.0

### Major Changes

- 38f7c2a: ui-theme version 1 release

  This marks the full release of `@ui-theme/web` version 1.
  This release currently supports React with additional framework adapters planned for future releases.

- 440deb7: UI-Theme version 1 release

  Framework agnostic UI theme package featuring smooth theme transitions using the View Transitions API.
