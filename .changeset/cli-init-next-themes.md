---
'uitheme-cli': minor
---

`init` now replaces `next-themes` in an app that uses it. One run rewrites the `ThemeProvider` and every `useTheme` import, then removes the `next-themes` package with the package manager of the app. `init` asks `Replace next-themes with UI-Theme? [Y/n/c]`: `y` replaces (the default, also with `--yes`), `n` keeps `next-themes` and prints the manual setup link, and `c` keeps it and writes the UI-Theme provider as a separate file. The `--next-themes <replace|keep|create>` option chooses without a prompt. If a form cannot be converted, `init` changes no file and links to the docs; only `c` is then offered. The CLI no longer prints provider code in the terminal; manual steps link to the docs. `disableTransitionOnChange` is kept on the UI-Theme provider.
