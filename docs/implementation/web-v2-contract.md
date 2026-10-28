# UI-Theme v2 implementation contract

Approved scope: one `uitheme-web` runtime; Vue at `/vue`, Nuxt 4 at `/nuxt`; separate `uitheme-cli`; hosted registry at https://www.ui-theme.dev/r. Tailwind 3.4 and 4. React controls support Base UI and Radix through installation selection, Vue uses Reka. One rich control family. No native code changes. Published `uitheme-vue@1` remains available; no bridge package.

## Coordination

- Worktree: /Users/tony/Developer/Github/npm-project/worktrees/ui-theme-v2.
- Read the original repo AGENTS.md as well as this worktree guide. No JSDoc or explanatory code banners; meaningful one-line comments only.
- Write behavior failure cases/tests before implementation. Prefer integration and browser evidence. Do not write tests that mirror source structure.
- Do not edit root configuration, lockfile, another worker's paths, or run dependency installs. Ask the coordinator for dependencies. Do not commit, push, publish, or deploy.
- Keep existing runtime names and non-presentational behavior compatible. Packaged styled controls leave v2, but providers stay.
- Report files, checks, remaining risks, and interface changes. Do not claim readiness from static checks alone.

## Public paths

`uitheme-web` and `/core`: framework-neutral engine and types. `/react`: React hooks and providers. `/next`: Next client provider. `/next/server`: server-safe bootstrap. `/tanstack`: existing stateless server helpers. `/vue`: Vue plugin/provider/composables. `/vue/bootstrap`: server-safe bootstrap. `/nuxt`: Nuxt module. Core/React retain ESM+CJS; Vue/Nuxt ESM. Framework dependencies are optional peers. The web package has no mandatory runtime dependencies or UI primitives.

One browser controller implementation drives framework adapters; one controller per provider/standalone instance. Preserve the document transition coordinator. No global SSR store. Preserve `theme`, `resolvedTheme`, `colorTheme`, immediate `set*` versus animated `switch*`, storage keys, controlled React values, callbacks, hydration and reduced motion. React rendering and Vue nextTick are coordinated by adapter commit hooks. Root and server imports must be safe with no window/document/frameworks installed.

## Components

Names: `theme-toggle`, `appearance-selector`, `color-theme-selector`, `transition-settings`. Framework: `react|vue`; base: `base-ui|radix|reka`; Tailwind: `3|4`; language: `ts|js`. React supports first two bases only; Vue supports reka only. Default React base: base-ui.

Controls consume provider state/actions from `/react` or `/vue`. React className and Vue class extend defaults. A `classes` object customizes root/trigger/content/item/label/track/thumb where applicable. Use a local matching-major tailwind-merge helper, with user classes last. No mandatory icon package or cva/clsx. TransitionSettings is controlled: React `value`/`onValueChange`, Vue `modelValue`/`update:modelValue`, containing `{ animationType, duration }`; it does not persist hidden settings. Default settings use current engine defaults, duration range 0..2000 ms, step 50, including an accessible numerical value. Labels default to human-readable English and remain overridable. Keys for supported palette/appearance options come from provider options; palette options allow value/label metadata.

## Registry protocol

Private workspace `@ui-theme/registry` in packages/ui-theme-registry. Canonical template sources live in `src/templates/react/base-ui`, `src/templates/react/radix`, and `src/templates/vue/reka`. A builder emits static JSON under its own dist, never another workspace source. Shared pure contracts can be bundled into CLI; never ship imports of private workspace code.

Manifest `{ schemaVersion: 1, stable: { revision, index, webVersion: '^2.0.0', cliVersion: '^1.0.0' } }`. The index is a standard registry document `{name:'uitheme',homepage,items:[...]}`. Standard item fields: name, type, title, description, dependencies, registryDependencies, files, meta. `meta.uiTheme`: schemaVersion, revision, component, framework, base, tailwind (3|4), language (ts|js), webVersion, cliVersion. File path/content/type describe source; targets are logical app destinations, resolved by installer. Full revision URLs for registryDependencies.

Paths: `/r/manifest.json`, `/r/v1/<revision>/registry.json`, `/r/v1/<revision>/<framework>/<base>/tw<major>/<language>/<component>.json`. Revision is a deterministic content digest. Released records immutable. CLI reads manifest once and pins all graph requests to that revision. Source and serialized records must match. Never fetch source at runtime in the website.

## CLI profile and interfaces

Workspace uitheme-cli in packages/ui-theme-cli. ESM binary `uitheme`, package runner `npx uitheme-cli`. Node >=22.18. Commands info/init/list/add/diff/migrate. Shared profile fields: cwd, workspaceRoot, framework (`vite-react|vite-vue|next|tanstack|nuxt`), frameworkVersion, language, packageManager, tailwind (3|4), cssFile, tailwindConfigFile, componentsDir, aliasPrefix, base, colorFormat (`css|hsl-channels`), configFile. Persist relative paths in uitheme.json; resolved absolute paths only in memory.

Flags > saved config > compatible existing components config > detection > prompt. No guessed framework; require explicit selection for ambiguity. Next App Router, TanStack Start 1, Nuxt4, Vite React/Vue. Detect and reject Nuxt3 automatic setup before mutation. Read package versions/JSONC tsconfig and aliases without executing app configs. `--cwd` selects one app; package installs run in that app using the workspace package manager. Existing app with configured Tailwind required. No app scaffolding or automatic Tailwind major upgrades.

Registry/detection owner defines and tests `src/project.ts`, `src/registry.ts`, `src/config.ts`, `src/types.ts`, and package manifest. Installer owner owns `src/install/**`, `src/tailwind/**`, command implementations and binary after those shared interfaces exist. Coordinator handles package manifest integration and root lockfile. Keep registry HTTP client injectable for local tests. No arbitrary shell hooks or paths outside approved destinations. Fetch and validate complete graph before applying changes.

Dry-run prints all changed files/dependencies without project writes. `--yes` does not imply overwrite. Default rejects edited existing files; unchanged identical files are skipped. Explicit overwrite shows planned replacement. Roll back touched files/manifests/lockfiles on install failure without disturbing pre-existing edits. Record revision and installed file hashes. Repeated operations are idempotent. CSS v3/v4 transformations preserve existing variables/imports/plugins; recognize full CSS colors versus HSL channels.

## Validation and release

All affected browser/reference checks remain local pre-commit. CI stays affected-product build/types/packed/schema checks and website build. No browser engine downloads in routine CI. Version changes come from web major and new CLI release Changesets only. Native version stays unchanged. No publishing, production deployment, or npm deprecation until separately approved.
