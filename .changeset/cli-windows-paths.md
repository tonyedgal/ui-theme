---
'uitheme-cli': patch
---

Fix `add` and the other commands on Windows. The CLI no longer builds a component folder named `src\*\components\ui` from a `@/*` path alias, and it checks every path with the separators of the platform. A busy file no longer stops a write, `uitheme.json` can start with a byte order mark, and a bad `uitheme.json` field now says what to change.
