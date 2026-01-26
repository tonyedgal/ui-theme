# Next.js Setup Guide

Complete setup guide for using @ui-theme/web in Next.js applications with App Router and Pages Router support.

## Installation

```bash
npm install @ui-theme/web
# or
pnpm add @ui-theme/web
# or
yarn add @ui-theme/web
```

## App Router Setup

### 1. Create Theme Provider Component

Create a client component wrapper in [app/providers.tsx](app/providers.tsx):

```tsx
'use client';

import { NextUIThemeProvider } from '@ui-theme/web/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextUIThemeProvider
      defaultTheme="system"
      defaultColorTheme="default"
      themes={['light', 'dark', 'system']}
      colorThemes={['default', 'blue', 'green']}
      animationType="circle"
      duration={500}
    >
      {children}
    </NextUIThemeProvider>
  );
}
```

### 2. Update Root Layout

Wrap your app in [app/layout.tsx](app/layout.tsx):

```tsx
import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'My App',
  description: 'App with theme switching',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**Important:** Add `suppressHydrationWarning` to the `<html>` tag to prevent hydration warnings when the theme is applied.

### 3. Create Theme Toggle Component

Create [components/theme-toggle.tsx](components/theme-toggle.tsx):

```tsx
'use client';

import { useNextUITheme } from '@ui-theme/web/react';

export function ThemeToggle() {
  const { theme, resolvedTheme, toggleTheme, ref } = useNextUITheme();

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

### 4. Use in Pages

```tsx
import { ThemeToggle } from '@/components/theme-toggle';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1>My App</h1>
      <ThemeToggle />
    </main>
  );
}
```

## Pages Router Setup

### 1. Create Theme Provider

Create [pages/\_app.tsx](pages/_app.tsx):

```tsx
import type { AppProps } from 'next/app';
import { NextUIThemeProvider } from '@ui-theme/web/react';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <NextUIThemeProvider
      defaultTheme="system"
      defaultColorTheme="default"
      themes={['light', 'dark', 'system']}
      colorThemes={['default', 'blue', 'green']}
    >
      <Component {...pageProps} />
    </NextUIThemeProvider>
  );
}
```

### 2. Update Document

Create [pages/\_document.tsx](pages/_document.tsx):

```tsx
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" suppressHydrationWarning>
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

### 3. Use Theme Hook

```tsx
import { useNextUITheme } from '@ui-theme/web/react';

export default function HomePage() {
  const { theme, toggleTheme, ref } = useNextUITheme();

  return (
    <div>
      <h1>My App</h1>
      <button ref={ref} onClick={() => toggleTheme()}>
        Toggle Theme
      </button>
    </div>
  );
}
```

## CSS Variables Setup

Define your theme variables in [globals.css](globals.css):

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

### Content Security Policy (CSP)

If you're using CSP, add the `nonce` prop:

```tsx
// In app/layout.tsx or pages/_app.tsx
import { headers } from 'next/headers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = headers().get('x-nonce') ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <NextUIThemeProvider nonce={nonce}>{children}</NextUIThemeProvider>
      </body>
    </html>
  );
}
```

### Disable Pre-Hydration Script

By default, NextUIThemeProvider injects a script to prevent flash. To disable:

```tsx
<NextUIThemeProvider disablePreHydrationScript>{children}</NextUIThemeProvider>
```

### Animation Control

Control animations with the `animationOff` parameter:

```tsx
const { toggleTheme, switchTheme } = useNextUITheme();

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

<NextUIThemeProvider
  animationType={ThemeAnimationType.CIRCLE} // Default
  // or ThemeAnimationType.BLUR_CIRCLE
  // or ThemeAnimationType.SLIDE
  duration={500}
>
  {children}
</NextUIThemeProvider>;
```

## API Reference

### NextUIThemeProvider Props

| Prop                      | Type                 | Default                     | Description                       |
| ------------------------- | -------------------- | --------------------------- | --------------------------------- |
| defaultTheme              | Theme                | 'system'                    | Initial theme                     |
| defaultColorTheme         | ColorTheme           | 'default'                   | Initial color theme               |
| themes                    | Theme[]              | ['light', 'dark', 'system'] | Available themes                  |
| colorThemes               | ColorTheme[]         | ['default']                 | Available color themes            |
| animationType             | ThemeAnimationType   | 'circle'                    | Animation type                    |
| duration                  | number               | 500                         | Animation duration (ms)           |
| storageKey                | string               | 'ui-theme'                  | LocalStorage key for theme        |
| colorStorageKey           | string               | 'ui-color-theme'            | LocalStorage key for color theme  |
| nonce                     | string               | -                           | CSP nonce for script tag          |
| disablePreHydrationScript | boolean              | false                       | Disable flash prevention script   |
| onThemeChange             | (theme) => void      | -                           | Callback when theme changes       |
| onColorThemeChange        | (colorTheme) => void | -                           | Callback when color theme changes |

### useNextUITheme Hook

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

## Color Theme Selector

Create a color theme selector:

```tsx
'use client';

import { useNextUITheme } from '@ui-theme/web/react';

const colorThemes = [
  { name: 'Default', value: 'default' },
  { name: 'Blue', value: 'blue' },
  { name: 'Green', value: 'green' },
];

export function ColorThemeSelector() {
  const { colorTheme, switchColorTheme, isColorThemeActive } = useNextUITheme();

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

## Troubleshooting

### Flash of Unstyled Content (FOUC)

Ensure you:

1. Add `suppressHydrationWarning` to `<html>` tag
2. Don't disable pre-hydration script unless necessary
3. Place `NextUIThemeProvider` as high as possible in the tree

### Hydration Mismatch

If you see hydration errors:

1. Use `suppressHydrationWarning` on the `<html>` tag
2. Ensure theme classes are applied correctly
3. Check that `defaultTheme` matches stored theme

### Animations Not Working

View Transitions API requires:

- Chrome/Edge 111+
- HTTPS or localhost
- Check `document.startViewTransition` availability

The library automatically falls back to CSS transitions in unsupported browsers.

## Examples

See complete working examples in the [examples directory](../examples).
