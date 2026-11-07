# Contributing

Thank you for your help. Before you start, search the open issues and pull
requests. For a new component or a large change, open a
[discussion](https://github.com/tonyedgal/ui-theme/discussions) first.

## About this repository

- [pnpm](https://pnpm.io) workspaces manage the packages.
- [Turborepo](https://turbo.build/repo) runs the builds.
- [Changesets](https://github.com/changesets/changesets) manages the releases.

## Structure

| Path                         | Workspace            | Contents                                    |
| ---------------------------- | -------------------- | ------------------------------------------- |
| `packages/ui-theme`          | `uitheme-web`        | Web runtime and framework adapters          |
| `packages/ui-theme-cli`      | `uitheme-cli`        | CLI that sets up apps and installs controls |
| `packages/ui-theme-registry` | `@ui-theme/registry` | Control templates and the registry build    |
| `packages/ui-theme-rn`       | `uitheme-rn`         | React Native runtime                        |
| `apps/ui-theme-web`          | `ui-theme-web`       | Website and documentation                   |

`uitheme-web` is the library. `ui-theme-web` is the website.

## Development

You need Node.js 22.18 or later. Run `corepack enable` to use the pnpm version
in `package.json`.

1. Fork the repository, then clone your fork:

   ```sh
   git clone https://github.com/<your-username>/ui-theme.git
   cd ui-theme
   ```

2. Create a branch:

   ```sh
   git checkout -b my-new-branch
   ```

3. Install the dependencies and build the packages:

   ```sh
   pnpm install
   pnpm build:packages
   ```

### Run a workspace

Use `pnpm --filter <workspace>` to run a script in one workspace. For example:

```sh
pnpm --filter ui-theme-web dev
pnpm --filter uitheme-web test
pnpm --filter uitheme-cli test
```

The website opens at `http://localhost:3000`.

## Components

The control templates are in `packages/ui-theme-registry/src/templates`, with
one folder for each primitive base: `react/base-ui`, `react/radix`, and
`vue/reka`. Write TypeScript for Tailwind 4. The build creates the other
variants.

When you add or change a control:

1. Make the change for each base.
2. Update its page in `apps/ui-theme-web/content/components`.
3. Run `pnpm --filter @ui-theme/registry test`.

Do not change `packages/ui-theme-registry/releases`. It holds frozen releases.

## Running the registry locally

Use a local registry to try a control change in a real app before you open a
pull request.

1. Start the registry:

   ```sh
   pnpm registry:dev
   ```

   It serves `http://127.0.0.1:4000/r` and rebuilds when you change a template.

2. Keep it running. Open a second terminal, and install a control in your app
   with the CLI or with shadcn.

### Install from the local registry with the CLI

1. In your app folder, point the CLI at the local registry:

   ```sh
   export UITHEME_REGISTRY_URL=http://127.0.0.1:4000/r
   ```

2. Set up the app and add a control:

   ```sh
   npx uitheme-cli init
   npx uitheme-cli add theme-toggle
   ```

### Install from the local registry with shadcn

1. In your app's `components.json`, add the local registry:

   ```json
   {
     "registries": {
       "@uitheme": "http://127.0.0.1:4000/r/{style}/{name}.json"
     }
   }
   ```

2. Add a control:

   ```sh
   npx shadcn@latest add @uitheme/theme-toggle
   ```

### Test the registry

| Command                                 | What it checks                                         |
| --------------------------------------- | ------------------------------------------------------ |
| `pnpm --filter @ui-theme/registry test` | The registry build                                     |
| `pnpm test:registry:shadcn`             | A shadcn dry-run install of each control in each style |
| `pnpm test:registry:minimum`            | The oldest supported version of each icon package      |

The shadcn and minimum version checks need network access.

## Documentation

The documentation is MDX in `apps/ui-theme-web/content`. Follow the
[writing guide](./WRITING.md).

## Before you open a pull request

- Run `pnpm lint:check` and `pnpm format:check`.
- For a change to `uitheme-web`, `uitheme-cli`, or `uitheme-rn`, add a
  changeset with `pnpm changeset`.

## Commit convention

Use [Conventional Commits](https://www.conventionalcommits.org):
`type(scope): description`, in lowercase and the imperative mood. The types are
`feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, and `chore`.

For example: `fix(registry): keep focus on the theme toggle after a change`.
