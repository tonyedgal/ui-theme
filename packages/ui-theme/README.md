# ui-theme

Cross-framework UI theme switching library with support for React, Vue, Angular, and Svelte.

## Installation

```bash
pnpm add ui-theme
# or
npm install ui-theme
# or
yarn add ui-theme
```

## Usage

### React

```tsx
import { ThemeProvider, useTheme } from 'ui-theme/react';

function App() {
  return (
    <ThemeProvider defaultTheme="system" enableSystem>
      <YourApp />
    </ThemeProvider>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Toggle theme
    </button>
  );
}
```

### Vue

```vue
<script setup>
import { useTheme } from 'ui-theme/vue';

const { theme, setTheme } = useTheme();
</script>

<template>
  <button @click="setTheme(theme === 'light' ? 'dark' : 'light')">
    Toggle theme
  </button>
</template>
```

### Angular

```typescript
import { Component, inject } from '@angular/core';
import { ThemeService } from 'ui-theme/angular';

@Component({
  selector: 'app-theme-toggle',
  template: ` <button (click)="toggleTheme()">Toggle theme</button> `,
})
export class ThemeToggleComponent {
  private themeService = inject(ThemeService);

  toggleTheme() {
    const current = this.themeService.theme();
    this.themeService.setTheme(current === 'light' ? 'dark' : 'light');
  }
}
```

### Svelte

```svelte
<script>
import { theme, setTheme } from 'ui-theme/svelte';

function toggleTheme() {
  setTheme($theme === 'light' ? 'dark' : 'light');
}
</script>

<button on:click={toggleTheme}>
  Toggle theme
</button>
```

## Features

- 🎨 Multiple theme support (light, dark, system)
- 🔄 Framework-agnostic core
- 💾 Persistent theme storage
- 🌐 SSR/SSG compatible
- 📦 Tree-shakeable
- 🎯 TypeScript support
- ⚡ Zero dependencies (per framework)

## License

MIT
