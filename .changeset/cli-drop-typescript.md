---
'uitheme-cli': patch
---

Remove the `typescript` dependency. The install is about 1.7 MB instead of about 25 MB.

The check for an existing `cn` export is now syntactic. The CLI reads the utils file and follows its relative re-exports. It no longer type-checks the file, so it no longer needs the project's dependencies installed. It accepts `cn` when it is a function, or a value that it cannot prove is not callable. It rejects a missing `cn`, a type-only `cn`, and a `cn` set to a string, number, object, array or class.
