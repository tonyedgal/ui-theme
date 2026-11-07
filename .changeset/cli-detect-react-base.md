---
'uitheme-cli': minor
---

Detect the React component base from the app. Radix is selected when the app depends on `radix-ui` or `@radix-ui/*`, and Base UI when it depends on `@base-ui/react`. When the app has both or neither, a shadcn `base-*` style selects Base UI and other shadcn styles select Radix. Without either signal, the CLI uses Base UI. The `init` prompt offers the detected base as its default. `--base` and a saved `uitheme.json` base still win.
