---
'uitheme-web': patch
---

Fix the reveal origin when the root element is zoomed. The circle, SVG logo and triangle reveals now emit percentage keyframes, and the blur-circle and polygon-gradient masks scale to the snapshot box, so the reveal starts on the clicked element in Chrome and Safari. The input origin is unchanged (viewport CSS pixels). Code that reads the emitted keyframes sees `circle(…% at …% …%)` and percentage `polygon()` vertices instead of pixel values.
