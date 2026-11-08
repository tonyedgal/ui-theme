# Registry

This workspace is the source of truth for UI-Theme controls. The CLI, shadcn and
the website all serve what it builds. It is private and not published to npm.

## Source (edit these)

- `src/templates/react/radix/`, `src/templates/react/base-ui/` and
  `src/templates/vue/reka/`: one file per control, plus a `metadata.json` with
  its title, description and dependencies.
- `src/build.ts`: turns the templates into registry records and lists the
  shadcn styles.

**Keep the bases in sync.** A change to one control goes into all three.

## Generated output (do not edit by hand)

- `dist/`: the build output. The website copies it at build time.
- `releases/v1/`: frozen snapshots. A snapshot never changes once written.

## Development

Use `registry:dev` to build and serve the registry at `http://127.0.0.1:4000/r`.
It rebuilds when a template changes.

```bash
pnpm registry:dev
```

**Restart it after you change `src/build.ts`.** It watches the templates only.

See [CONTRIBUTING.md](../../CONTRIBUTING.md#running-the-registry-locally) to try
your changes in a real app.

## Testing

| Command                                 | Checks                                                    |
| --------------------------------------- | --------------------------------------------------------- |
| `pnpm --filter @ui-theme/registry test` | The build output and its records                          |
| `pnpm test:registry:shadcn`             | Every shadcn style installs and shows up in search        |
| `pnpm test:registry:minimum`            | The oldest version in each `compatibleDependencies` range |

The last two need network access.

## The shadcn layer

The build writes one record per React control for each shadcn style, at
`{style}/{name}.json`, plus a `registry.json` index. `radix-*`, `new-york`,
`new-york-v4` and `default` use Radix. `base-*` uses Base UI.

To serve a new shadcn style, add it to `shadcnStyles` in `src/build.ts`.

## Releasing

Use `snapshot` to freeze the current build into `releases/v1/`, then commit it.

```bash
pnpm --filter @ui-theme/registry snapshot
```

To serve a build from another address, use `--origin`. Run a plain build again
before you build the website.

```bash
pnpm --filter @ui-theme/registry build --origin <url>
```
