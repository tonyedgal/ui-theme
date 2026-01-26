# @ui-theme/web

Web framework agnostic UI theme switching library. Built with a framework-agnostic core and React adapter. Additional framework support planned for future releases.

## UI-Theme version 1 release

Introducing version 1 of `@ui-theme/web`, a comprehensive solution for managing UI themes across web applications. This release marks a significant milestone in our journey to provide developers with a robust, flexible, and easy-to-use theming library, that supports all web javascript UI frameworks.

## Installation

```bash
npm install @ui-theme/web
```

```bash
pnpm add @ui-theme/web
```

```bash
yarn add @ui-theme/web
```

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
import { UIThemeProvider, useUITheme } from '@ui-theme/web/react';

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

## API Reference

### Shared Hook Return (All Providers)

All providers expose the same hook interface:

| Property               | Type                                                    | Description                        |
| ---------------------- | ------------------------------------------------------- | ---------------------------------- |
| theme                  | Theme                                                   | Current theme                      |
| colorTheme             | ColorTheme                                              | Current color theme                |
| resolvedTheme          | 'light' \| 'dark'                                       | Resolved theme (system → actual)   |
| systemTheme            | 'light' \| 'dark'                                       | OS theme preference                |
| ref                    | RefObject<HTMLElement>                                  | Ref for animation origin           |
| setTheme               | (theme: Theme) => void                                  | Set theme instantly                |
| setColorTheme          | (colorTheme: ColorTheme) => void                        | Set color theme                    |
| switchTheme            | (theme: Theme, animationOff?: boolean) => Promise<void> | Switch with animation              |
| switchColorTheme       | (colorTheme: string) => void                            | Switch color theme with animation  |
| toggleTheme            | (animationOff?: boolean) => Promise<void>               | Toggle light/dark                  |
| toggleLightTheme       | (animationOff?: boolean) => Promise<void>               | Toggle to light                    |
| toggleDarkTheme        | (animationOff?: boolean) => Promise<void>               | Toggle to dark                     |
| toggleColorTheme       | () => void                                              | Toggle between color themes        |
| createColorThemeToggle | (colorTheme: string) => () => void                      | Create color theme toggle          |
| isColorThemeActive     | (colorTheme: string) => boolean                         | Check if color theme active        |
| switchThemeFromElement | (theme: Theme, element: HTMLElement) => Promise<void>   | Switch with animation from element |

### Provider Props

| Prop                      | UITheme | NextUITheme | TanStackUITheme | ViteUITheme | Type               | Default                     |
| ------------------------- | ------- | ----------- | --------------- | ----------- | ------------------ | --------------------------- |
| defaultTheme              | ✓       | ✓           | ✓               | ✓           | Theme              | 'system'                    |
| defaultColorTheme         | ✓       | ✓           | ✓               | ✓           | ColorTheme         | 'default'                   |
| themes                    | ✓       | ✓           | ✓               | ✓           | Theme[]            | ['light', 'dark', 'system'] |
| colorThemes               | ✓       | ✓           | ✓               | ✓           | ColorTheme[]       | ['default']                 |
| animationType             | ✓       | ✓           | ✓               | ✓           | ThemeAnimationType | CIRCLE                      |
| duration                  | ✓       | ✓           | ✓               | ✓           | number             | 500                         |
| storageKey                | ✓       | ✓           | ✓               | ✓           | string             | varies                      |
| colorStorageKey           | ✓       | ✓           | ✓               | ✓           | string             | varies                      |
| nonce                     | ✗       | ✓           | ✗               | ✗           | string             | -                           |
| disablePreHydrationScript | ✗       | ✓           | ✗               | ✗           | boolean            | false                       |
| disableTransitionOnChange | ✗       | ✗           | ✗               | ✓           | boolean            | false                       |
| onThemeChange             | ✓       | ✓           | ✓               | ✓           | function           | -                           |
| onColorThemeChange        | ✓       | ✓           | ✓               | ✓           | function           | -                           |

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

- View Transitions API: Chrome 111+, Edge 111+
- Fallback: All modern browsers with CSS transitions
- Reduced Motion: Respects prefers-reduced-motion
- Framework Support: React 16.8+ (hooks required)

</details>

<details>
<summary>Advanced Configuration</summary>

### Animation Control

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
import { useTheme } from '@ui-theme/web/react';

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
