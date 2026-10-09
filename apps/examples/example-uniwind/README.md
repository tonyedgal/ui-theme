# UI-Theme uniwind example

Expo SDK 57 example using built `uitheme-rn` entries and Tailwind CSS v4.

From the monorepo root:

```sh
pnpm --filter uitheme-rn build
pnpm --filter example-uniwind start
```

The CSS uses all 32 color tokens from each light/dark palette in
`example-next/app/globals.css`. Run `pnpm sync:colors` here to refresh both
styling examples. The original values remain OKLCH; the styling engine compiles
native colors. Theme metadata contains labels and scope names only.

Compare the utility class sample with the native style sample. Switch appearance
and palettes to exercise screen transitions. The nested TypeScript sample uses
an independent provider and verifies that existing native palettes still work.

NativeWind uses 5.0.0-rc.0 plus react-native-css 3.1.0-rc.0 (prerelease).
Uniwind uses 1.12.2. Each app installs only its chosen styling engine.

`pnpm typecheck`, `pnpm lint`, and `pnpm build` check the example. The export
includes iOS, Android, and web bundles; an export does not establish device QA.

The Transition style section offers Fade, Circle, Wipe, Slide, Split, Heart,
Star, Pixelize, and Dissolve. Circle is selected when the screen opens. Select a
style, then change appearance or a palette to use that effect. The selector is
disabled while a transition runs. Reduce Motion still applies changes immediately.

## Local iPhone build

This app uses bundle identifier `com.tonyedgal.uithemeuniwind` and iOS scene
support. A signed Release build embeds JavaScript and does not require Metro.
Generated `ios/` files remain local; regenerate them with Expo prebuild.
