# uitheme-rn

uitheme-rn is UI-Theme for React Native. It brings light and dark mode support
to Android and iOS, and also support for color themes, so that apps can use
several design systems along with theme transitions. uitheme-rn comes with
native pickers for Android and iOS.

- Light, dark and system modes, plus palettes that work on top of either
- Nine full-screen transitions: fade, circular reveal, wipe, slide, split,
  heart, star, pixelize and dissolve
- Smooth color changes on any view with Reanimated
- Native SwiftUI and Jetpack Compose pickers through Expo UI
- Works with plain `StyleSheet`, NativeWind 5 or Uniwind
- Remembers the choice with any storage you already use
- Respects Reduce Motion
- The core has no Expo, Reanimated or storage dependency

## Install

```sh
npm install uitheme-rn
```

Want the native pickers? Add Expo UI too:

```sh
npx expo install @expo/ui
```

## Use

Wrap your app in the provider, then read the colors anywhere:

```tsx
import { Pressable, Text, View } from 'react-native';
import { UIThemeProvider, useUITheme } from 'uitheme-rn';

export default function App() {
  return (
    <UIThemeProvider>
      <Home />
    </UIThemeProvider>
  );
}

function Home() {
  const { colors, toggleTheme } = useUITheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Pressable onPress={toggleTheme}>
        <Text style={{ color: colors.text }}>Toggle theme</Text>
      </Pressable>
    </View>
  );
}
```

That's it. Every palette gives you `background`, `surface`, `text`,
`secondaryText`, `separator`, `accent` and `onAccent`, in light and dark.

## Remember the choice

Pass any storage with `getItem` and `setItem`. AsyncStorage, MMKV and Expo's
key-value store all work:

```tsx
import Storage from 'expo-sqlite/kv-store';

<UIThemeProvider storage={Storage} fallback={null}>
  <App />
</UIThemeProvider>;
```

`fallback={null}` holds rendering until the saved theme loads, so your splash
screen stays up and nothing flickers. Without storage, the choice lives in
memory.

## Native pickers

Drop in real platform controls. They're SwiftUI on iOS and Jetpack Compose on
Android:

```tsx
import {
  UIThemeSelector,
  UIColorThemeSelector,
  UIThemeSwitcher,
} from 'uitheme-rn/expo';

<UIThemeSelector />;
<UIColorThemeSelector />;
<UIThemeSwitcher />;
```

## Add your own palettes

Start from the defaults and change what you need:

```tsx
import { defaultPalettes } from 'uitheme-rn';

const palettes = {
  ...defaultPalettes,
  forest: {
    label: 'Forest',
    light: { ...defaultPalettes.default.light, accent: '#216E46' },
    dark: { ...defaultPalettes.default.dark, accent: '#80D6A5' },
  },
};

<UIThemeProvider palettes={palettes}>
  <App />
</UIThemeProvider>;
```

Then switch with `setColorTheme('forest')`. The palette stays the same when the
mode changes.

## Animate the colors

Install Reanimated, then spread the transition styles onto any animated view:

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
      style={{ ...transition.view, backgroundColor: colors.surface }}
    >
      <Animated.Text style={{ ...transition.text, color: colors.text }}>
        Hello
      </Animated.Text>
    </Animated.View>
  );
}
```

Backgrounds, borders and text fade to the new theme. Your screens keep their
scroll position and focus.

## Full-screen transitions

Want the whole screen to change at once? Add Skia, and wrap your app in the
transition provider:

```sh
npx expo install @shopify/react-native-skia react-native-reanimated react-native-worklets
```

```tsx
import { Button } from 'react-native';
import { UIThemeProvider } from 'uitheme-rn';
import {
  UIThemeTransitionProvider,
  useAnimatedUITheme,
} from 'uitheme-rn/transitions';

export default function App() {
  return (
    <UIThemeProvider>
      <UIThemeTransitionProvider defaults={{ transition: 'circularReveal' }}>
        <Home />
      </UIThemeTransitionProvider>
    </UIThemeProvider>
  );
}

function Home() {
  const { setTheme, setColorTheme, isTransitioning } = useAnimatedUITheme();

  return (
    <>
      <Button
        title="Dark mode"
        disabled={isTransitioning}
        onPress={() => setTheme('dark')}
      />
      <Button
        title="Forest"
        disabled={isTransitioning}
        onPress={() => setColorTheme('forest', { transition: 'heart' })}
      />
    </>
  );
}
```

Pick any of the nine effects per call, and tune `duration`, `origin` and
`direction`. With Reduce Motion on, the theme changes at once.

## Using NativeWind or Uniwind?

Put the adapter inside the provider, and your utility classes follow the theme:

```tsx
import { NativeWindTheme } from 'uitheme-rn/nativewind';

<UIThemeProvider>
  <NativeWindTheme>
    <App />
  </NativeWindTheme>
</UIThemeProvider>;
```

`bg-background`, `text-foreground`, `bg-primary` and friends now use the same
colors as `useUITheme()`. For Uniwind, use `UniwindTheme` from
`uitheme-rn/uniwind`.

The guides cover the setup for
[NativeWind](https://www.ui-theme.dev/docs/guides/nativewind) and
[Uniwind](https://www.ui-theme.dev/docs/guides/uniwind), including palettes
written in CSS.

## Good to know

- Full-screen transitions need a development build. They don't run in Expo Go.
- Turn them off with `enabled={false}` while a navigation animation runs, and
  around Android `SurfaceView` content such as video or camera previews.
- The status bar, keyboard and alerts belong to the OS, so they aren't part of
  the screen transition.
- The provider never changes the app-wide `Appearance` setting.

## Documentation

Start with the [Expo guide](https://www.ui-theme.dev/docs/guides/expo).

## License

MIT
