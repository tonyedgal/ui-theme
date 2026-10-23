# uitheme-rn

## 1.0.0

### Major Changes

- e2affed: Add the React Native theme package with independent appearance and color palette
  state, persistence, native Expo controls, and optional Reanimated color animation.

  Add nine Skia screen effects for appearance and palette changes, with Reduce
  Motion support, capture fallback, and cleanup after interruptions.

  Add optional NativeWind 5 and Uniwind adapters for Tailwind v4 CSS themes. Include
  separate Expo examples that use the web example's 32 color tokens across six
  light/dark palettes, plus independent native and TypeScript palette support.

### Patch Changes

- 9440106: Restrict animation peers to the verified Reanimated 4.5, Worklets 0.10, and Skia
  2.11 families. Pin NativeWind support to the tested v5 RC0. Prevent ordinary npm
  installs from selecting incompatible animation engines. Correct the custom
  palette transition example.

  Require Skia 2.11.1 to restore overflow clipping in Android snapshots. The Expo
  examples use custom native builds for this upstream fix.
