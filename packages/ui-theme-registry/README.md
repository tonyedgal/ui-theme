# UI-Theme registry

The source for every UI-Theme control. The CLI, shadcn and the docs site all
read from what this workspace builds. It's private and never goes to npm.

## Quick start

From the repository root:

```sh
pnpm registry:dev
```

That builds the registry, serves it at `http://127.0.0.1:4000/r`, and rebuilds
whenever a template changes. Point the CLI or shadcn at it to try your changes
in a real app. [CONTRIBUTING.md](../../CONTRIBUTING.md#running-the-registry-locally)
walks you through it.

Changed `src/build.ts`? Restart the server. It only watches the templates.

## Where things live

- `src/templates/<framework>/<base>/` holds one file per control, plus
  `metadata.json` with the control's title, description and dependencies.
  React has `radix` and `base-ui`. Vue has `reka`.
- `src/build.ts` turns the templates into registry records.
- `releases/v1/` holds frozen snapshots. Never edit them.
- `dist/` is the build output. The website copies it at build time.

One build makes 84 records: seven controls, three framework and base pairs,
Tailwind 3 and 4, and TypeScript and JavaScript.

## Changing a control

1. Make the change in every base: `react/radix`, `react/base-ui` and
   `vue/reka`.
2. Run `pnpm registry:dev` and install the control in an app to see it work.
3. Run the tests (below).

Adding an import from a shared library such as `lucide-react`? Check that its
`compatibleDependencies` range in `metadata.json` still holds. The minimum
version check tells you if it doesn't, and you raise the range.

## Testing

| Command                                 | What it checks                                              |
| --------------------------------------- | ----------------------------------------------------------- |
| `pnpm --filter @ui-theme/registry test` | The build output and its records                            |
| `pnpm test:registry:shadcn`             | Every shadcn style installs and shows up in `shadcn search` |
| `pnpm test:registry:minimum`            | The oldest compatible version of each library still works   |

The last two need network access. Their logs land in `test-results/`.

## The shadcn layer

The build also writes one record per React control for each shadcn style, at
`{style}/{name}.json`, plus a `registry.json` index for `shadcn search`.
`radix-*`, `new-york`, `new-york-v4` and `default` use Radix. `base-*` uses
Base UI. React Aria styles aren't served.

When shadcn ships a new style, add it to `shadcnStyles` in `src/build.ts`.

These records list shared libraries by name only, so an app keeps the versions
it already has. `uitheme-web@^2.0.0` keeps its range, because the controls need
v2.

## Releasing

Run `pnpm snapshot` to freeze the current build into `releases/v1/`, and commit
the result. A snapshot never changes once it's written. Each revision hash
covers the records and the registry URL, so new content always gets a new URL.

Records use absolute URLs. To serve a build from somewhere else, run
`pnpm build --origin <url>`. That build gets its own revision, so run
`pnpm build` again before you build the website.
