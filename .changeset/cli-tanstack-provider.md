---
'uitheme-cli': patch
---

`init` now sets up TanStack Start with `TanStackUIThemeProvider` instead of `UIThemeProvider`. The generated `theme-provider.tsx` also exports `ThemeScript`, which renders `TanStackStartThemeScript`. `init` adds `<ThemeScript />` to the document head and `suppressHydrationWarning` to `<html>`, so the theme does not flash before hydration. If you keep a `theme-provider.tsx` from an earlier `init`, the CLI leaves your files unchanged and prints a manual step. When `init` replaces `next-themes` in a TanStack Start app, it now uses `TanStackUIThemeProvider` and `useTanStackUITheme`, and it asks you to add `TanStackStartThemeScript` to the head. Vite React apps keep `UIThemeProvider`.
