---
'uitheme-cli': patch
---

The CLI now asks before it replaces a file that differs from the uitheme version, instead of stopping with an error. You can keep your file, overwrite it, or see the diff. `--yes` and runs without a terminal keep your files and exit with code 2, and `--overwrite` replaces them without asking.

- Answering "No" at "Apply these changes?" cancels and changes nothing.
- `add` offers to run `init` first when the app isn't set up.
- If the saved base doesn't fit the framework, the CLI asks which base to save.
- When the provider needs a manual step, the CLI prints the code to add.
