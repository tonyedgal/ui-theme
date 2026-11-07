---
'uitheme-web': patch
---

Accept animation names as strings on the React providers, for example `<UIThemeProvider animationType="slide">`. `UIThemeProvider`, `NextUIThemeProvider`, `TanStackUIThemeProvider`, and `ViteUIThemeProvider` now accept the same values as `switchTheme` and the Vue adapter. The `ThemeAnimationType` enum still works.
