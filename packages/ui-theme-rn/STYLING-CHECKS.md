# Styling integration acceptance

Define before implementing the adapters. Verify with built public package entries.

- Native styles: existing palettes, useThemeColors, native controls, and screen
  effects work with no NativeWind, Uniwind, or Tailwind installation.
- TypeScript palettes: both optional engines render the same semantic colors as
  native style objects when appearance or colorTheme changes.
- CSS themes: CSS owns values; a palette manifest contains only labels and the
  engine's light/dark class or theme names. Native colors read the selected CSS
  variables, without duplicate TypeScript color definitions.
- System: palette changes preserve System and follow later OS changes.
- Scope: independent providers do not modify engine globals or OS Appearance.
- Animation: both snapshots include the styling engine's selected variables;
  reduced motion applies changes immediately.
- Missing CSS variables or palette mappings: fail with a useful error rather than
  silently rendering default palette colors. Native dynamic colors remain usable
  with native styles; CSS conversion rejects values that cannot be represented.
- Distribution: ESM/CJS entries and declarations exist, optional peers remain
  optional, and the core/root do not import either engine.
- Examples: separate NativeWind and Uniwind apps typecheck, export, and render;
  compare selected CSS colors with native style samples on a running screen.

## Verification on 2026-10-09

- Package: seven ESM/CJS entry points and declarations build. Packed consumer
  checks pass with neither styling engine required by root/core. Existing nine
  store tests pass. Library, original Expo app, and both styling apps typecheck.
- Both styling apps export iOS, Android, and web bundles. NativeWind uses
  5.0.0-rc.0/react-native-css 3.1.0-rc.0/Tailwind 4.3.1; Uniwind uses
  1.12.2/Tailwind 4.3.1. Lint passes for the package and both examples.
- iPhone 16 Pro simulator, iOS 18.6, Expo Go: all six imported palettes render in
  light and dark modes in both engines. Utility samples and native style samples
  show matching compiled colors. The independent nested TypeScript palette
  stays blue while outer CSS palettes change. Appearance and palette commands
  enter Playing and finish Ready. Palette changes preserve selected System mode.
- Both engines on web: light/dark and Supabase selection update CSS/native samples;
  NativeWind reads inherited computed variables; Uniwind resolves scoped variables. Web commands apply
  immediately, as designed.
- Original web OKLCH color declarations are copied exactly by sync:colors. The
  mobile stylesheet does not copy web layout, shadow, font, or animation rules.
- These checks establish development runtime behavior. Android device rendering,
  release device performance, and physical screen-reader interaction remain
  separate checks. No NativeWind v4 or future v5 release compatibility is claimed.
