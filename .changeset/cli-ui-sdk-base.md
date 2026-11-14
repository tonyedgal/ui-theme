---
'uitheme-cli': minor
---

Add UI SDK as a React component base. Select it with `--base ui-sdk`, or install `@ui-sdk/react` and the CLI detects it. UI SDK needs React 19: the CLI stops before it writes a file when the app has an older React. `init` and `add` declare `@layer ui-sdk;` at the top of the app's global stylesheet.
