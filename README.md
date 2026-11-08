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

UI-Theme started as a nicer way to switch between light and dark mode. Then it
added color themes for when one look isn't enough, so one app can carry several
design systems and move between them smoothly.

UI-Theme doesn't stop at theming, it also comes with pre-built components served
from its registry and installed via its CLI (or the shadcn CLI): toggles,
switchers and selectors that land in your codebase as your own code.

It's built for any framework: React, Next.js, TanStack Start, Vue, Nuxt and
React Native are ready now, and more are coming.

[Documentation](https://www.ui-theme.dev/docs) ·
[Components](https://www.ui-theme.dev/docs/components) ·
[Live demo](https://www.ui-theme.dev)

## Get started

Pick the path that suits your app. They all run on the same `uitheme-web`
runtime.

**Just the runtime.** Bring your own buttons, and use the hooks:

```sh
npm install uitheme-web
```

**Ready-made controls.** The CLI sets everything up and copies the controls into
your codebase:

```sh
npx uitheme-cli init
npx uitheme-cli add theme-toggle
```

**Already on shadcn?** Add the registry to `components.json`:

```json
{
  "registries": {
    "@uitheme": "https://www.ui-theme.dev/r/{style}/{name}.json"
  }
}
```

Then add a control. Radix and Base UI styles both work:

```sh
npx shadcn@latest add @uitheme/theme-toggle
```

The [installation guide](https://www.ui-theme.dev/docs/installation) shows how
to add the provider for each framework.

## Packages

| Package                                  | Purpose                                        |
| ---------------------------------------- | ---------------------------------------------- |
| [`uitheme-web`](./packages/ui-theme)     | Themes and transitions for the web             |
| [`uitheme-cli`](./packages/ui-theme-cli) | Adds ready-made controls to your app           |
| [`uitheme-rn`](./packages/ui-theme-rn)   | Themes and screen transitions for React Native |

## Contributing

Found a bug, or have an idea? Contributions are welcome.
[CONTRIBUTING.md](./CONTRIBUTING.md) gets you from clone to pull request.

## License

[MIT](./LICENSE)
