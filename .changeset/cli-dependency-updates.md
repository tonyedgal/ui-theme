---
'uitheme-cli': minor
---

Update an outdated dependency instead of stopping. The CLI keeps a dependency that is inside the control's compatible range, for example `lucide-react` 0.397.0 or later. Otherwise the plan shows `update <name> <current> -> <range>`, with a note for a major update, and the existing confirmation applies. An older `uitheme-web` major still requires `uitheme migrate`.
