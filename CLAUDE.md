# UI-Theme

**Read [AGENTS.md](AGENTS.md) first.** It holds the rules for coding, testing,
human communication, and commits. This file describes the project.

UI-Theme is a TypeScript monorepo for a theme library, its website and
reference applications. The published library is `uitheme-web`. The website
workspace is `ui-theme-web`; these names refer to different packages.

## Stack

- pnpm workspaces and Turborepo; Node.js >=22.18.0. Use the pnpm version in
  the root `packageManager` field.
- Runtime: TypeScript, optional React/Vue/Nuxt adapters, tsup, Vitest, and Playwright. UI primitives belong to copied registry controls.
- Website: Next.js App Router, React, Fumadocs with MDX, Tailwind CSS v4,
  shadcn components, and Hugeicons.
- ESLint uses the root flat configuration. Prettier controls formatting.

## Project structure

```text
packages/ui-theme/             # Published uitheme-web library
  src/core/                    # Animation, transition, storage, and shared types
  src/react/                   # Hooks and providers
  src/vue/                     # Vue plugin, provider, and composables
  src/nuxt.ts                  # Nuxt 4 module
  src/tanstack/                # TanStack server helpers
packages/ui-theme-cli/         # Optional installation and migration CLI
packages/ui-theme-registry/    # Private templates, builder, and immutable release archives
  tests/browser/               # Browser fixture and Playwright tests
  tests/types/                 # Consumer type contracts
  scripts/smoke-v2-package.mjs     # Packed package verification
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

## Registry component documentation

Each control has a page at `/docs/components/<base>/<component>`. Keep the base
switcher, installation command, usage, and copied source aligned. Preserve
Tailwind and language choices when switching bases. Source comes from the built
registry; documentation must describe the canonical control's actual contract.

Use the shared section order: Preview, When to use, When not to use,
Installation, Usage, API reference, Keyboard, Accessibility, Theme behavior,
AI Agent notes, Source, Customization, and Credits. Keep decision guidance and
agent instructions specific to each control. Do not add empty or speculative
capabilities, integrations, or attribution.

Keep existing component previews and registry controls. Documentation references
inform section organization and writing, not new components or replacement demos.
Include reduced-motion behavior and provider requirements in the docs.

AI Agent notes explain the supported framework import, local control path,
provider wiring, controlled state, CSS requirements, and relevant verification.
They must not imply an MCP service or an integration that is not implemented.

Credits are the final content section. For components we design from a reference,
credit the source site or product with a direct link and an accurate description
of its contribution. Keep component inspiration and primitive dependencies
distinct. Do not apply shared documentation or layout credits to existing controls.
Reference names belong only in Credits and the metadata that renders them, as
specified by section 8 of `AGENTS.md`. Adapt examples to UI-Theme rather than
copying a reference's layout or wording without judgment.

Keep section metadata and guidance in `apps/ui-theme-web/lib/component-guides.ts`.
Render shared guidance with `components/component-guidance.tsx`; keep interactive
preview state in `components/registry-preview.tsx`.
The full-page Markdown copy must include decision guidance, API, AI Agent notes,
and Credits, matching the visible page.

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

Each commit checks the staged snapshot with lint-staged and affected validation.
Local checks include package tests, reference app builds/types, relevant browser
suites, and independent release consumers. Normal CI checks affected packages
and the website without example builds or browser-engine downloads.

See [the CI guide](docs/ci.md) and `scripts/validation-plan.mjs` for routing.
