# TanStack Start Setup Guide

Complete setup guide for using @ui-theme/web in TanStack Start applications with **flash-free dark mode**.

## Installation

```bash
npm install @ui-theme/web
# or
pnpm add @ui-theme/web
# or
yarn add @ui-theme/web
```

## Choose Your Approach

@ui-theme/web offers **two approaches** for preventing theme flash in TanStack Start:

| Approach                          | Flash Prevention | System Theme | Setup Complexity | Requires Server Functions |
| --------------------------------- | ---------------- | ------------ | ---------------- | ------------------------- |
| **A: Cookie-based** (recommended) | Zero flash       | CSS or JS    | Moderate         | Yes                       |
| **B: Pre-hydration script**       | Near-zero flash  | CSS or JS    | Simple           | No                        |

Both approaches support two `systemThemeMode` options:

- **`'css'`**: Applies a `'system'` class on `<html>`. Dark mode is handled purely by CSS `@media (prefers-color-scheme: dark)` — zero flash, instant system-preference matching. **Requires CSS changes.**
- **`'js'`**: Resolves system theme via `matchMedia` in JavaScript. Works with existing CSS unchanged.

---

## Option A: Cookie-Based (Recommended)

This approach stores the theme in a cookie, reads it server-side in `beforeLoad`, and renders the correct `<html>` class during SSR. **Zero flash.**

### 1. Create Server Theme Functions

Create `src/lib/theme.ts`:

```ts
import { createThemeServerFns } from '@ui-theme/web/tanstack';

export const { getThemeServerFn, setThemeServerFn, setColorThemeServerFn } =
  createThemeServerFns({
    // Optional: customize cookie keys
    // storageKey: 'theme',
    // colorStorageKey: 'color-theme',
    // defaultTheme: 'system',
    // defaultColorTheme: 'default',
  });
```

### 2. Update Root Route

In `src/routes/__root.tsx`:

```tsx
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router';
import { useEffect } from 'react';
import { TanStackUIThemeProvider } from '@ui-theme/web/react';
import {
  getThemeServerFn,
  setThemeServerFn,
  setColorThemeServerFn,
} from '@/lib/theme';
import appCss from '../globals.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'My App' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),

  // Read theme from cookie on the server
  beforeLoad: async () => {
    const themeData = await getThemeServerFn();
    return { themeData };
  },

  shellComponent: RootDocument,
  component: RootComponent,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const { themeData } = Route.useRouteContext();

  // Build the className for <html>: the theme class + color theme class
  const htmlClass = [
    themeData.theme, // 'light', 'dark', or 'system'
    themeData.colorTheme !== 'default' ? `theme-${themeData.colorTheme}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <html lang="en" className={htmlClass} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { themeData } = Route.useRouteContext();

  return (
    <TanStackUIThemeProvider
      defaultTheme="system"
      defaultColorTheme="default"
      themes={['light', 'dark', 'system']}
      colorThemes={['default', 'supabase', 'mono']}
      serverTheme={themeData.theme}
      serverColorTheme={themeData.colorTheme}
      systemThemeMode="css"
      onServerThemeChange={(theme) => setThemeServerFn({ data: theme })}
      onServerColorThemeChange={(colorTheme) =>
        setColorThemeServerFn({ data: colorTheme })
      }
    >
      <Outlet />
    </TanStackUIThemeProvider>
  );
}
```

### 3. Create Theme Toggle

```tsx
'use client';

import { useTanStackUITheme } from '@ui-theme/web/react';

export function ThemeToggle() {
  const { theme, resolvedTheme, toggleTheme, switchTheme, ref } =
    useTanStackUITheme();

  return (
    <button
      ref={ref}
      onClick={() => toggleTheme()}
      className="px-4 py-2 rounded-lg border"
    >
      {resolvedTheme === 'light' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}
```

---

## Option B: Pre-Hydration Script

This approach injects a blocking `<script>` that reads `localStorage` before React hydrates. Simpler setup, no server functions needed.

### 1. Update Root Route

In `src/routes/__root.tsx`:

```tsx
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router';
import {
  TanStackUIThemeProvider,
  TanStackStartThemeScript,
} from '@ui-theme/web/react';
import appCss from '../globals.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'My App' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),

  shellComponent: RootDocument,
  component: RootComponent,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Blocking script: reads localStorage and applies theme before paint */}
        <TanStackStartThemeScript
          defaultTheme="system"
          defaultColorTheme="default"
          systemThemeMode="js" // or 'css' if you have the CSS setup
        />
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <TanStackUIThemeProvider
      defaultTheme="system"
      defaultColorTheme="default"
      themes={['light', 'dark', 'system']}
      colorThemes={['default']}
      systemThemeMode="js" // match what you set in the script
    >
      <Outlet />
    </TanStackUIThemeProvider>
  );
}
```

### 2. Create Theme Toggle

Same as Option A — use `useTanStackUITheme()`.

---

## CSS Setup

### Standard CSS (works with both `systemThemeMode: 'js'` and `'css'`)

Your `globals.css` needs `:root` (light) and `.dark` (dark) variable blocks. This is the standard shadcn/ui pattern:

```css
@import 'tailwindcss';
@import 'tw-animate-css';

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  /* ... all your light theme variables */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... all your dark theme variables */
}
```

### CSS for `systemThemeMode: 'css'` (recommended for zero flash)

When using `systemThemeMode: 'css'`, you need to make two changes:

#### 1. Update `@custom-variant dark`

Change from:

```css
@custom-variant dark (&:is(.dark *));
```

To:

```css
@custom-variant dark {
  &:is(.dark *) {
    @slot;
  }
  @media (prefers-color-scheme: dark) {
    &:is(.system *) {
      @slot;
    }
  }
}
```

This tells Tailwind's `dark:` utilities to activate for both:

- Elements inside `.dark` (explicit dark mode)
- Elements inside `.system` when the OS prefers dark (system theme)

#### 2. Add `.system` variable block

Duplicate your `.dark` variables inside a `@media (prefers-color-scheme: dark)` block with the `.system` selector:

```css
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... your dark variables */
}

@media (prefers-color-scheme: dark) {
  .system {
    --background: oklch(0.145 0 0);
    --foreground: oklch(0.985 0 0);
    /* ... same dark variables as above */
  }
}
```

This ensures that when `<html class="system">`, the CSS variables switch to dark values purely based on the OS preference — no JavaScript needed.

#### Complete example

```css
@import 'tailwindcss';
@import 'tw-animate-css';

@custom-variant dark {
  &:is(.dark *) {
    @slot;
  }
  @media (prefers-color-scheme: dark) {
    &:is(.system *) {
      @slot;
    }
  }
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* ... rest of your @theme inline block */
}

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  /* ... light variables */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... dark variables */
}

@media (prefers-color-scheme: dark) {
  .system {
    --background: oklch(0.145 0 0);
    --foreground: oklch(0.985 0 0);
    /* ... same dark variables */
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### Color Theme CSS

Color themes use the `.theme-*` class pattern. Apply overrides for both light and dark:

```css
/* Light mode overrides for supabase theme */
.theme-supabase {
  --primary: oklch(0.65 0.15 150.3);
  --primary-foreground: oklch(1 0 0);
}

/* Dark mode overrides for supabase theme */
.theme-supabase.dark {
  --primary: oklch(0.65 0.15 150.3);
  --primary-foreground: oklch(1 0 0);
}

/* System theme dark mode overrides for supabase */
@media (prefers-color-scheme: dark) {
  .theme-supabase.system {
    --primary: oklch(0.65 0.15 150.3);
    --primary-foreground: oklch(1 0 0);
  }
}
```

---

## Advanced Configuration

### Animation Control

Control animations with the `animationOff` parameter:

```tsx
const { toggleTheme, switchTheme } = useTanStackUITheme();

// With animation (default)
await toggleTheme();

// Without animation
await toggleTheme(true);
await switchTheme('dark', true);
```

### Animation Types

Choose from three animation types:

```tsx
import { ThemeAnimationType } from '@ui-theme/web/core';

<TanStackUIThemeProvider
  animationType={ThemeAnimationType.CIRCLE} // Default
  // or ThemeAnimationType.BLUR_CIRCLE
  // or ThemeAnimationType.SLIDE
  duration={500}
>
  {children}
</TanStackUIThemeProvider>;
```

---

## API Reference

### TanStackUIThemeProvider Props

| Prop                     | Type                            | Default                       | Description                               |
| ------------------------ | ------------------------------- | ----------------------------- | ----------------------------------------- |
| defaultTheme             | Theme                           | `'system'`                    | Initial theme                             |
| defaultColorTheme        | ColorTheme                      | `'default'`                   | Initial color theme                       |
| themes                   | Theme[]                         | `['light', 'dark', 'system']` | Available themes                          |
| colorThemes              | ColorTheme[]                    | `['default']`                 | Available color themes                    |
| animationType            | ThemeAnimationType              | `'circle'`                    | Animation type                            |
| duration                 | number                          | `750`                         | Animation duration (ms)                   |
| storageKey               | string                          | `'theme'`                     | localStorage key for theme                |
| colorStorageKey          | string                          | `'color-theme'`               | localStorage key for color theme          |
| globalClassName          | string                          | `'dark'`                      | Class name for dark theme                 |
| colorThemePrefix         | string                          | `'theme-'`                    | Prefix for color theme classes            |
| serverTheme              | `'light' \| 'dark' \| 'system'` | -                             | Server-resolved theme from cookie         |
| serverColorTheme         | string                          | -                             | Server-resolved color theme from cookie   |
| systemThemeMode          | `'css' \| 'js'`                 | `'css'`                       | How to handle system theme                |
| onServerThemeChange      | `(theme: Theme) => void`        | -                             | Callback to persist theme to cookie       |
| onServerColorThemeChange | `(colorTheme: string) => void`  | -                             | Callback to persist color theme to cookie |

### TanStackStartThemeScript Props

| Prop              | Type            | Default         | Description                      |
| ----------------- | --------------- | --------------- | -------------------------------- |
| storageKey        | string          | `'theme'`       | localStorage key for theme       |
| colorStorageKey   | string          | `'color-theme'` | localStorage key for color theme |
| defaultTheme      | Theme           | `'system'`      | Default theme                    |
| defaultColorTheme | ColorTheme      | `'default'`     | Default color theme              |
| globalClassName   | string          | `'dark'`        | Class name for dark theme        |
| colorThemePrefix  | string          | `'theme-'`      | Prefix for color theme classes   |
| nonce             | string          | -               | CSP nonce for inline script      |
| systemThemeMode   | `'css' \| 'js'` | `'js'`          | How to handle system theme       |

### useTanStackUITheme Hook

| Return Value           | Type                                                      | Description                      |
| ---------------------- | --------------------------------------------------------- | -------------------------------- |
| theme                  | Theme                                                     | Current theme preference         |
| colorTheme             | ColorTheme                                                | Current color theme              |
| resolvedTheme          | `'light' \| 'dark'`                                       | Resolved theme                   |
| systemTheme            | `'light' \| 'dark'`                                       | OS theme preference              |
| isHydrated             | boolean                                                   | Whether component is hydrated    |
| ref                    | RefObject\<HTMLButtonElement\>                            | Ref for animation origin         |
| setTheme               | `(theme: Theme) => void`                                  | Set theme instantly              |
| setColorTheme          | `(colorTheme: ColorTheme) => void`                        | Set color theme                  |
| switchTheme            | `(theme: Theme, animationOff?: boolean) => Promise<void>` | Switch with animation            |
| switchColorTheme       | `(colorTheme: string) => void`                            | Switch color theme               |
| toggleTheme            | `(animationOff?: boolean) => Promise<void>`               | Toggle light/dark                |
| toggleLightTheme       | `(animationOff?: boolean) => Promise<void>`               | Switch to light                  |
| toggleDarkTheme        | `(animationOff?: boolean) => Promise<void>`               | Switch to dark                   |
| toggleColorTheme       | `() => void`                                              | Cycle color themes               |
| createColorThemeToggle | `(colorTheme: string) => () => void`                      | Create toggle for specific color |
| isColorThemeActive     | `(colorTheme: string) => boolean`                         | Check if color theme active      |
| switchThemeFromElement | `(theme: Theme, el: HTMLButtonElement) => Promise<void>`  | Switch from element              |

### createThemeServerFns (from `@ui-theme/web/tanstack`)

```ts
import { createThemeServerFns } from '@ui-theme/web/tanstack';

const { getThemeServerFn, setThemeServerFn, setColorThemeServerFn } =
  createThemeServerFns({
    storageKey?: string;       // Cookie key, default 'theme'
    colorStorageKey?: string;  // Cookie key, default 'color-theme'
    defaultTheme?: Theme;      // Default 'system'
    defaultColorTheme?: string; // Default 'default'
  });
```

- **`getThemeServerFn()`** — Returns `{ theme, themePreference, colorTheme }` from cookies
- **`setThemeServerFn({ data })`** — Sets theme cookie
- **`setColorThemeServerFn({ data })`** — Sets color theme cookie

---

## Troubleshooting

### Theme Still Flashing

**Cookie approach:** Ensure `beforeLoad` is in `__root.tsx` and `serverTheme` is passed to the provider. Check that `<html className={htmlClass}>` includes the theme class in `shellComponent`.

**Script approach:** Ensure `<TanStackStartThemeScript>` is in `<head>` before `<HeadContent>`. Verify `systemThemeMode` matches between the script and provider.

### Hydration Mismatch

Add `suppressHydrationWarning` to the `<html>` tag. This is expected because the pre-hydration script or server may set classes that differ from React's initial render.

### System Theme Not Working with CSS Mode

Ensure your `globals.css` has:

1. The updated `@custom-variant dark` block with the `.system *` media query rule
2. The `.system` variable block inside `@media (prefers-color-scheme: dark)`

### Animations Not Working

View Transitions API requires Chrome/Edge 111+. The library automatically falls back to instant switching in unsupported browsers.

## Examples

See complete working examples in the [examples directory](../examples).
