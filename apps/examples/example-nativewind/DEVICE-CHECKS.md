# NativeWind verification

2026-10-09

- The app includes the same nine transition choices as the Uniwind app.
- Xcode 27 builds the standalone iOS simulator Release app successfully.
  The app launches on iPhone 16 Pro / iOS 18.6 with embedded JavaScript.
- In Expo Go on the same simulator, Fade, Circle, Wipe, Slide, and Split
  complete appearance changes. Heart, Star, Pixelize, and Dissolve complete
  palette changes. Each choice stays selected and returns to Ready.
- The native and utility class samples show the same CSS color. The independent
  TypeScript sample retains its own palette.
- The recording is saved locally at `test-results/transition-selector-ios.mp4`.
  The final screen is `test-results/transition-selector-ios.png`. Both are ignored
  by Git. These checks do not establish release frame rate or physical VoiceOver
  behavior.

Run `pnpm --filter uitheme-rn build`, then start this example. Select a transition
style and change appearance or a palette. Wait for Ready before the next choice.
Use a standalone Release build for device performance checks.

## Duration slider — 2026-10-09

Added a native Expo UI slider from 100 to 2,000 ms in 50 ms steps, with a
350 ms default. The selected duration applies to both animated commands.
The iOS accessibility tree exposes Transition duration and the value in
milliseconds. The simulator verifies 100 ms and 2,000 ms, including a disabled slider
during the slow appearance effect and a completed quick palette change.

Type checks, scoped lint, and iOS/Android/web exports pass. Xcode 27 signed
Release builds pass. The updated app installs and launches on the connected
iPhone 15 Pro / iOS 27. A physical screenshot confirms the slider renders at
350 ms with matching native and utility class colors. It is saved locally
at `test-results/iphone-duration-slider.png`, ignored by Git. These results
establish installation and rendering, not physical screen-reader or frame-rate
verification.
