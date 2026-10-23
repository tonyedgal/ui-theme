---
'uitheme-rn': patch
---

Restrict animation peers to the verified Reanimated 4.5, Worklets 0.10, and Skia
2.11 families. Pin NativeWind support to the tested v5 RC0. Prevent ordinary npm
installs from selecting incompatible animation engines. Correct the custom
palette transition example.

Require Skia 2.11.1 to restore overflow clipping in Android snapshots. The Expo
examples use custom native builds for this upstream fix.
