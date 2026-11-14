---
'uitheme-web': patch
---

A failed `localStorage` write (blocked storage, private mode, quota exceeded) no longer rejects `switchTheme`, `toggleTheme` and the other theme actions, and `setTheme` no longer throws. The theme stays in memory and is applied to the page, and a warning is logged. Adapters that pass `onBrowserStorageError` still receive the error. A custom `storage` adapter that throws still rejects as before.
