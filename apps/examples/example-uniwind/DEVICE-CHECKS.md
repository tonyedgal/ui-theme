# iPhone installation checks

2026-10-09

- Added a selector for all nine screen effects, with Circle as the default.
- Each choice applies to appearance and color palette commands.
- iPhone 16 Pro simulator / iOS 18.6 / Expo Go: all nine choices select correctly,
  update appearance, and return to Ready. Selected and disabled states are exposed
  to accessibility. Heart was also exercised separately before the full pass.
- A simulator recording is saved locally at
  `test-results/transition-selector-ios.mp4` (ignored by Git).
- Signed Release build passed in Xcode 27 for the connected iPhone 15 Pro / iOS 27.
- Native scene support is enabled. JavaScript is embedded for standalone launch.

This is functional build and selector evidence, not a frame-rate profile or a
physical VoiceOver audit.

Installation succeeded on the connected physical iPhone. The app launched with
bundle identifier `com.tonyedgal.uithemeuniwind`. Device Hub showed the release
screen with the palette samples and Transition style selector. The embedded
bundle allows the app to run without the development server.

## Duration slider — 2026-10-09

Added a native Expo UI slider from 100 to 2,000 ms in 50 ms steps, with a
350 ms default. The selected duration applies to both animated commands.
The iOS accessibility tree exposes Transition duration and the value in
milliseconds. The simulator verifies a 1,050 ms selection, a disabled slider during
appearance playback, and a completed palette change with the same duration.

Type checks, scoped lint, and iOS/Android/web exports pass. Xcode 27 signed
Release builds pass. The updated app installs and launches on the connected
iPhone 15 Pro / iOS 27. A physical screenshot confirms the slider renders at
350 ms with matching native and utility class colors. It is saved locally
at `test-results/iphone-duration-slider.png`, ignored by Git. These results
establish installation and rendering, not physical screen-reader or frame-rate
verification.
