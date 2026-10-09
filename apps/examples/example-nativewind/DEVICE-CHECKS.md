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
