---
'uitheme-cli': minor
---

Add UI SDK as a React and Vue component base. Select it with `--base ui-sdk`, or install `@ui-sdk/react` or `@ui-sdk/vue` and the CLI detects it. Vue projects keep `reka` as the default base. UI SDK needs React 19 for React: the CLI stops before it writes a file when the app has an older React. `init` and `add` declare `@layer ui-sdk;` at the top of the app's global stylesheet.
