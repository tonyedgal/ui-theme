---
'uitheme-web': patch
---

Use configured defaults when storage reads fail. After a failed write, restore the requested destination to the last committed theme so the same destination can be retried.
