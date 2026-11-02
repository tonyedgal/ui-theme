# UI-Theme registry

Private source workspace for the hosted UI-Theme control registry.

`pnpm build` creates 84 records: seven components, three supported framework/base
pairs, two Tailwind majors, and two languages. Vue uses Reka. React supports
Base UI and Radix. Templates are the canonical source for docs and copied code.

`pnpm snapshot` freezes the current generated revision in `releases/v1`.
Commit this archive when preparing a release. Clean builds restore these files
before generating the current revision. Existing archive bytes cannot change.
The revision includes generated payloads and the registry origin, so compiler
changes cannot reuse an old URL with different content.

The website stages these artifacts at build time. It does not fetch source from
another server while serving a request. Do not publish this private workspace.

## Inline expansion

Theme Selector and Color Theme Selector use floating menus only. Theme
Disclosure and Color Theme Disclosure are separate registry items. They contain
inline radio choices and a bounded scroll area. Selectors do not install
disclosure files. Set `direction="up"` on a disclosure to place choices above
the trigger. The default direction is `down`.

Each control ships its main component file. Icon Theme Toggle also installs
Theme Toggle. All controls reuse the configured shared `cn` utility. Transition
props use the public `ThemeControlTransitionProps` type from `uitheme-web`.
The runtime owns animation settings and preserves provider defaults when a
control passes undefined settings. Do not add local transition helpers.

Theme-changing controls accept `animationType`, `duration`, and `slideDirection` directly. `icon-theme-toggle` animates sun/moon icons. `theme-switcher` offers system/light/dark radio choices. Motion uses local Tailwind transitions and respects reduced motion.
