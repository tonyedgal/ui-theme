# uitheme-cli

Add animated theme controls to the app you already have, in two commands.

```sh
npx uitheme-cli init
npx uitheme-cli add theme-toggle
```

`init` finds your framework, sets up the theme provider and your CSS, and
installs [`uitheme-web`](https://www.npmjs.com/package/uitheme-web). `add`
copies the control into your codebase. From there it's your code: restyle it,
rename it, rewrite it.

- Works with Next.js, TanStack Start, Vite (React or Vue) and Nuxt 4
- Picks Radix or Base UI for React, and Reka for Vue, based on what your app
  already uses
- Matches your setup: TypeScript or JavaScript, Tailwind 3.4 or 4
- Shows you the plan before it touches a file
- Never overwrites a file you've edited
- Keeps your existing dependency versions when they already work

## The controls

| Control                  | What it is                                    |
| ------------------------ | --------------------------------------------- |
| `theme-toggle`           | A button that flips between light and dark    |
| `icon-theme-toggle`      | The same, with an animated sun and moon       |
| `theme-switcher`         | System, light and dark, with a sliding marker |
| `theme-selector`         | A menu for system, light and dark             |
| `color-theme-selector`   | A menu for your color palettes                |
| `theme-disclosure`       | Inline theme choices that expand in place     |
| `color-theme-disclosure` | Inline palette choices that expand in place   |

Add as many as you want in one go:

```sh
npx uitheme-cli add theme-toggle color-theme-selector
```

[See them all live →](https://www.ui-theme.dev/docs/components)

## Not sure what it'll do?

Ask first. Nothing is written until you say so:

```sh
npx uitheme-cli info               # what the CLI detected in your app
npx uitheme-cli init --dry-run     # the full plan, without changes
npx uitheme-cli diff theme-toggle  # how your copy differs from the original
```

## Upgrading from v1?

`migrate` previews the import changes for you:

```sh
npx uitheme-cli migrate
```

The [migration guide](https://www.ui-theme.dev/docs/migration) covers the rest.

## Documentation

Every command, flag and option is in the
[CLI reference](https://www.ui-theme.dev/docs/cli).

## License

MIT
