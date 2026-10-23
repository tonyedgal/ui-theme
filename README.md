# ui-theme

https://github.com/user-attachments/assets/2819cf70-c474-478e-b821-6b26457c8d4a

<p align="center">
  <a>
    <img alt="npm" src="https://img.shields.io/npm/v/uitheme-web/latest"/>
  </a>
  <a href="https://github.com/tonyedgal/ui-theme/stargazers">
    <img src="https://badgen.net/github/stars/tonyedgal/ui-theme" alt="GitHub Stars"/>
  </a>
  <a href="https://github.com/tonyedgal/ui-theme/blob/main/LICENSE">
    <img
      src="https://badgen.net/badge/license/MIT/blue"
      alt="MIT license"
    />
  </a>
</p>

Web framework agnostic UI theme switching library with smooth view transition animations, multi-theme support, and synchronized state management. Supports React, Vue 3, Nuxt 4, and React Native through dedicated packages.

## Live Demo

[View Live Demo](https://ui-theme.dev/)

## Features

- Smooth view transition animations with customizable origins
- Eight-direction polygon wipes, triangle reveals, and SVG logo transitions
- Multi-theme support (light, dark, system)
- Color theme variants (brand colors, custom themes)
- Framework-optimized providers
- Powerful hooks for custom implementations
- Ready-to-use switcher and selector components
- State synchronization across components
- Full TypeScript support
- Performance optimized with reduced motion support

## Documentation

- **[uitheme-web Package Documentation](./packages/ui-theme/README.md)** - Complete API reference, installation, and usage
- **[uitheme-vue Package Documentation](./packages/ui-theme-vue/README.md)** - Vue composables, controls, and a Nuxt SSR module
- **[Vue Example](./apps/examples/example-vue/README.md)** - Vite and Tailwind v4 palettes
- **[Nuxt Example](./apps/examples/example-nuxt/README.md)** - Server rendering and cookie persistence
- **[uitheme-rn Package Documentation](./packages/ui-theme-rn/README.md)** - React Native appearance, palettes, storage, and Expo UI controls
- **[NativeWind v5 Example](./apps/examples/example-nativewind/README.md)** - Tailwind v4 CSS palettes and native styles
- **[Uniwind Example](./apps/examples/example-uniwind/README.md)** - Tailwind v4 scoped themes and native styles
- **[Expo Reference App](./apps/examples/example-expo/README.md)** - Native appearance settings and a shared-theme preview
- **[Next.js / SSR Setup Guide](./docs/nextjs-setup.md)** - Complete guide with App Router, Pages Router, CSP support
- **[TanStack Start Setup Guide](./docs/tanstack-start-setup.md)** - Isomorphic rendering, hydration-safe patterns
- **[Vite React SPA Setup Guide](./docs/vite-setup.md)** - Client-side setup, flash prevention, routing
- **[View Complete Examples](./apps/examples/)** - Next.js implementation with both hook and provider patterns

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.

See [Workspace linting](./docs/linting.md) for the shared ESLint presets, anti-slop rules, runtime requirements, and lint commands.

## License

MIT
