# uitheme-rn

Native appearance and independent color palettes for React Native. The provider
and hooks have no Expo, DOM, CSS, Reanimated, or storage dependency. Optional
controls in `uitheme-rn/expo` use SwiftUI on iOS and Jetpack Compose on Android.

## Install

```sh
pnpm add uitheme-rn@alpha
# Optional native controls in an Expo SDK 56 or 57 app:
npx expo install @expo/ui
```

Version `0.1.0-alpha` is intended for early testing. Device validation is still
in progress.
The reference app uses SDK 57, React 19.2.3, and React Native 0.86.3. The declared
React Native range begins at 0.83; older versions in that range still need device
verification. Expo is required only for the `/expo` entry point.

Animation peers are restricted to Reanimated 4.5.x, Worklets 0.10.x, and Skia
2.11.x. These ranges prevent npm from selecting incompatible animation engines.
NativeWind support targets exactly `5.0.0-rc.0`. Newer engine versions need a
separate compatibility check. See
[the release review](https://github.com/tonyedgal/ui-theme/blob/main/docs/native-stable-release-readiness.md) for the current
validation scope and remaining gates.

## Provider

```tsx
import { UIThemeProvider, useUITheme } from 'uitheme-rn';
import { UIThemeSelector, UIColorThemeSelector } from 'uitheme-rn/expo';
import Storage from 'expo-sqlite/kv-store';

export default function App() {
  return (
    <UIThemeProvider storage={Storage} fallback={null}>
      <Settings />
    </UIThemeProvider>
  );
}

function Settings() {
  return (
    <>
      <UIThemeSelector />
      <UIColorThemeSelector />
    </>
  );
}
```

Install example storage with `npx expo install expo-sqlite`. Storage is optional.
Without an adapter, preferences remain in memory. An adapter needs `getItem`
and `setItem`; each may be synchronous or asynchronous. AsyncStorage also
implements this contract. For MMKV, map `getString(key) ?? null` and `set(key, value)`.
Theme preferences are not secrets and do not need SecureStore.

`fallback` is optional. Omit it to render defaults during restoration; pass
`null` to delay the app and retain your launch screen until preferences restore.
Call `SplashScreen.hideAsync()` in a mounted descendant after `isHydrated` is
true, as the reference app does. A failed storage read also completes hydration.

Provider options are captured on mount. Change the provider's `key` to replace
palettes, storage, defaults, or the error handler. Each provider owns its state.
The package never overrides the app-wide `Appearance` setting.

## State and actions

```tsx
const {
  theme, // 'system' | 'light' | 'dark': user preference
  resolvedTheme, // 'light' | 'dark': currently displayed mode
  systemTheme,
  colorTheme,
  colors,
  palettes,
  colorThemes,
  isHydrated,
  setTheme,
  setColorTheme,
  toggleTheme,
  toggleColorTheme,
  flush,
} = useUITheme();
```

`setTheme('system')` follows React Native Appearance updates. `toggleTheme()`
selects the opposite of the resolved mode and leaves system mode. Palettes do
not change when appearance changes. Setters update synchronously and reject
unknown choices. `flush()` waits for restoration and queued writes; storage
failures reach `onStorageError` while in-memory changes stay usable. Setters do
not await disk or pretend to run a browser-style transition.

The store persists a versioned record under `uitheme-rn:preferences`, configurable
with `storageKey`. Unknown versions and invalid fields fall back to defaults.
User input wins over a late read, independently for each preference. Writes
are serialized. Call `flush()` before an app-owned shutdown flow when possible;
JavaScript cannot guarantee a write completes after the OS kills the process.

## Palettes and tokens

```tsx
import { defaultPalettes, type ThemePalette } from 'uitheme-rn';

const palettes = {
  ...defaultPalettes,
  forest: {
    label: 'Forest',
    light: { ...defaultPalettes.default.light, accent: '#216E46' },
    dark: { ...defaultPalettes.default.dark, accent: '#80D6A5' },
  },
} satisfies Record<string, ThemePalette>;
```

Pass `palettes` and optionally `defaultColorTheme` to the provider. Without an
explicit default, the first palette is used. Each palette supplies `background`,
`surface`, `text`, `secondaryText`, `separator`, `accent`, and `onAccent` in both
modes. Values are React Native `ColorValue`; opaque platform colors are accepted.
Explicit mode colors are useful when the app's mode differs from the OS.
Platform semantic colors follow the native host's appearance, so coordinate
them with app-wide appearance if using them outside an Expo UI Host.

`themeTokens` supplies a 4-point spacing scale, continuous corner radii, and
system-font text styles. Text still scales with the device. `useThemeColors()`
returns the active palette. Custom app-specific tokens belong in the app's
theme module, composed with these tokens.

## Native controls

Each control owns an Expo UI Host with the resolved color scheme:

- `UIThemeSelector`: appearance picker; supports `label`, translated `labels`,
  `disabled`, and `testID`.
- `UIColorThemeSelector`: palette picker with palette labels; supports `label`,
  `disabled`, and `testID`.
- `UIThemeSwitcher`: native button for light/dark; supports `label` and `disabled`.

For custom settings composition, use `useUITheme()` with your own `@expo/ui`
controls. Native control feedback and navigation transitions stay platform-owned.
The root and Expo entries do not mount snapshots or duplicate screen trees.
Screen snapshots are opt-in through the separate transition entry.
`useReducedMotion()` observes the accessibility setting and starts conservatively
enabled until the first native query finishes. Use it for custom app motion.

For headless integrations, `uitheme-rn/core` exports `createThemeStore` and its
types without importing React Native. The React provider subscribes with
`useSyncExternalStore`.

## Optional theme transitions

Install the SDK-compatible animation peers in an Expo app:

```sh
npx expo install react-native-reanimated react-native-worklets
```

```tsx
import Animated from 'react-native-reanimated';
import { useUITheme } from 'uitheme-rn';
import { useThemeTransition } from 'uitheme-rn/reanimated';

function Card() {
  const { colors } = useUITheme();
  const transition = useThemeTransition();

  return (
    <Animated.View
      style={{
        ...transition.view,
        backgroundColor: colors.surface,
        borderColor: colors.separator,
        borderWidth: 1,
        padding: 16,
      }}
    >
      <Animated.Text style={{ ...transition.text, color: colors.text }}>
        Your theme, on your device.
      </Animated.Text>
    </Animated.View>
  );
}
```

`useThemeTransition()` returns `view` and `text` styles. View styles transition
background and border colors. Text styles also transition text color. Each uses
180 ms and an ease-out curve. Apply the styles to Reanimated components; ordinary
React Native components cannot run these transitions. Existing screens opt in
without changing their tree, scroll position, or focus.

The hook arms after the hydrated colors commit to a frame. Mounting and preference
restoration stay immediate. Live Reduce Motion changes remove the transition
configuration and apply the final colors. Rapid changes are handled by
Reanimated's transition engine; there is no completion callback that can restore
an old preference. Setters and persistence remain synchronous and independent
of animation completion. Unmounting cancels the pending frame used to arm motion.

Interpolating light and dark text against an interpolating background can briefly
reduce contrast. The recorded example shows this in intermediate frames. For
screens that need continuous reading, apply `transition.view` to surfaces and
set text colors immediately. Text transitions are opt-in through `transition.text`.

Use explicit string colors for predictable interpolation. Native semantic colors
remain useful for platform-owned controls; do not assume their internal appearance
animates through these styles. Expo UI Hosts, native navigation headers, and status
bars update to the resolved theme through their own APIs. The reference app keeps
those native elements outside the Reanimated color transition.

The animation entry requires the New Architecture, Reanimated 4.5.1 and compatible
Worklets. The reference app verifies the SDK 57 pair, Reanimated 4.5.1 and Worklets
0.10.1. Bare React Native apps must configure the Worklets Babel plugin as described
in Reanimated's installation guide. The root, core, and Expo entries do not import
animation peers.

See [the transition acceptance cases](../../apps/examples/example-expo/TRANSITION-CHECKS.md)
and [the recorded checks](../../apps/examples/example-expo/VERIFICATION.md).

## Workspace verification

```sh
pnpm --filter uitheme-rn test
pnpm --filter uitheme-rn typecheck
pnpm --filter uitheme-rn build
pnpm --filter uitheme-rn test:package
pnpm --filter example-expo typecheck
pnpm --filter example-expo start
```

Use a release build on the slowest supported device to judge native feel. See
the example README for the native acceptance checklist and repeatable flows.

## Screen transitions

For the screen effects shown in the
[reference Snack](https://snack.expo.dev/@mariops03/react-native-theme-transition?platform=ios),
use the optional `uitheme-rn/transitions` entry. Install SDK-compatible Skia,
Reanimated, and Worklets through Expo. Pin Skia to `2.11.1` or a supported
2.11 patch release; SDK 57's bundled Skia 2.6.2 has a broken Android overflow
capture path. This override requires a custom native build and does not claim
Expo Go compatibility. See the
[upstream fix](https://github.com/wcandillon/react-native-skia/pull/4004). The tested pair uses Skia 2.11.1,
Reanimated 4.5.1, and Worklets 0.10.1 on Expo SDK 57.

```tsx
import { Button, View } from 'react-native';
import { UIThemeProvider, defaultPalettes } from 'uitheme-rn';
import {
  UIThemeTransitionProvider,
  useAnimatedUITheme,
} from 'uitheme-rn/transitions';

const palettes = {
  ...defaultPalettes,
  forest: {
    label: 'Forest',
    light: { ...defaultPalettes.default.light, accent: '#216E46' },
    dark: { ...defaultPalettes.default.dark, accent: '#80D6A5' },
  },
};

export default function App() {
  return (
    <UIThemeProvider palettes={palettes}>
      <UIThemeTransitionProvider defaults={{ transition: 'circularReveal' }}>
        <Controls />
      </UIThemeTransitionProvider>
    </UIThemeProvider>
  );
}

function Controls() {
  const { setTheme, setColorTheme, isTransitioning } = useAnimatedUITheme();

  return (
    <View>
      <Button
        title="Dark mode"
        disabled={isTransitioning}
        onPress={() => {
          void setTheme('dark');
        }}
      />
      <Button
        title="Forest palette"
        disabled={isTransitioning}
        onPress={() => {
          void setColorTheme('forest', { transition: 'wipe' });
        }}
      />
    </View>
  );
}
```

Both commands capture the provider's native view tree before changing the same
preference store. The overlay paints the old screen before the new screen commits.
Skia captures the new screen, and a Reanimated shared value drives the shader on
the UI runtime. Participating text does not interpolate its individual colors.
Do not combine this provider with per-element color interpolation on the same tree.

Available effects are `fade`, `circularReveal`, `wipe`, `slide`, `split`, `heart`,
`star`, `pixelize`, and `dissolve`. Options include `duration`, `origin` (a view ref
or a provider-relative point), `inverted` for shape/split reveals, `direction`,
`split`, `blockSize`, `noiseSize`, and `animated`. The default duration is 350 ms.
Busy requests are rejected before preferences change. Immediate root commands
remain available through `useUITheme`; use the animated hook for screen effects.
Expo selectors accept `onValueChange`, and the switcher accepts `onPress`, so the
native controls can call animated commands without taking ownership of preferences.

Reduce Motion skips capture. Live Reduce Motion, backgrounding, rotation, and
unmount cancel the overlay. A capture failure falls back to an immediate change;
`onError` reports it. Restoration and system appearance updates use the existing
provider and do not trigger screen captures. Snapshot layers are hidden from the
accessibility tree. Touch input is blocked while capture/playback is active.

Set the transition provider's `enabled` prop to `false` while native navigation
or another movement changes the captured tree. This cancels an active overlay and
applies new choices immediately. Re-enable when movement ends. The Expo example
connects this prop to the stack's `transitionStart` and `transitionEnd` events.
Commands also skip capture while the app is not active.

The capture boundary is the provider's view tree, including navigation inside it.
System status bars, keyboards, alerts, and separate native windows remain under OS
control. Two screen images require memory proportional to their pixel dimensions.
Run [SCREEN-TRANSITION-CHECKS.md](./SCREEN-TRANSITION-CHECKS.md) before claiming
release performance or accessibility verification.

The browser fallback changes preferences immediately; it does not mount Skia or
require CanvasKit initialization. Native screen effects target iOS and Android.

## Styling systems and CSS themes

Plain `StyleSheet`, inline native styles, and TypeScript palettes remain the
base API. Neither Tailwind nor a styling engine is required by the root entry.
Optional `uitheme-rn/nativewind` and `uitheme-rn/uniwind` adapters connect utility
classes to the same appearance and palette store. Install one engine in an app.

The NativeWind example targets `nativewind@5.0.0-rc.0` and
`react-native-css@3.1.0-rc.0` with Tailwind 4.3.1. NativeWind v5 is a release
candidate; v4 is not supported by this adapter. The Uniwind example targets
Uniwind 1.12.2 with Tailwind 4.3.1. Follow each example's Metro configuration;
NativeWind also needs the Tailwind v4 PostCSS plugin and Lightning CSS 1.30.1.

For existing TypeScript palettes, place `<NativeWindTheme>` or `<UniwindTheme>`
inside `<UIThemeProvider>`. The adapter provides scoped semantic variables.
`bg-primary`, `text-primary-foreground`, `bg-card`, `bg-background`,
`text-foreground`, `text-muted-foreground`, and `border-border` then use the
same colors as `useThemeColors()`. Native dynamic color objects remain available
with native styles; CSS conversion requires string colors.

For CSS-authored palettes, use label-only metadata and map each palette's modes:

```tsx
import { UIThemeProvider } from 'uitheme-rn';
import { NativeWindTheme } from 'uitheme-rn/nativewind';

const palettes = { supabase: { label: 'Supabase' } };
const themes = {
  supabase: { light: 'supabase-light', dark: 'supabase-dark' },
};

<UIThemeProvider palettes={palettes} defaultColorTheme="supabase">
  <NativeWindTheme themes={themes}>{/* Your app */}</NativeWindTheme>
</UIThemeProvider>;
```

For Uniwind, use `<UniwindTheme themes={themes}>` and register the selected names
in Metro's `extraThemes`. NativeWind uses CSS class names. Uniwind uses scoped
registered themes. Both adapters resolve seven colors from CSS for native
controls and hooks. Missing variables or mappings produce a useful error.

The examples preserve the Next app's raw names (`--background`, `--primary`,
etc.) and Tailwind v4 aliases (`--color-background`, `--color-primary`, etc.).
All 32 color tokens, including chart and sidebar colors, are available to
utility classes. The native `ThemeColors` contract maps its `accent` to the
primary action color (`--color-primary`); the separate CSS `--color-accent`
remains available for accent surfaces.

The six example palettes come from `example-next/app/globals.css`: Default,
Supabase, Mono, Caffeine, Mocha, and Perpetuity. Run `pnpm sync:colors` inside
either styling example after changing the web colors. The sync script copies
OKLCH values without translating or inventing palette values. Web layout,
fonts, shadows, and animation rules remain in the web stylesheet.

Place `UIThemeTransitionProvider` inside the styling adapter so captures see the
resolved CSS scope. Use `useAnimatedUITheme()` for animated appearance and
palette commands. Semantic colors follow the provider's resolved mode without
changing OS Appearance. NativeWind's global `dark:` variant still follows the
engine's system appearance; use semantic colors for provider-owned palettes.

## Snapshot performance and native surfaces

Screen effects take two snapshots of the provider's content. On the tested
Android flagship, each awaited view capture takes 113–133 ms. Capture can pause
the UI before the shader animation begins. Reanimated color transitions avoid
this snapshot path. Do not assume full-screen effects meet the same frame budget.

Disable snapshot transitions with `enabled={false}` around trees containing
Android `SurfaceView` content, such as some video and camera views. The tested
Skia capture path waits on the main thread for a callback scheduled on that
same thread, which can time out and produce incomplete capture. Such trees are
not verified for these effects. Keep system windows and native chrome outside
the capture boundary. See the stable release review for current device limits.
