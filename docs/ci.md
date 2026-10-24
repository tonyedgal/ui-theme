# Validation before commit and in CI

All relevant tests run before commit. `lint-staged` formats and lints staged
files first. The test runner then exports the Git index into a temporary folder,
links dependencies there from the local pnpm store with an offline frozen
installation, builds prerequisites, and runs the selected checks. Unstaged edits
and old builds are excluded. A failure stops the commit. The index and working
files are not changed by the test runner.

## One-time setup

Use Node 24 and the pnpm version in `packageManager`:

```sh
pnpm install --frozen-lockfile
pnpm test:browsers:install
```

Browser installation is explicit. Hooks do not download browsers. If the offline
installation cannot find a dependency, run `pnpm install` in the working checkout
before retrying. Each staged validation starts fresh test servers. Failed test
artifacts are copied to `test-results/staged-validation/` before cleanup.

## Selection rules

| Staged change                                                                | Local checks                                                                                  |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Web/React implementation                                                     | Web build/types, unit/declaration/packed checks, full browser matrix, website, React examples |
| Shared web core                                                              | Web and Vue package checks, both browser matrices, website, React/Vue/Nuxt examples           |
| RN implementation                                                            | RN build/types, behavior/packed checks, three native example exports/types                    |
| Vue/Nuxt implementation                                                      | Vue build/types/packed checks and full Vue/Nuxt browser matrix                                |
| Website source or content                                                    | Website build/types and production browser smoke                                              |
| One reference example                                                        | Its build/types; Vue/Nuxt changes run their shared integration browser suite                  |
| Public entry points, declarations, dependency manifests, build configuration | Also select the relevant independent package consumer                                         |
| Root dependencies, validation scripts, or unknown runtime paths              | All local checks                                                                              |
| Ordinary documentation                                                       | Formatting and lint only                                                                      |

The full web matrix includes Chromium, Firefox, WebKit and display-density cases.
The Vue matrix includes Chromium, WebKit and mobile Chromium. Website smoke tests
cover production page loading, documentation navigation, appearance controls,
client errors and persistence in Chromium and WebKit. Physical-device testing
remains manual; native example exports are not device UI tests.

Run selection tests or all local checks explicitly:

```sh
pnpm test:validation
pnpm test:local
```

## Automatic CI

CI uses the same selection rules but excludes all reference examples, browser
suites and expensive independent consumers. It formats/lints changed product and
tooling files, builds/types affected libraries and the website, and runs relevant
package unit, declaration and packed checks. CI still protects products if local
hooks were bypassed. It saves the selected plan as an artifact. Library changes
also select their dependent website checks where applicable.

The release job starts only for changesets, public package version changes, or an
explicit main-branch `retry_release` dispatch. Standard Changesets still controls
versioning and publication. Ordinary website/docs pushes do not repeat release
setup. No package version changes are part of this validation change.

## Manual workflows

**Full release validation** checks all libraries and the website, standalone
package consumers, the web package browser matrix and website smoke tests. It
never builds or tests reference example apps. The Vue/Nuxt consumer is an isolated
minimal consumer, not `apps/examples/example-nuxt`.

**Advisory dependency audit** runs weekly or on demand against the lockfile.
Audit failures are reported but do not block product CI or release.
