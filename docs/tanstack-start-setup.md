# TanStack Start Setup Guide

Complete setup guide for using ui-theme in TanStack Start applications with isomorphic rendering support.

## Installation

```bash
npm install ui-theme
# or
pnpm add ui-theme
# or
yarn add ui-theme
```

## Quick Start

### 1. Create Theme Provider

Create a client component in [app/components/theme-provider.tsx](app/components/theme-provider.tsx):

```tsx
'use client';

import { TanStackUIThemeProvider } from 'ui-theme/react';
import { ReactNode } from 'react';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <TanStackUIThemeProvider
      defaultTheme="system"
      defaultColorTheme="default"
      themes={['light', 'dark', 'system']}
      colorThemes={['default', 'blue', 'green']}
      animationType="circle"
      duration={500}
    >
      {children}
    </TanStackUIThemeProvider>
  );
}
```

### 2. Update Root Layout

Wrap your app in [app/routes/\_\_root.tsx](app/routes/__root.tsx):

```tsx
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { ThemeProvider } from '@/components/theme-provider';
import '@/styles/globals.css';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>My TanStack App</title>
      </head>
      <body>
        <ThemeProvider>
          <Outlet />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Important:** Add `suppressHydrationWarning` to prevent hydration warnings when theme classes are applied.

### 3. Create Theme Toggle Component

Create [app/components/theme-toggle.tsx](app/components/theme-toggle.tsx):

```tsx
'use client';

import { useTanStackUITheme } from 'ui-theme/react';

export function ThemeToggle() {
  const { theme, resolvedTheme, toggleTheme, ref } = useTanStackUITheme();

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

### 4. Use in Routes

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { ThemeToggle } from '@/components/theme-toggle';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen p-8">
      <h1>My TanStack Start App</h1>
      <ThemeToggle />
    </div>
  );
}
```

## Hydration-Safe Patterns

TanStack Start uses `useHydrated()` for hydration-safe rendering. The TanStackUIThemeProvider automatically handles this internally.

### Conditional Rendering Based on Hydration

```tsx
'use client';

import { useTanStackUITheme } from 'ui-theme/react';
import { useHydrated } from '@tanstack/react-router';

export function ThemeStatus() {
  const { theme, resolvedTheme, systemTheme } = useTanStackUITheme();
  const isHydrated = useHydrated();

  if (!isHydrated) {
    return <div>Loading theme...</div>;
  }

  return (
    <div>
      <p>Theme: {theme}</p>
      <p>Resolved: {resolvedTheme}</p>
      <p>System: {systemTheme}</p>
    </div>
  );
}
```

## CSS Variables Setup

Define your theme variables in [app/styles/globals.css](app/styles/globals.css):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --secondary: 210 40% 96.1%;
    --accent: 210 40% 96.1%;
    --muted: 210 40% 96.1%;
    --border: 214.3 31.8% 91.4%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --secondary: 217.2 32.6% 17.5%;
    --accent: 217.2 32.6% 17.5%;
    --muted: 217.2 32.6% 17.5%;
    --border: 217.2 32.6% 17.5%;
  }

  /* Color Theme Variants */
  .theme-blue {
    --primary: 221.2 83.2% 53.3%;
    --accent: 221.2 83.2% 53.3%;
  }

  .theme-blue.dark {
    --primary: 217.2 91.2% 59.8%;
    --accent: 217.2 91.2% 59.8%;
  }

  .theme-green {
    --primary: 142.1 76.2% 36.3%;
    --accent: 142.1 76.2% 36.3%;
  }

  .theme-green.dark {
    --primary: 142.1 70.6% 45.3%;
    --accent: 142.1 70.6% 45.3%;
  }
}

body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}
```

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
import { ThemeAnimationType } from 'ui-theme/core';

<TanStackUIThemeProvider
  animationType={ThemeAnimationType.CIRCLE} // Default
  // or ThemeAnimationType.BLUR_CIRCLE
  // or ThemeAnimationType.SLIDE
  duration={500}
>
  {children}
</TanStackUIThemeProvider>;
```

### Server-Side Rendering Considerations

TanStackUIThemeProvider automatically handles SSR:

- Prevents flash of unstyled content
- Synchronizes theme state across client/server
- Uses localStorage for theme persistence
- Falls back gracefully when browser APIs unavailable

## API Reference

### TanStackUIThemeProvider Props

| Prop               | Type                 | Default                     | Description                       |
| ------------------ | -------------------- | --------------------------- | --------------------------------- |
| defaultTheme       | Theme                | 'system'                    | Initial theme                     |
| defaultColorTheme  | ColorTheme           | 'default'                   | Initial color theme               |
| themes             | Theme[]              | ['light', 'dark', 'system'] | Available themes                  |
| colorThemes        | ColorTheme[]         | ['default']                 | Available color themes            |
| animationType      | ThemeAnimationType   | 'circle'                    | Animation type                    |
| duration           | number               | 500                         | Animation duration (ms)           |
| storageKey         | string               | 'ui-theme'                  | LocalStorage key for theme        |
| colorStorageKey    | string               | 'ui-color-theme'            | LocalStorage key for color theme  |
| onThemeChange      | (theme) => void      | -                           | Callback when theme changes       |
| onColorThemeChange | (colorTheme) => void | -                           | Callback when color theme changes |

### useTanStackUITheme Hook

| Return Value           | Type                                                    | Description                       |
| ---------------------- | ------------------------------------------------------- | --------------------------------- |
| theme                  | Theme                                                   | Current theme                     |
| colorTheme             | ColorTheme                                              | Current color theme               |
| resolvedTheme          | 'light' \| 'dark'                                       | Resolved theme                    |
| systemTheme            | 'light' \| 'dark'                                       | OS theme preference               |
| ref                    | RefObject<HTMLElement>                                  | Ref for animation origin          |
| setTheme               | (theme: Theme) => void                                  | Set theme instantly               |
| setColorTheme          | (colorTheme: ColorTheme) => void                        | Set color theme                   |
| switchTheme            | (theme: Theme, animationOff?: boolean) => Promise<void> | Switch with animation             |
| switchColorTheme       | (colorTheme: string) => void                            | Switch color theme with animation |
| toggleTheme            | (animationOff?: boolean) => Promise<void>               | Toggle light/dark                 |
| toggleLightTheme       | (animationOff?: boolean) => Promise<void>               | Switch to light theme             |
| toggleDarkTheme        | (animationOff?: boolean) => Promise<void>               | Switch to dark theme              |
| toggleColorTheme       | () => void                                              | Toggle between color themes       |
| createColorThemeToggle | (colorTheme: string) => () => void                      | Create color theme toggle         |
| isColorThemeActive     | (colorTheme: string) => boolean                         | Check if color theme active       |
| switchThemeFromElement | (theme: Theme, element: HTMLElement) => Promise<void>   | Switch from specific element      |

## Color Theme Management

### Color Theme Selector

```tsx
'use client';

import { useTanStackUITheme } from 'ui-theme/react';

const colorThemes = [
  { name: 'Default', value: 'default' },
  { name: 'Blue', value: 'blue' },
  { name: 'Green', value: 'green' },
];

export function ColorThemeSelector() {
  const { colorTheme, switchColorTheme, isColorThemeActive } =
    useTanStackUITheme();

  return (
    <div className="flex gap-2">
      {colorThemes.map((theme) => (
        <button
          key={theme.value}
          onClick={() => switchColorTheme(theme.value)}
          className={`px-3 py-1 rounded ${
            isColorThemeActive(theme.value)
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary'
          }`}
        >
          {theme.name}
        </button>
      ))}
    </div>
  );
}
```

### Create Custom Color Theme Toggle

```tsx
'use client';

import { useTanStackUITheme } from 'ui-theme/react';

export function BlueThemeButton() {
  const { createColorThemeToggle } = useTanStackUITheme();
  const toggleBlue = createColorThemeToggle('blue');

  return (
    <button onClick={toggleBlue} className="px-4 py-2 rounded bg-blue-500">
      Blue Theme
    </button>
  );
}
```

## Troubleshooting

### Hydration Mismatch

If you see hydration errors:

1. Add `suppressHydrationWarning` to `<html>` tag
2. Use `useHydrated()` for conditional rendering
3. Ensure theme provider wraps all routes

### Theme Not Persisting

Check that:

1. LocalStorage is available
2. Storage keys don't conflict with other apps
3. Browser allows localStorage access

### Animations Not Working

View Transitions API requires:

- Chrome/Edge 111+
- HTTPS or localhost
- Check `document.startViewTransition` availability

The library automatically falls back to CSS transitions in unsupported browsers.

## Performance Optimization

### Lazy Load Theme Components

```tsx
import { lazy, Suspense } from 'react';

const ThemeToggle = lazy(() => import('@/components/theme-toggle'));

export function Header() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ThemeToggle />
    </Suspense>
  );
}
```

### Memoize Theme Callbacks

```tsx
import { useTanStackUITheme } from 'ui-theme/react';
import { useCallback } from 'react';

export function ThemeControls() {
  const { toggleTheme, switchTheme } = useTanStackUITheme();

  const handleToggle = useCallback(async () => {
    await toggleTheme();
  }, [toggleTheme]);

  const handleDark = useCallback(async () => {
    await switchTheme('dark');
  }, [switchTheme]);

  return (
    <div>
      <button onClick={handleToggle}>Toggle</button>
      <button onClick={handleDark}>Dark</button>
    </div>
  );
}
```

## Examples

See complete working examples in the [examples directory](../examples).
