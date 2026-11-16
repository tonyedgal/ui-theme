---
'uitheme-cli': patch
---

`init` now sets up TanStack Start with `TanStackUIThemeProvider` instead of `UIThemeProvider`. The generated `theme-provider.tsx` also exports `ThemeScript`, which renders `TanStackStartThemeScript`. `init` adds `<ThemeScript />` to the document head. In Next.js and TanStack Start, `init` adds `suppressHydrationWarning` to `<html>`, so the theme script does not cause a hydration warning. When `init` replaces `next-themes` in a TanStack Start app, it uses `TanStackUIThemeProvider` and `useTanStackUITheme`, and it asks you to add `TanStackStartThemeScript` to the head. Vite React apps keep `UIThemeProvider`.
