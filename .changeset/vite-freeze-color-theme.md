---
'uitheme-web': patch
---

`ViteUIThemeProvider` with `disableTransitionOnChange` now also switches off CSS transitions when `setColorTheme` runs, as the other React providers do.
