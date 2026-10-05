# UI-Theme

**Read [AGENTS.md](AGENTS.md) first.** It holds the rules for coding, testing,
human communication, and commits. This file describes the project.

UI-Theme is a TypeScript monorepo for a theme library, its website and
reference applications. The published library is `uitheme-web`. The website
workspace is `ui-theme-web`; these names refer to different packages.

## Stack

- pnpm workspaces and Turborepo; Node.js >=22.18.0. Use the pnpm version in
  the root `packageManager` field.
- Library: TypeScript, React, Radix Select, tsup, Vitest, and Playwright.
- Website: Next.js App Router, React, Fumadocs with MDX, Tailwind CSS v4,
  shadcn components, and Hugeicons.
- ESLint uses the root flat configuration. Prettier controls formatting.

## Project structure

```text
packages/ui-theme/             # Published uitheme-web library
  src/core/                    # Animation, transition, storage, and shared types
  src/react/                   # Hooks, providers, and React controls
  src/tanstack/                # TanStack server helpers
  src/cli/                     # Migration CLI
  tests/browser/               # Browser fixture and Playwright tests
  tests/types/                 # Consumer type contracts
  scripts/smoke-package.mjs     # Packed package verification
apps/ui-theme-web/             # Website and documentation
  app/(home)/                  # Home page
  app/docs/                    # Documentation routes
  components/                  # Website components
  content/docs/                # MDX documentation
  lib/source.ts                # Fumadocs content adapter
apps/examples/                 # Reference framework integrations
.changeset/                    # Pending package release notes
```

## Common commands

Run these from the repository root:

```bash
pnpm install --frozen-lockfile
pnpm --filter uitheme-web build
pnpm --filter uitheme-web typecheck
pnpm --filter uitheme-web test
pnpm --filter uitheme-web test:types
pnpm --filter uitheme-web test:browser
pnpm --filter uitheme-web test:package
pnpm --filter ui-theme-web dev
pnpm --filter ui-theme-web typecheck
pnpm --filter ui-theme-web build
pnpm lint:check
pnpm format:check
```

The library browser fixture uses `http://127.0.0.1:4179`. The website normally
uses port 3000. Check for an existing server before starting another server.
Build the library before testing a consumer: the browser fixture imports the
published entry points from `dist`, rather than importing source files directly.

## Theme and animation contracts

- Keep light/dark mode and color palettes distinct. Provider controls share
  provider state. Standalone controls may own their state.
- Preserve storage behavior, hydration, reduced motion, interrupted transitions,
  and error cleanup when changing the transition path.
- Read official View Transitions documentation before animation changes. Inspect
  actual browser behavior, including the relevant high DPI display conditions.
- Animation origins use viewport-relative CSS pixels. Use the clicked element
  or an explicit origin. Do not multiply DOM rectangles by `devicePixelRatio`.
- Paired SVG logos use the current theme's asset. `logoDark` is normally light
  or white and starts a dark-to-light transition. `logoLight` is normally dark
  or black and starts a light-to-dark transition. Both assets are required.
- Keep the logo centered. Preserve intrinsic aspect ratios when a dimension is
  `"auto"`. See [the logo guide](docs/stationary-logo-transition.md).

## Website work

Use the existing design as a guide. Keep margins, padding, icon spacing, and
control sizes consistent. Preserve the existing hero and install snippet unless
changing them is part of the request. Use the shared theme library for examples.

The website has its own generated Next.js agent guidance in
`apps/ui-theme-web/AGENTS.md`. Read the relevant bundled Next.js documentation
under that app's `node_modules/next/dist/docs/` before changing Next.js code.

Scope website-only dependencies and rules to the website. Do not expand a
website task into package or workspace changes without a necessary reason.

## Verification and releases

Use browser tests for rendered theme behavior. Test both transition directions,
reduced motion, origins, and cleanup. The library browser configuration includes
Chromium at DPR 1/2/3, WebKit, and Firefox. Save repeatable visual evidence when
checking animation appearance. State any manual testing that remains.

Run the checks relevant to the change. Run the full repository lint check before
pushing and distinguish existing findings from failures introduced by the task.
Do not silence lint errors or edit generated source to hide a failure.

Use Changesets for public package changes. Keep separate features in separate
Changeset files. Use a patch for a bug fix. Do not hand-edit generated versions
or changelogs. Verify the packed package when exports or build output change.

Follow the `/auto-commit` workflow in [AGENTS.md](AGENTS.md). Keep commits scoped
and preserve stashes. A passing local check does not confirm publication or
remote CI. Push and publish only within the human's explicit authorization.

## Local commit checks

`pnpm install` installs the Husky pre-commit hook. Each commit runs ESLint and
Prettier on staged files, then the library unit tests. Browser tests and full
workspace type checks remain in CI. There is no pre-push hook.

`pnpm test:browser:smoke` builds the library and runs a focused Chromium check.
This local command is optional. Install Chromium with
`pnpm --filter uitheme-web exec playwright install chromium` first.

The full browser suite covers every case in Chromium, WebKit, and Firefox at
DPR 2. Extra DPR 1 and mobile DPR 3 runs cover geometry and rasterization.
PR CI runs browsers for package, example, dependency, and check-configuration
changes; main always runs them. The CI job still reports success for other PRs
after its remaining checks pass. Required branch protection must be configured
in GitHub to enforce that CI result before merging.
