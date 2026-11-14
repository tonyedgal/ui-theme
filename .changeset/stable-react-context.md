---
'uitheme-web': patch
---

Keep the React provider context value and the `useTheme` return value stable while the theme state does not change. A parent re-render no longer re-renders memoized theme consumers. `NextUIThemeProvider`, `TanStackUIThemeProvider` and `ViteUIThemeProvider` now read `systemTheme` from the theme controller, which follows `prefers-color-scheme` changes, instead of calling `matchMedia` during render. Before hydration, `TanStackUIThemeProvider` with `serverTheme="system"` now resolves to the server value (`light`) instead of reading `matchMedia`, so the first client render matches the server HTML.
