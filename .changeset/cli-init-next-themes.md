---
'uitheme-cli': minor
---

`init` now replaces `next-themes` in an app that uses it. One run rewrites the `ThemeProvider` and every `useTheme` import, then removes the `next-themes` package with the package manager of the app. If a form cannot be converted, the run changes no file and links to the docs. The CLI no longer prints provider code in the terminal; manual steps link to the docs.
