# uitheme-web

https://github.com/user-attachments/assets/2819cf70-c474-478e-b821-6b26457c8d4a

Animated light and dark mode for your web app, with support for color themes
when one look isn't enough, so one app can carry several design systems. The
controls come ready-made from the registry, installed via its CLI (or the shadcn
CLI).

- Light, dark and system modes
- Color palettes that work on top of either mode
- Seven built-in transitions, powered by the View Transitions API
- Respects reduced motion, and falls back gracefully in older browsers
- No flash on load with Next.js, TanStack Start and Nuxt
- Remembers the choice and syncs it across tabs
- React, Next.js, TanStack Start, Vue and Nuxt from one package
- No Tailwind or design system required

Try it on [ui-theme.dev](https://www.ui-theme.dev).

## Install

```sh
npm install uitheme-web
```

## Use

Wrap your app in the provider, and choose a transition:

```tsx
import { UIThemeProvider } from 'uitheme-web/react';

export function App() {
  return (
    <UIThemeProvider animationType="slide">
      <YourApp />
    </UIThemeProvider>
  );
}
```

Then switch themes from anywhere:

```tsx
import { useUITheme } from 'uitheme-web/react';

function ThemeToggle() {
  const { resolvedTheme, switchTheme } = useUITheme();

  return (
    <button
      onClick={() => switchTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      Toggle theme
    </button>
  );
}
```

That's it. Style dark mode with the `dark` class, like you already do.

## Don't want to build the toggle?

Grab a ready-made one. The CLI sets up the provider and drops the control
straight into your codebase, so it's yours to tweak:

```sh
npx uitheme-cli init
npx uitheme-cli add theme-toggle
```

Already on shadcn? [Add the registry](https://www.ui-theme.dev/docs/installation#install-with-shadcn)
and use `npx shadcn@latest add @uitheme/theme-toggle`.

[Browse all the controls →](https://www.ui-theme.dev/docs/components)

## Using another framework?

Each one has a short guide:
[Next.js](https://www.ui-theme.dev/docs/guides/nextjs) ·
[TanStack Start](https://www.ui-theme.dev/docs/guides/tanstack-start) ·
[Vue](https://www.ui-theme.dev/docs/guides/vue) ·
[Nuxt](https://www.ui-theme.dev/docs/guides/nuxt)

Building for mobile? Check out
[`uitheme-rn`](https://www.npmjs.com/package/uitheme-rn) for React Native.

Coming from v1? The [migration guide](https://www.ui-theme.dev/docs/migration)
walks you through it.

## Documentation

Palettes, transition options, the full API and more live at
[ui-theme.dev/docs](https://www.ui-theme.dev/docs).

## License

MIT
