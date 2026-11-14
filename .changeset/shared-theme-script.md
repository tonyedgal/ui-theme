---
'uitheme-web': patch
---

The no-flash scripts of `NextUIThemeProvider`, `TanStackStartThemeScript` and `getThemeScript` are now composed from shared pieces, with only the statements each needs. A stored theme or color theme that is not in the configured `themes` or `colorThemes` now falls back to the default instead of being written to `<html>`. For valid stored values, each script writes the same classes, `data-theme` attribute and `color-scheme` as before. If `localStorage` is blocked, the Next.js and TanStack Start scripts now apply the defaults instead of nothing. `TanStackStartThemeScript` accepts optional `themes` and `colorThemes` props; without `colorThemes` it accepts any stored color theme, as before. The inline script text changes, so a CSP hash for it must be updated.
