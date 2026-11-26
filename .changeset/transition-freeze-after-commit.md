---
'uitheme-web': patch
---

Keep the `disableTransitionOnChange` freeze until React applies the new theme class and the browser recalculates styles. CSS transitions no longer run after `setTheme` or `setColorTheme`.
