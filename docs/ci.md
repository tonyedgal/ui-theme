# CI checks

Routine CI uses the Chrome browser already installed on GitHub's Ubuntu 24.04
runner. It does not install Playwright browser binaries or Linux browser
packages. The pnpm cache stores npm packages; it does not preserve a runner's
system packages or browser installations.

## Automatic checks

Every PR and push to main runs formatting, lint, library builds/types,
unit/declaration tests, packed-package checks, and the advisory dependency audit.
Turborepo builds and checks affected workspaces, including affected example apps.
Its local build cache is saved between runs.

Browser checks use the actual PR base and head commits, or the preceding main
commit. They select the following suites:

| Change                                              | Browser checks                         |
| --------------------------------------------------- | -------------------------------------- |
| RN package or native examples only                  | None                                   |
| Web package or React examples                       | Web suite in desktop Chrome at DPR 2   |
| Vue package or Vue/Nuxt examples                    | Vue suite in desktop and mobile Chrome |
| Shared web transition core                          | Both suites                            |
| Lockfile, root build configuration, or CI workflows | Both suites                            |
| Documentation only                                  | None                                   |

Vue browser checks build their own Vue/Nuxt example prerequisites. Failed browser
runs upload traces and screenshots for seven days. The CI job has a 20-minute
limit. Existing release versioning and publication still depend on the CI job.

## Full validation

The manual **Full release validation** workflow retains all web display-density
projects, Chromium/Firefox/WebKit coverage, and fresh RN/Vue/Nuxt consumers.
These slower checks no longer repeat on every PR update.

The workflow uses the official Playwright image with browser binaries and Linux
libraries already included. Keep its pinned image version aligned with
`@playwright/test` in both browser packages. The container image still needs to
be pulled; the job has a 45-minute limit. This PR does not measure that pull time.

After the workflow reaches main, open Actions, select **Full release validation**,
and run it against the desired branch. Before then, the equivalent checks remain
available locally:

```sh
pnpm build
pnpm typecheck
pnpm test:release:consumers
pnpm --filter uitheme-web test:browser
pnpm --filter uitheme-vue test:browser
```

Local full runs require Playwright's matching browser installations. Set
`PLAYWRIGHT_CHANNEL=chrome` only when deliberately testing installed Chrome;
leave it unset for the full Playwright browser matrix.

References: [GitHub runner software](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md),
[Playwright browser channels](https://playwright.dev/docs/browsers#google-chrome--microsoft-edge),
and [Playwright CI images](https://playwright.dev/docs/docker).
