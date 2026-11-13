# uitheme-rn

## 1.0.2-next.0

### Patch Changes

- 1555020: The package metadata no longer sets an unused `alpha` publish tag.

## 1.0.1

### Patch Changes

- 454ab1a: Update Zod and support Expo 58, React Native 0.88, Skia 2.14, Reanimated 4.7, and Worklets 0.13 versions. Keep the NativeWind 5 release candidate and Tailwind 4 integration.

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
