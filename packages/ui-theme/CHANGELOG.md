# uitheme-web

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
