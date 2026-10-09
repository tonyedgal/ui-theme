# React Native package architecture

`packages/ui-theme-rn` publishes `uitheme-rn`. It is a separate workspace package
from `packages/ui-theme`, which publishes `uitheme-web`.

The web implementation provides separate appearance and color palette state,
provider-backed controls, persistence, and reduced-motion behavior. Those
contracts transfer to native. DOM element references, CSS classes, localStorage,
React DOM flushing, server cookies, and View Transition snapshots do not.

The native implementation therefore has five boundaries:

1. `uitheme-rn/core`: an observable preference store with no native imports. It
   restores versioned preferences, protects choices made during restoration,
   and orders asynchronous writes.
2. `uitheme-rn`: React context and native Appearance subscriptions. Each provider
   owns a store. Appearance determines the resolved mode when the preference is
   system. Explicit preferences leave OS settings unchanged. The accessibility
   hook handles live reduced-motion changes.
3. `uitheme-rn/expo`: optional Expo UI controls with a resolved-mode Host. Expo
   provides SwiftUI and Compose behavior, including press and selection feedback.

4. `uitheme-rn/reanimated`: optional color-transition styles. Reanimated owns the
   frames and interruptions. The hook delays arming until hydration commits and
   removes transitions when Reduce Motion is enabled. The separate entry imports
   the public root to share its provider context with the app.
5. `uitheme-rn/transitions`: optional Skia screen snapshots and Reanimated effects
   for appearance and palette commands. The existing preference store remains
   authoritative. Reduced motion and web rendering use immediate changes.

The app owns navigation, safe areas, launch-screen dismissal, status bars, and
any app-wide Appearance override. Storage is injected; the example uses Expo
SQLite's key-value adapter. The provider captures configuration on mount, rather
than attempting to swap databases or palette contracts during restoration.

The optional transition changes colors over 180 ms. Native menus, navigation
headers, and status bars update through platform APIs. The package does not try
to drive SwiftUI or Compose internals with React Native animated styles.

## Circular reveal evaluation

A circular reveal would need a captured old screen, an overlay, and a mask whose
radius reaches the farthest corner. A React Native view capture does not prove
coverage of a native navigation header, system bars, or presented native menus.
A reliable full-window implementation needs platform-specific capture and mask
handling, interruption cleanup, app-background handling, and accessibility focus
protection. Capture delay and texture memory must be measured on real devices.

Duplicating the interactive screen tree would also duplicate state and
accessibility nodes. Hiding a snapshot from accessibility avoids duplicate focus
but does not establish that all native content was captured. These are separate
problems from animating a view's colors.

The package now also exposes `uitheme-rn/transitions`, following the requested
[Snack reference](https://snack.expo.dev/@mariops03/react-native-theme-transition?platform=ios).
This optional entry captures the provider's view tree with Skia, commits the
existing preference store behind a painted overlay, captures the target, and
animates a shader with Reanimated. Both appearance and palette commands share this
pipeline. It adds no second preference store and no app-wide Appearance override.
Nine effects use one UI-runtime progress value. Refs stay on the React Native
runtime; only measured points and primitive shader options cross to a worklet.

The overlay is hidden from accessibility and blocks touches during capture and
playback. Live Reduce Motion, backgrounding, rotation, and unmount cancel playback
and release images. Capture failure commits an immediate preference change.
Startup restoration and system appearance updates do not trigger capture. Two
CPU-backed images trade memory for cross-context snapshot reliability. Native
windows outside the provider and system bars are outside the capture boundary.
The example's web export uses immediate changes and does not mount a Skia canvas.
Release performance, Android capture coverage, and screen-reader interaction still
need device evidence; the API does not claim full OS-window capture.

The reference app starts from create-expo-app's SDK 57 template. It has settings, preview, and transition playground routes under `src/app`, with app tokens in
`src/theme`. It imports built public package entries rather than library source.

Sources consulted: [React Native Appearance](https://reactnative.dev/docs/appearance),
[AccessibilityInfo](https://reactnative.dev/docs/accessibilityinfo),
[SDK 57 Picker](https://docs.expo.dev/versions/v57.0.0/sdk/ui/universal/picker/),
and [SDK 57 SQLite](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/).

Transition sources: [Reanimated CSS transitions](https://docs.swmansion.com/react-native-reanimated/docs/category/css-transitions/),
[SDK 57 Reanimated](https://docs.expo.dev/versions/v57.0.0/sdk/reanimated/),
and [Expo view capture](https://docs.expo.dev/versions/latest/sdk/captureRef/).

## Optional styling adapters

Two additional boundaries bring the total to seven:

6. `uitheme-rn/nativewind`: NativeWind v5 scoped CSS classes and
   `VariableContextProvider` for TypeScript palettes. A CSS color bridge exposes
   selected variables to native controls without duplicating values in a palette
   object. The web branch reads inherited computed CSS variables after mounting.
7. `uitheme-rn/uniwind`: registered scoped themes for CSS palettes and scoped
   variables for TypeScript palettes. It uses no global theme mutation.

The adapters import the public root entry to share the same React context.
A nested UIThemeProvider resets resolved colors, so independent providers do not
inherit another provider's native palette. The preference store owns appearance
and palette selection; the styling engine owns CSS compilation and scoped color
resolution. The screen transition provider sits below the adapter.

The two standalone Expo examples use Tailwind v4 and built package entries.
A sync script extracts all 32 OKLCH color tokens from each of the Next example's
six light/dark palettes. Generated engine syntax differs, while token names,
aliases, and values remain shared with the web app. NativeWind is pinned to v5
RC0; its current prerelease status is documented rather than presented as stable.
