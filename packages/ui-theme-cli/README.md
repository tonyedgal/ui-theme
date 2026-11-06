# uitheme-cli

Install editable UI-Theme controls in an existing web app. The runtime remains
in `uitheme-web`; this CLI does not become an application runtime dependency.

```sh
npx uitheme-cli info
npx uitheme-cli init --dry-run
npx uitheme-cli init
npx uitheme-cli list
npx uitheme-cli add theme-toggle theme-selector color-theme-selector
```

Requires Node.js 22.18 or later, an existing Tailwind 3.4 or 4 app, and
`uitheme-web` 2.x for registry controls. Supports Next App Router, TanStack Start,
Vite React, Vite Vue, and Nuxt 4. It does not scaffold an app or upgrade Tailwind.

| Command        | Purpose                                           |
| -------------- | ------------------------------------------------- |
| `info`         | Show the detected app profile                     |
| `init`         | Plan and apply framework/provider/CSS setup       |
| `list`         | Show controls for the selected variant            |
| `add <names>`  | Install controls and their selected dependencies  |
| `diff <names>` | Show differences without changing files           |
| `migrate`      | Preview safe legacy import and dependency changes |

Use `--cwd apps/web` to select one app in a workspace. Use `--base base-ui` or
`--base radix` for React. Vue uses `--base reka`. Use `--language ts` or
`--language js`, and `--tailwind 3` or `--tailwind 4` to match your app.

Flags override saved `uitheme.json`, then compatible component configuration,
then detection. Use `--css`, `--tailwind-config`, `--components-dir`,
`--alias-prefix`, or `--color-format css|hsl-channels` for explicit choices.
Ambiguous supported frameworks require a choice. App configs are not executed.

The hosted registry uses immutable revisions under
[ui-theme.dev/r](https://www.ui-theme.dev/r/manifest.json).
The alternate URL `https://uitheme.dev/r` redirects to the canonical host.
`--revision <revision>` selects a recorded revision. All dependencies in one
installation use the same revision. The CLI checks versions and source paths
before writing. It records installed file hashes for later comparison.

`--registry <url>` selects another registry, for example a local build. The
`UITHEME_REGISTRY_URL` environment variable does the same for every command.
The flag wins when you set both. The URL must use `https`, or `http` for
`localhost`. The CLI prints the registry URL when it is not the hosted one.

```sh
UITHEME_REGISTRY_URL=http://localhost:4000/r npx uitheme-cli list
npx uitheme-cli add theme-toggle --registry http://localhost:4000/r --dry-run
```

The CLI installs `uitheme-web@latest`. To test another runtime, set
`UITHEME_WEB_VERSION` to a dist-tag, a version, or a packed `.tgz` file. The
CLI always installs that value, even when the app already has `uitheme-web`.
A prerelease counts as its release, so `2.0.0-rc.1` meets `^2.0.0`.

```sh
UITHEME_WEB_VERSION=next npx uitheme-cli init
UITHEME_WEB_VERSION=./uitheme-web-2.0.0.tgz npx uitheme-cli init
```

A `.tgz` path is relative to the folder where you run the command. The app's
`package.json` then records a `file:` path to that tarball, so use it only for
local tests.

`--dry-run` and `--preview` do not write files or install packages. `--yes`
skips confirmation but does not overwrite edited source. `--overwrite` permits
replacement after you inspect the plan. Failed dependency installation restores
touched source, manifests, and lockfiles. Explicit shared component destinations
must be inside the detected workspace and have an owning package manifest.

Migration defaults to a preview. Review the result before `migrate --yes`.
Legacy custom controls and unknown provider contexts require manual changes.
For v1 controls, upgrade the runtime to `^2.0.0` on a migration branch before
`add`, replace local controls, then rerun the migration preview. Complete the
source migration before building or deploying. The migration command does not
run your package manager; update the lockfile after applying its manifest plan.

See the [documentation](https://www.ui-theme.dev/docs/installation).
