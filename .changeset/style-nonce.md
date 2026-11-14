---
'uitheme-web': minor
---

Add a `nonce` option to `createThemeController` and `useTheme`. The library sets it on every `<style>` element it injects (the base transition styles, the SVG logo styles and the CSS keyframe fallback), so transitions work under a `style-src 'nonce-…'` Content Security Policy. `NextUIThemeProvider` passes its existing `nonce` prop to this option. `injectBaseStyles` accepts an optional nonce argument.
