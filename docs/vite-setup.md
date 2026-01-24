# Vite React SPA Setup Guide

Complete setup guide for using ui-theme in Vite React single-page applications.

## Installation

```bash
npm install ui-theme
# or
pnpm add ui-theme
# or
yarn add ui-theme
```

## Quick Start

### 1. Wrap App with Theme Provider

Update [src/main.tsx](src/main.tsx):

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ViteUIThemeProvider } from 'ui-theme/react';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ViteUIThemeProvider
      defaultTheme="system"
      defaultColorTheme="default"
      themes={['light', 'dark', 'system']}
      colorThemes={['default', 'blue', 'green']}
      animationType="circle"
      duration={500}
    >
      <App />
    </ViteUIThemeProvider>
  </React.StrictMode>
);
```

### 2. Create Theme Toggle Component

Create [src/components/theme-toggle.tsx](src/components/theme-toggle.tsx):

```tsx
import { useViteUITheme } from 'ui-theme/react';

export function ThemeToggle() {
  const { theme, resolvedTheme, toggleTheme, ref } = useViteUITheme();

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

### 3. Use in Components

Update [src/App.tsx](src/App.tsx):

```tsx
import { ThemeToggle } from './components/theme-toggle';

function App() {
  return (
    <div className="min-h-screen p-8">
      <h1>My Vite App</h1>
      <ThemeToggle />
    </div>
  );
}

export default App;
```

## CSS Variables Setup

Define your theme variables in [src/index.css](src/index.css):

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
  transition:
    background-color 0.3s,
    color 0.3s;
}
```

## Prevent Flash on Load

Update [index.html](index.html) to prevent flash of unstyled content:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React + UI Theme</title>

    <!-- Prevent flash of unstyled content -->
    <script>
      (function () {
        const storageKey = 'ui-theme';
        const colorStorageKey = 'ui-color-theme';

        function getTheme() {
          const stored = localStorage.getItem(storageKey);
          if (stored === 'light' || stored === 'dark') return stored;
          if (stored === 'system' || !stored) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light';
          }
          return 'light';
        }

        function getColorTheme() {
          return localStorage.getItem(colorStorageKey) || 'default';
        }

        const theme = getTheme();
        const colorTheme = getColorTheme();

        document.documentElement.classList.add(theme);
        if (colorTheme !== 'default') {
          document.documentElement.classList.add(`theme-${colorTheme}`);
        }
      })();
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## React Router Integration

### With React Router v6

Update [src/main.tsx](src/main.tsx):

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ViteUIThemeProvider } from 'ui-theme/react';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ViteUIThemeProvider defaultTheme="system">
        <App />
      </ViteUIThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

## Advanced Configuration

### Disable Transitions on Theme Change

If you want to control transitions manually:

```tsx
<ViteUIThemeProvider defaultTheme="system" disableTransitionOnChange={true}>
  <App />
</ViteUIThemeProvider>
```

### Animation Control

Control animations with the `animationOff` parameter:

```tsx
const { toggleTheme, switchTheme } = useViteUITheme();

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

<ViteUIThemeProvider
  animationType={ThemeAnimationType.CIRCLE} // Default
  // or ThemeAnimationType.BLUR_CIRCLE
  // or ThemeAnimationType.SLIDE
  duration={500}
>
  <App />
</ViteUIThemeProvider>;
```

### Custom Animation Origin

Control where animations originate from:

```tsx
import { useViteUITheme } from 'ui-theme/react';

export function CustomToggle() {
  const { switchTheme, ref } = useViteUITheme();

  return (
    <button
      ref={ref} // Animation originates from this element
      onClick={() => switchTheme('dark')}
    >
      Dark Mode
    </button>
  );
}
```

## API Reference

### ViteUIThemeProvider Props

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
| disableTransitionOnChange | boolean              | false                       | Disable CSS transitions on change |
| onThemeChange             | (theme) => void      | -                           | Callback when theme changes       |
| onColorThemeChange        | (colorTheme) => void | -                           | Callback when color theme changes |

### useViteUITheme Hook

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
import { useViteUITheme } from 'ui-theme/react';

const colorThemes = [
  { name: 'Default', value: 'default' },
  { name: 'Blue', value: 'blue' },
  { name: 'Green', value: 'green' },
];

export function ColorThemeSelector() {
  const { colorTheme, switchColorTheme, isColorThemeActive } = useViteUITheme();

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

### Theme Callbacks

```tsx
import { useViteUITheme } from 'ui-theme/react';
import { useEffect } from 'react';

export function ThemeLogger() {
  const { theme, colorTheme } = useViteUITheme();

  useEffect(() => {
    console.log('Theme changed:', theme);
  }, [theme]);

  useEffect(() => {
    console.log('Color theme changed:', colorTheme);
  }, [colorTheme]);

  return null;
}
```

Or use provider callbacks:

```tsx
<ViteUIThemeProvider
  defaultTheme="system"
  onThemeChange={(theme) => {
    console.log('Theme changed:', theme);
    // Track analytics, update preferences, etc.
  }}
  onColorThemeChange={(colorTheme) => {
    console.log('Color theme changed:', colorTheme);
  }}
>
  <App />
</ViteUIThemeProvider>
```

## TypeScript Support

The library is fully typed. Import types as needed:

```tsx
import type { Theme, ColorTheme, ThemeAnimationType } from 'ui-theme/core';
import type { UseThemeReturn } from 'ui-theme/react';

interface ThemeToggleProps {
  variant?: 'icon' | 'text';
}

export function ThemeToggle({ variant = 'icon' }: ThemeToggleProps) {
  const theme: UseThemeReturn = useViteUITheme();

  // ...
}
```

## Troubleshooting

### Flash of Unstyled Content

If you see a flash of the wrong theme on load:

1. Add the inline script to `index.html` (shown above)
2. Ensure script runs before React loads
3. Check localStorage keys match provider configuration

### Animations Not Working

View Transitions API requires:

- Chrome/Edge 111+
- HTTPS or localhost
- Check `document.startViewTransition` availability

The library automatically falls back to CSS transitions in unsupported browsers.

### Theme Not Persisting

Check that:

1. LocalStorage is available and enabled
2. Storage keys don't conflict with other apps
3. Browser allows localStorage access

### Performance Issues

For large applications:

1. Use `disableTransitionOnChange={true}` to disable CSS transitions
2. Memoize theme callbacks with `useCallback`
3. Lazy load theme components
4. Consider reducing animation duration

## Performance Optimization

### Lazy Load Components

```tsx
import { lazy, Suspense } from 'react';

const ThemeToggle = lazy(() => import('./components/theme-toggle'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ThemeToggle />
    </Suspense>
  );
}
```

### Memoize Callbacks

```tsx
import { useViteUITheme } from 'ui-theme/react';
import { useCallback } from 'react';

export function ThemeControls() {
  const { toggleTheme, switchTheme } = useViteUITheme();

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

### Complete Example with Multiple Features

```tsx
import { useViteUITheme } from 'ui-theme/react';

export function ThemeControl() {
  const {
    theme,
    colorTheme,
    resolvedTheme,
    systemTheme,
    toggleTheme,
    switchTheme,
    toggleColorTheme,
    isColorThemeActive,
    ref,
  } = useViteUITheme();

  return (
    <div className="space-y-4">
      {/* Status */}
      <div>
        <p>Current Theme: {theme}</p>
        <p>Resolved: {resolvedTheme}</p>
        <p>System: {systemTheme}</p>
        <p>Color: {colorTheme}</p>
      </div>

      {/* Theme Toggle */}
      <button ref={ref} onClick={() => toggleTheme()}>
        Toggle Theme
      </button>

      {/* Direct Theme Switches */}
      <div className="flex gap-2">
        <button onClick={() => switchTheme('light')}>Light</button>
        <button onClick={() => switchTheme('dark')}>Dark</button>
        <button onClick={() => switchTheme('system')}>System</button>
      </div>

      {/* Color Theme Toggle */}
      <button onClick={toggleColorTheme}>Next Color Theme</button>
    </div>
  );
}
```

See complete working examples in the [examples directory](../examples).
