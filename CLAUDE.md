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

## Documentation language and navigation

Follow [the writing guide](docs/writing-guide.md). Use ASD-STE-inspired clear
English for about 80% of documentation prose. Keep technical terms and exact
identifiers. This is a style target, not a formal compliance score. Review titles,
descriptions, tables, API text, and AI Agent notes as well as body text.
Preserve code examples and historical verification facts.

Write for library consumers. Include information that helps them install,
configure, use, customize, or troubleshoot UI-Theme. Keep internal build hashes
and maintenance details out of component guides. Consult comparable framework
or component documentation when unsure whether a detail helps the reader.

`apps/ui-theme-web/lib/docs-tree.ts` builds the ordered documentation tree.
`lib/docs-navigation.ts` derives the sidebar, mobile menu, and pagination from
that tree. General pages follow `content/docs/meta.json`. Component pages follow
the canonical component order and use titles from their MDX frontmatter. Do not
create another page-order list in a renderer. Preserve the selected primitive
base, Tailwind version, and language between component links.

The navigation includes `/docs/llms`. Link that page to `/llms.txt` and
`/llms-full.txt`. Serve individual Markdown pages through `/llms.mdx/docs/...`
and the `.mdx` URL rewrite. Use `lib/llm-docs.ts` for the page inventory and
`lib/component-markdown.ts` for expanded component text. Keep copied pages and
LLM component guides aligned with their MDX source. LLM examples use Tailwind 4
and TypeScript for each supported primitive base.

## Registry component documentation

Each control has a page at `/docs/components/<base>/<component>`. Keep the base
switcher, installation command, usage, and copied source aligned. Preserve
Tailwind and language choices when switching bases. Source comes from the built
registry; documentation must describe the canonical control's actual contract.

Use the shared section order: Preview, Examples, When to use, When not to use,
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

Write component documentation in `apps/ui-theme-web/content/components/<name>.mdx`.
Each control has one document shared by Base UI, Radix, and Reka. Use H2 headings
for the required sections, in the order defined by `lib/component-sections.ts`.
The `componentContent` Fumadocs collection applies `remark-component-sections.ts`
during MDX compilation. Missing, duplicate, empty, or reordered sections fail the
build. Preview, Examples, Installation, Usage, API reference, and Source must each contain
their corresponding `Registry*` block exactly once. Do not hide written prose in
TypeScript objects or JSX. Keep only variant-dependent API data and primitive
credits in `lib/component-guides.ts`. Interactive blocks and preview state live
in `components/registry-preview.tsx`. Use `docs/component-docs-template.mdx.example`
as the starting point for a new document. Headings supply the page TOC.
The full-page Markdown copy must include decision guidance, API, AI Agent notes,
and Credits, matching the visible page.

## Documentation presentation

The content engine remains Fumadocs MDX and Core. Presentation lives in
`apps/ui-theme-web/components/docs/`. Use Tailwind for prose, navigation,
preview frames, tabs, code blocks, copy actions, tooltips, and pagination.
Keep CSS files for theme tokens and necessary stylesheet integration.

Use Outfit for site navigation, headings, and prose. Keep Geist Mono for code.
Preserve the measured rhythm:
14px prose at 1.75 line height, 20px section headings at weight 600, 12px code
at 24px line height, 12px sidebar links, and 48px between major sections.
Preview padding is 32px on smaller screens and 80px on desktop.

Highlight registry source and usage on the server with `lib/highlight-code.ts`.
Keep Shiki out of browser imports. MDX fences share `lib/code-themes.ts` and the
same code-block renderer. Copy raw source, without line numbers or HTML.
Preview/code and package-manager tabs must support keyboard navigation and keep
source aligned with the selected framework, Tailwind version, and language.

See [the presentation inventory](docs/documentation-components.md). Preserve
required license and copyright notices for adapted portions.

## Inline disclosure surfaces

Use the private `SourceDisclosure` component for documentation source sections.
Keep content in its bounded scroll area. The default maximum is 384px, limited
to 60% of viewport height. Keep the bright trigger inset inside the muted frame. The inset follows
`--disclosure-padding`, which uses `--spacing` with a 4px fallback. The outer
radius equals the inner radius plus that padding.

Theme Selector and Color Theme Selector contain floating menus only. Install
Theme Disclosure or Color Theme Disclosure separately for inline radio choices.
Use disclosures only where expansion can move content below the trigger. Their
scroll area defaults to 240px and is limited to 60% of viewport height. Inline
panels stay open after selection and do not close on Escape. They use solid
borders.

Keep each registry control and its small icon renderer in one main component
file. Icon Theme Toggle also installs Theme Toggle as a registry dependency.
Reuse the configured shared `cn` utility. Do not add copied transition, border,
icon, class, or disclosure helpers. Import `ThemeControlTransitionProps` from
`uitheme-web/react` or `uitheme-web/vue`. Pass settings to the runtime directly;
undefined settings preserve the provider defaults. Only slide controls accept
`slideDirection`.

The component catalog and sidebar use Toggles, Switchers, Selectors, and
Disclosures. Keep group labels smaller and muted in the sidebar. Use one
canonical component entry and one page per primitive base. Keep motion styles
as a secondary classification.

Disclosure labels follow the expansion direction: below an upward trigger and
above a downward trigger. Preserve this order in custom layouts. Reserve room
for the full bounded panel, trigger, label, and frame padding in every disclosure
preview. Anchor upward controls at the bottom and downward controls at the top.
The preview and trigger must keep their position when the panel opens. The
current examples use `h-96` for the default 240px scroll limit. Adjust reserved
height when the scroll limit changes.

## Website theme tokens

Use one `SiteThemeProvider` for the full website. It wraps `NextUIThemeProvider`
from `uitheme-web/next`. Disable the Fumadocs appearance provider. Header controls
and registry previews must consume the same UITheme state. Set transition
overrides on each control through its props. Other controls keep their own settings.

Define default light and dark tokens in `apps/ui-theme-web/app/global.css`.
Named palettes use `.theme-<key>` and `.theme-<key>.dark`. Register keys through
the provider and expose them in the site selector. Keep palette tokens, radius,
shadows, typography, and spacing in theme variables. Map Fumadocs aliases to those
variables. Do not force a palette through a docs marker or a separate stylesheet.

Use thin scrollbars with theme colors for visible scroll areas. Keep the explicit
hidden-scrollbar rules in `components/docs/code-block.tsx` and
`components/docs/component-preview.tsx`. These areas must remain scrollable.

The next component framing pass must review nested rounded shapes. For a uniform
inset, use outer radius = inner radius + padding. Account for the visible border
when measuring the inset. Preserve circles and intentional pill shapes. Audit
frames after selecting each palette, including the palette with a zero radius.

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
