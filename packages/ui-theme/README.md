# uitheme-web

Web framework agnostic UI theme switching library. Built with a framework-agnostic core and React adapter. Additional framework support planned for future releases.

## UI-Theme version 1 release

Introducing version 1 of `uitheme-web`, a comprehensive solution for managing UI themes across web applications. This release marks a significant milestone in our journey to provide developers with a robust, flexible, and easy-to-use theming library, that supports all web javascript UI frameworks.

## Installation

```bash
npm install uitheme-web
```

```bash
pnpm add uitheme-web
```

```bash
yarn add uitheme-web
```

## Migrating from `@ui-theme/web`

This package was published under the name `@ui-theme/web` before the rename. That name is deprecated. Run the migration command to move a project across:

```bash
npx uitheme-web migrate
```

The command lists the files it will change and asks for confirmation. It then rewrites the import specifiers, the Tailwind `@source` path, and the dependency in `package.json`. The entry point names stay the same, so `/core`, `/react` and `/tanstack` are unchanged.

| Option        | Effect                                  |
| ------------- | --------------------------------------- |
| `--yes`       | Rewrite without asking for confirmation |
| `--cwd <dir>` | Work on a project in another directory  |
| `--help`      | Show the help                           |

The command skips `node_modules`, `dist`, `.next` and other build output. It does not change prose in your markdown files.

## Tailwind Setup For Prebuilt Components

`UIThemeSwitcher`, `UIThemeSelector`, and the bundled select primitives use Tailwind utility classes. `uitheme-web` does not ship a compiled CSS file for those components, so the consuming app must include the package in Tailwind's source scan.

For Tailwind v4, add an `@source` directive next to your Tailwind import:

```css
@import 'tailwindcss';
@source '../node_modules/uitheme-web/dist';
```

Adjust the relative path to match your app structure.

If you are using the prebuilt components without this setup, the controls will mount but the expected borders, spacing, typography, hover states, and dropdown styling will be missing because Tailwind never sees the classes inside the installed package.

## Provider Selection

Choose the right provider for your framework:

| Provider                | Best For                       | Key Features                                     |
| ----------------------- | ------------------------------ | ------------------------------------------------ |
| UIThemeProvider         | All React apps                 | Universal provider with full feature set         |
| NextUIThemeProvider     | Next.js, Remix, SSR frameworks | Pre-hydration script, CSP support, animations    |
| TanStackUIThemeProvider | TanStack Start apps            | Isomorphic rendering, useHydrated() integration  |
| ViteUIThemeProvider     | Vite React SPAs                | Lightweight, transition control, no SSR overhead |

## Quick Start

### React

Basic pattern that works across all providers:

```tsx
import { UIThemeProvider, useUITheme } from 'uitheme-web/react';

function App() {
  return (
    <UIThemeProvider defaultTheme="system" defaultColorTheme="default">
      <YourApp />
    </UIThemeProvider>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme, ref } = useUITheme();

  return (
    <button ref={ref} onClick={() => toggleTheme()}>
      {theme === 'light' ? 'Dark' : 'Light'}
    </button>
  );
}
```

**Framework Setup Guides:**

- [Next.js / SSR Setup Guide](../../docs/nextjs-setup.md) - Complete guide with App Router, Pages Router, CSP support
- [TanStack Start Setup Guide](../../docs/tanstack-start-setup.md) - Isomorphic rendering, hydration-safe patterns
- [Vite React SPA Setup Guide](../../docs/vite-setup.md) - Client-side setup, flash prevention, routing

## Animated mode and palette changes

Use `switchColorTheme`, `toggleColorTheme`, or `createColorThemeToggle` for animated palettes. `setTheme` and `setColorTheme` remain immediate setters. Every provider and the standalone hook accepts the same transition options:

```tsx
const { toggleTheme, switchColorTheme } = useTheme({
  colorThemes: ['default', 'ocean', 'rose'],
});

<button onClick={(event) => void toggleTheme({
  element: event.currentTarget,
  animationOff: event.detail === 0,
})}>Toggle mode</button>

<button onClick={(event) => void switchColorTheme('ocean', {
  element: event.currentTarget,
  animationOff: event.detail === 0,
})}>Ocean palette</button>
```

`element` uses the trigger's center. `origin: { x, y }` overrides it with viewport-relative **CSS pixels**, without multiplying by `devicePixelRatio`. Without either option, the hook uses its existing button `ref`; attach a shared ref to only one trigger. Slide transitions need no trigger. Boolean calls such as `toggleTheme(true)` still disable animation.

`ThemeTransitionInput` is `boolean | { element?: Element | null; origin?: { x: number; y: number }; animationOff?: boolean }`. Color helpers now return `Promise<void>`; existing fire-and-forget calls still work. `toggleColorTheme` and `createColorThemeToggle('ocean')` can be used directly as `onClick`, reading the clicked element and skipping keyboard motion.

The default is 400 ms with `cubic-bezier(0.32, 0.72, 0, 1)`: a steep curve for a full-viewport reveal. Explicit durations are respected at every display size. `blurAmount` is now a feather width in CSS pixels, capped at 20 px; the gradient softens the edge without blurring the page content. Unsupported browsers, failed/skipped captures, missing circle origins, and reduced motion apply the theme without a reveal. New requests interrupt older transitions; CSS transitions are suppressed only during library-owned captures and playback.

Core consumers can call `runThemeTransition(update, config)` to handle capture, scoped styles, interruption, and cleanup. The React hook uses this runner internally. Low-level animation helpers should be called **after** `transition.ready` with caller-managed pseudo-element styles. They return native `Animation` handles; cancel them when done. `styleId` remains accepted for compatibility; the native animation path no longer creates a timer-owned stylesheet with that ID.

[Research, browser verification, and performance evidence](../../docs/theme-transition-verification.md).

## API Reference

### Shared Hook Return (All Providers)

All providers expose the same hook interface:

| Property               | Type                                                                  | Description                        |
| ---------------------- | --------------------------------------------------------------------- | ---------------------------------- |
| theme                  | Theme                                                                 | Current theme                      |
| colorTheme             | ColorTheme                                                            | Current color theme                |
| resolvedTheme          | 'light' \| 'dark'                                                     | Resolved theme (system → actual)   |
| systemTheme            | 'light' \| 'dark'                                                     | OS theme preference                |
| ref                    | RefObject<HTMLElement>                                                | Ref for animation origin           |
| setTheme               | (theme: Theme) => void                                                | Set theme instantly                |
| setColorTheme          | (colorTheme: ColorTheme) => void                                      | Set color theme                    |
| switchTheme            | (theme: Theme, options?: ThemeTransitionInput) => Promise<void>       | Switch with animation              |
| switchColorTheme       | (colorTheme: string, options?: ThemeTransitionInput) => Promise<void> | Switch color theme with animation  |
| toggleTheme            | (options?: ThemeTransitionInput) => Promise<void>                     | Toggle light/dark                  |
| toggleLightTheme       | (options?: ThemeTransitionInput) => Promise<void>                     | Toggle to light                    |
| toggleDarkTheme        | (options?: ThemeTransitionInput) => Promise<void>                     | Toggle to dark                     |
| toggleColorTheme       | ColorThemeToggle                                                      | Toggle between color themes        |
| createColorThemeToggle | (colorTheme: string) => ColorThemeToggle                              | Create color theme toggle          |
| isColorThemeActive     | (colorTheme: string) => boolean                                       | Check if color theme active        |
| switchThemeFromElement | (theme: Theme, element: HTMLElement) => Promise<void>                 | Switch with animation from element |

### Provider Props

| Prop                      | UITheme | NextUITheme | TanStackUITheme | ViteUITheme | Type                | Default                     |
| ------------------------- | ------- | ----------- | --------------- | ----------- | ------------------- | --------------------------- |
| defaultTheme              | ✓       | ✓           | ✓               | ✓           | Theme               | 'system'                    |
| defaultColorTheme         | ✓       | ✓           | ✓               | ✓           | ColorTheme          | 'default'                   |
| themes                    | ✓       | ✓           | ✓               | ✓           | Theme[]             | ['light', 'dark', 'system'] |
| colorThemes               | ✓       | ✓           | ✓               | ✓           | ColorTheme[]        | ['default']                 |
| animationType             | ✓       | ✓           | ✓               | ✓           | ThemeAnimationType  | CIRCLE                      |
| clipPathDirection         | ✓       | ✓           | ✓               | ✓           | TransitionDirection | 'top-left'                  |
| animationPosition         | ✓       | ✓           | ✓               | ✓           | AnimationPosition   | trigger / center fallback   |
| logo                      | ✓       | ✓           | ✓               | ✓           | string (SVG URL)    | -                           |
| logoWidth                 | ✓       | ✓           | ✓               | ✓           | number or "auto"    | 96 / aspect ratio           |
| logoHeight                | ✓       | ✓           | ✓               | ✓           | number or "auto"    | aspect ratio                |
| gradientWidth             | ✓       | ✓           | ✓               | ✓           | number (CSS px)     | 80                          |
| duration                  | ✓       | ✓           | ✓               | ✓           | number              | 400                         |
| storageKey                | ✓       | ✓           | ✓               | ✓           | string              | varies                      |
| colorStorageKey           | ✓       | ✓           | ✓               | ✓           | string              | varies                      |
| nonce                     | ✗       | ✓           | ✗               | ✗           | string              | -                           |
| disablePreHydrationScript | ✗       | ✓           | ✗               | ✗           | boolean             | false                       |
| disableTransitionOnChange | ✗       | ✗           | ✗               | ✓           | boolean             | false                       |
| onThemeChange             | ✓       | ✓           | ✓               | ✓           | function            | -                           |
| onColorThemeChange        | ✓       | ✓           | ✓               | ✓           | function            | -                           |

### Components

**UIThemeSwitcher**: Pre-built theme toggle buttons with animations  
**UIThemeSelector**: Dropdown selector for color themes

See framework-specific guides for component usage examples.

---

<details>
<summary>CSS Variables Setup</summary>

Define theme variables in your global CSS file:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
}

/* Color theme variants */
.theme-blue {
  --primary: 221.2 83.2% 53.3%;
}

.theme-blue.dark {
  --primary: 217.2 91.2% 59.8%;
}

.theme-green {
  --primary: 142.1 76.2% 36.3%;
}

.theme-green.dark {
  --primary: 142.1 70.6% 45.3%;
}
```

</details>

<details>
<summary>Browser Support</summary>

- Animated reveals require View Transitions and animation of transition pseudo-elements.
- Fallback: unsupported browsers apply the theme immediately.
- Reduced Motion: Respects prefers-reduced-motion
- Framework Support: React 18+

</details>

<details>
<summary>Advanced Configuration</summary>

### Animation Control

Choose `CIRCLE`, `BLUR_CIRCLE`, `SLIDE`, `CLIP_PATH`, `POLYGON_GRADIENT`,
`TRIANGLE`, or `SVG_LOGO` from `ThemeAnimationType`. All effects also apply to
animated color-palette changes. GIF effects are not included.

```tsx
import { ThemeAnimationType, UIThemeProvider } from 'uitheme-web/react';

<UIThemeProvider
  animationType={ThemeAnimationType.CLIP_PATH}
  clipPathDirection="top-right"
  duration={400}
>
  <App />
</UIThemeProvider>;
```

`CLIP_PATH` is a sharp polygon wipe; `POLYGON_GRADIENT` feathers its leading edge.
Both accept `clipPathDirection` in clockwise order: `top-left`, `top`,
`top-right`, `right`, `bottom-right`, `bottom`, `bottom-left`, `left`.
`POLYGON_GRADIENT` also accepts `gradientWidth` (default: 80 CSS pixels, capped
relative to the mask size).

For circle, blurred circle, or triangle effects, `animationPosition` can be
any of those eight positions, `center`, or `trigger`. The trigger uses the clicked
element or attached ref. Triangle effects fall back to the viewport
center when no trigger is available. An explicit per-call `origin` takes precedence.

### SVG logo transition

Pass a self-contained SVG file URL, such as `/brand.svg`, a bundler asset import,
or a blob URL created from a file input. The SVG is displayed at a fixed size in
the viewport center while a circular theme reveal expands underneath it. The
logo stays still and fades out over the final 15% of the transition.

```tsx
<UIThemeProvider
  animationType={ThemeAnimationType.SVG_LOGO}
  logo="/brand.svg"
  logoWidth={120}
  duration={600}
>
  <App />
</UIThemeProvider>
```

`logoWidth` and `logoHeight` accept positive CSS-pixel dimensions or `"auto"`. Either dimension
alone preserves the SVG aspect ratio; both dimensions define a box with
`object-fit: contain`. Without either, width defaults to 96 px. The SVG effect
always uses the viewport center, including when a trigger or another animation
position is provided. The logo retains its artwork colors.

The hook preloads and decodes the logo before capture. If it is still loading,
invalid, unavailable, or not an SVG, that toggle uses the circle effect instead
of waiting. Core consumers can `await preloadThemeLogo(url)` before starting a
transition. Use transparent backgrounds and a suitable `viewBox`; preserve the
logo's intrinsic aspect ratio. SVG markup is loaded as an image, never inserted
into the page.

These options work with all four providers, `useTheme`, `UIThemeSwitcher`, and
`UIThemeSelector`. Reduced motion applies the theme immediately.

See [animation options and browser verification](../../docs/theme-animation-options.md)
for the effect gallery, research, and testing boundaries.

```tsx
const { switchTheme, toggleTheme } = useUITheme();

// With animation (default)
await switchTheme('dark');

// Without animation
await switchTheme('dark', true);
await toggleTheme(true);
```

### Custom Hook Usage

```tsx
import { useTheme } from 'uitheme-web/react';

const { theme, toggleTheme, ref } = useTheme({
  animationType: ThemeAnimationType.BLUR_CIRCLE,
  duration: 750,
  colorThemes: ['default', 'blue', 'green'],
  onThemeChange: (theme) => console.log('Theme:', theme),
});
```

</details>

## Features

- Multiple theme support (light, dark, system)
- Framework-agnostic core
- Persistent theme storage
- SSR/SSG compatible
- Tree-shakeable
- TypeScript support
- Zero dependencies (per framework)

## License

MIT

Use `logoLight` and `logoDark` together instead of `logo` to select the current theme’s asset: `logoDark` for dark-to-light, `logoLight` for light-to-dark. Use a light or white `logoDark` on the dark interface and a dark or black `logoLight` on the light interface. Both are required; combining the pair with `logo` is rejected.

When one dimension is set and the other omitted, the omitted dimension defaults to `"auto"` and preserves the SVG aspect ratio. Explicit `"auto"` for both uses the SVG’s intrinsic size. With both omitted, the existing 96 px default width is preserved.

All built-in controls share the active state from any of the four providers.
Outside a provider, they own their standalone state. Keyboard selection inside
the dropdown portal skips moving reveals.

`useHydrated()` is exported from `uitheme-web/react`. For TanStack server/cookie
callbacks, use `onServerError={(error) => ...}` to observe failed notifications;
otherwise failures are reported through `console.error` without unhandled promise
rejections.
