# UI-Theme

https://github.com/user-attachments/assets/2819cf70-c474-478e-b821-6b26457c8d4a

<p align="center">
  <a href="https://www.npmjs.com/package/uitheme-web">
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

Light, dark, and color themes for web apps, with animated view transitions.
`uitheme-web` supports React, Next.js, TanStack Start, Vue 3.5, and Nuxt 4.
React Native uses `uitheme-rn`.

[Documentation](https://www.ui-theme.dev/docs) ·
[Components](https://www.ui-theme.dev/docs/components) ·
[Live demo](https://www.ui-theme.dev)

## Install

Use one of these three paths. Each path uses the `uitheme-web` runtime.

### 1. Runtime only

Install the package, add a provider, and build your own controls with the hooks.

```sh
npm install uitheme-web
```

See [Installation](https://www.ui-theme.dev/docs/installation) for each
framework.

### 2. UI-Theme CLI

The CLI detects your framework, sets up the provider and CSS, and copies
editable controls into your app.

```sh
npx uitheme-cli init
npx uitheme-cli add theme-toggle color-theme-selector
```

See the [CLI reference](https://www.ui-theme.dev/docs/cli).

### 3. shadcn

For a React app with shadcn and Tailwind 4, add the registry to
`components.json`:

```json
{
  "registries": {
    "@uitheme": "https://www.ui-theme.dev/r/{style}/{name}.json"
  }
}
```

Then add a control:

```sh
npx shadcn@latest add @uitheme/theme-toggle
```

shadcn installs `uitheme-web`. Add the UI-Theme provider to your app as the
[installation guide](https://www.ui-theme.dev/docs/installation) shows. Radix
and Base UI styles are supported.

## Packages

| Package                                  | Purpose                                         |
| ---------------------------------------- | ----------------------------------------------- |
| [`uitheme-web`](./packages/ui-theme)     | Theme runtime, providers, hooks, and animations |
| [`uitheme-cli`](./packages/ui-theme-cli) | Setup, editable controls, and migration         |
| [`uitheme-rn`](./packages/ui-theme-rn)   | React Native appearance and palettes            |

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md) to set up the repository, run the
checks, and open a pull request.

## License

[MIT](./LICENSE)
