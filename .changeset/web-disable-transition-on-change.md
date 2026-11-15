---
'uitheme-web': minor
---

`UIThemeProvider`, `NextUIThemeProvider` and `TanStackUIThemeProvider` accept `disableTransitionOnChange`, as `ViteUIThemeProvider` already does. When it is true, `setTheme` and `setColorTheme` switch off CSS transitions for the change and restore them right after. The default is false.
