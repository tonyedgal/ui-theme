# Documentation presentation inventory

The website keeps Fumadocs for compilation, content collections, page trees,
search data, and heading tracking. The following presentation components live
in `apps/ui-theme-web/components/`.

| Component               | Implementation                                      | Responsibility                                                      |
| ----------------------- | --------------------------------------------------- | ------------------------------------------------------------------- |
| DocsLayout / Navigation | `docs-shell.tsx`                                    | Header, page grid, 1400px outer width                               |
| SidebarNav              | `docs/navigation.tsx`                               | Collapsible sections, active links, session persistence             |
| DocsMobileNavigation    | `docs/navigation.tsx`                               | Focus-trapped mobile navigation with close and backdrop             |
| TableOfContents         | `docs/table-of-contents.tsx`                        | Heading links and active-section indicator                          |
| DocsSearch              | `docs/navigation.tsx`, `docs/search-dialog.tsx`     | Compact trigger, F shortcut, search results and keyboard navigation |
| ThemeToggle             | `docs/navigation.tsx`                               | Light, dark, and system menu                                        |
| CopyPageButton          | `docs/copy-page-button.tsx`                         | Copy Markdown, Markdown view, coding-assistant links                |
| CopyButton / Tooltip    | `docs/copy-button.tsx`                              | Raw-source copy and success/failure feedback                        |
| Prose / Wrapper / Text  | `docs/prose.tsx` and semantic Tailwind markup       | Typography, content spacing, lists, links, tables, code             |
| CodeBlock               | `docs/code-block.tsx`, `lib/highlight-code.ts`      | Server highlighting, line numbers, dual themes and copying          |
| DocsTabs                | `docs/docs-tabs.tsx`                                | Accessible tabs shared by documentation examples                    |
| ComponentPreview        | `docs/component-preview.tsx`                        | Preview/code panels and copy action                                 |
| InstallTabs             | `docs/install-tabs.tsx`                             | npx, bun, pnpm, and yarn commands                                   |
| DocsPagination          | `docs/pagination.tsx`                               | Previous link and next-page card                                    |
| PaginationArrows        | `docs/pagination.tsx`                               | Compact page-header navigation                                      |
| Badge / Kbd             | `docs/prose.tsx`, `docs/navigation.tsx`             | Compact status and shortcut labels                                  |
| Button                  | Existing `ui/button.tsx` and semantic button markup | Controls with matching sizes and focus styles                       |
| Icons                   | Lucide and the existing GitHub mark                 | Equivalent copy, check, terminal, search, arrows, menu, theme icons |

The documentation port does not add public registry components or change their
runtime APIs. Branding, navigation destinations, commands, and content stay
specific to UI-Theme.

## Component documentation authoring

Write component prose in `apps/ui-theme-web/content/components/<name>.mdx`.
Fumadocs compiles these documents separately from the general guides. One MDX
document serves all three primitive bases. The route supplies shared interactive
`Registry*` blocks and uses the MDX headings for the table of contents.

The section order lives in `lib/component-sections.ts`. The collection’s remark
plugin rejects missing, duplicate, reordered, or empty H2 sections. Preview, Examples,
Installation, Usage, API reference, and Source require their corresponding blocks.
Compilation runs during development and production builds. Start a document from
`docs/component-docs-template.mdx.example`. Replace its prompts with real guidance.

Page copy uses the authored MDX with generated blocks expanded for the current
framework, Tailwind version, and language. Do not maintain a second prose copy
in TypeScript. API rows remain variant-dependent data.

## Shared navigation and writing

Use `apps/ui-theme-web/lib/docs-tree.ts` as the ordered navigation tree.
The sidebar, mobile menu, and pagination use `lib/docs-navigation.ts` to read
that tree. General page order comes from `content/docs/meta.json`. Component
order comes from the canonical component list; titles come from MDX frontmatter.

Follow [the writing guide](writing-guide.md). Keep Outfit for prose and Geist Mono
for inline code and code blocks. The LLM documentation page links to `/llms.txt`
and `/llms-full.txt`. Individual Markdown routes include all three component
bases and use the same component text builder as the page-copy action.

## Site themes and scrollbars

The site uses one UITheme provider for appearance, palette, and transition
settings. Header selectors and live React previews share that state. The default
light and dark tokens and the named palette tokens live in `app/global.css`.
Fumadocs colors use aliases of the same semantic tokens. The sidebar uses
`background`, so its canvas matches the page for every palette. Default and
Supabase use a stronger light-mode border token. Copy page uses that token for
its outer border and divider. No docs-only palette overrides are applied.

Visible scrollbars use thin tracks and thumbs derived from the active theme.
Code blocks, source listings, usage examples, installation commands, and the
preview Code panel retain their hidden-scrollbar rules. Their content still
scrolls with a trackpad, wheel, or keyboard.

The next framing pass will check outer radius = inner radius + padding for
nested frames. The palette controls the base radius and shadow tokens.

## Inline disclosure

Source sections use the private `SourceDisclosure` presentation component.
The standalone Disclosure component belongs to the Spaceman registry. A bright
trigger sits inside a muted frame. The frame inset follows `--disclosure-padding`,
which uses `--spacing` with a 4px fallback. Its outer radius equals the trigger
radius plus that inset. The content scrolls within a 384px limit and 60% of the
viewport height. Only the main source file is expanded initially.

Theme Selector and Color Theme Selector use floating menus only. Theme Disclosure
and Color Theme Disclosure provide inline expansion as separate registry items.
Each disclosure keeps its frame, scroll area, and radio choices in one component
file. No selector installs disclosure helpers. Use disclosures only where
expansion can move the content below the trigger. Their content scrolls within
240px by default and never exceeds 60% of the viewport height.

Disclosure labels follow the expansion direction: below an upward trigger and
above a downward trigger. Preserve this order in custom layouts. Reserve room
for the full bounded panel, trigger, label, and frame padding in every disclosure
preview. Anchor upward controls at the bottom and downward controls at the top.
The preview and trigger must keep their position when the panel opens. The
current examples use `h-96` for the default 240px scroll limit. Adjust reserved
height when the scroll limit changes.

The main component preview shows each control’s default layout. Selectors use floating menus. Disclosures use downward expansion. Both use solid borders. Put alternate layouts in the Examples section below it. Give each example its own preview and code tabs. Do not hide examples behind a variant dropdown.

Theme transition style and duration belong to the theme-changing controls as `animationType` and `duration` props. Put one configured page-transition example first. Keep icon motion (`effect`) separate from page transitions. Use Icon Theme Toggle for icon-only actions and Theme Switcher for the three-way radio control.

## Component catalog

`/docs/components` is a responsive component grid. Keep setup commands and shared
CLI guidance in the CLI guide. Keep framework setup on Installation. Keep props, customization, and behavior on each
component page. The catalog links to each component and its framework variants.
Its sidebar label is All Components. The catalog and sidebar use the same
categories from `lib/component-docs.ts`: Toggles, Switchers, Selectors, and Disclosures.
Sidebar category headings are smaller and muted. They are labels, not routes or nested collapse controls.
The Components section remains collapsible. List only theme-specific disclosures here. Keep a general-purpose Disclosure in the general registry.

Each component has one primary category and one canonical page per primitive
base. Keep category headings at H2 and component card titles at H3 in the
catalog. `docs-tree.ts` derives the grouped page tree from this metadata.
`docs-navigation.ts` retains a flat page order with group labels, so mobile
navigation, pagination, and LLM routes use the same component inventory.
Classify future liquid controls by interaction. Motion styles do not create a
second component category. See the [future motion backlog](implementation/registry-motion-backlog.md). Do not add a separate overview article.

## Code themes by palette

`lib/code-themes.ts` defines the shared Shiki theme map. Fumadocs MDX and
`lib/highlight-code.ts` use the same map for authored code, usage examples,
preview code, installation commands, and installed source listings.

Default code uses Min Light and Min Dark. Caffeine uses Gruvbox Light Medium and
Gruvbox Dark Medium. Mono uses GitHub Light and GitHub Dark Default. Bearnie keeps
the custom light and dark code themes. Palettes without an override, including
Supabase, inherit Min for the current appearance.

Shiki generates all eight color sets during highlighting. CSS selects token
colors and font styles through UITheme's palette and appearance classes.
Switching palettes does not fetch or highlight code again. Keep the code canvas,
foreground, copy controls, line numbers, and selection colors on the matching
`--code-*` variables in `app/global.css`. Do not make the code canvas transparent.

## Registry source structure

Each control keeps its presentation and icons in its main component file. Icon
Theme Toggle also installs Theme Toggle as a registry dependency. Reuse the
configured shared `cn` utility. Do not ship `classes.ts`, `border.ts`,
`theme-icon`, `inline-choice`, `inline-disclosure`, or `transition.ts` helpers.

Import `ThemeControlTransitionProps` from the runtime. Pass control transition
settings to the runtime directly. The runtime preserves provider defaults for
undefined settings and restricts `slideDirection` to slide controls through the
public type. Theme selectors do not have an inline variant. Use the separate
disclosure controls for inline expansion.
