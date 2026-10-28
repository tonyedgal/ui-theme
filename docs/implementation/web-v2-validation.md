# Web v2 implementation and validation

Implementation branch: `feat/unified-web-v2`.

The work lives in the isolated `worktrees/ui-theme-v2` checkout. The original
`ui-theme` checkout stays on `ci/staged-package-validation`. Its original
tracked diff retains SHA-256
`735ab6b58c895145b91f35b1fcb8b038bee57aebd8fa1e447af8fa056e600215`.
The existing homepage, styles, hero assets, and agent guide remain untouched.

## Package boundaries

- `uitheme-web` owns the shared controller and React, Vue, Next, TanStack, and
  Nuxt adapters. Frameworks are optional peers. No UI primitive is a mandatory
  runtime dependency.
- `uitheme-cli` owns detection, installation, Tailwind setup, previews, diffs,
  and reviewed migration. Its binary is `uitheme`.
- `@ui-theme/registry` is private. It builds and freezes hosted control records.
  React supports Base UI and Radix; Vue supports Reka. Templates support
  Tailwind 3.4 and 4, and TypeScript and JavaScript.
- The legacy Vue source workspace is retired. Published Vue v1 remains available.
  Shared controls outside the app require explicit workspace destinations and
  owning manifests. Automatic migration of customized or shared legacy controls
  remains a manual review path.
- RN source and its package version have no changes.

## Release selection

The Changeset `unified-web-v2` selects only these public updates:

| Package       | Source version | Version from Changesets |
| ------------- | -------------- | ----------------------- |
| `uitheme-web` | `1.2.0`        | `2.0.0`                 |
| `uitheme-cli` | `0.0.0`        | `1.0.0`                 |

Private example workspaces have no version bump. RN has no release entry.
Source versions and generated changelogs have not been changed manually.
Packed candidate tests read their versions from the related Changesets plan.
After versioning, the same checks use current package metadata when no related
Changeset remains. Publication and production deployment have not run.

## Verified behavior

- Core, React-only, and Vue-only packed consumers load without unrelated
  frameworks or UI primitive packages. Core and React also verify CommonJS.
- A separate installed Vue/Nuxt consumer verifies strict declarations, SSR,
  production build, hydration, and persisted appearance and palette state.
- All 48 emitted control variants compile and render. The matrix uses real
  Tailwind `3.4.19` and `4.3.3`, with matching merge helpers. It checks generated
  CSS and computed semantic colors, keyboard selection, toggles, and duration.
- The actual packed CLI runs detection, init preview, init, and add. A local HTTP
  fixture redirects only the registry transport. All URLs and pin checks retain
  the canonical production origin. This does not claim a deployed endpoint test.
- Source installation tests cover edited-file protection, immutable pinning,
  unsafe paths and symlinks, package ownership, idempotence, and rollback.
- Vue/Nuxt reference browsers check SSR isolation, system changes, configured
  themes, storage failures, cross-tab state, all effects, and reduced motion.
- Core browsers cover Chromium, WebKit, Firefox, mobile viewports, and DPR 1/2/3.
  Nine cases skip platform APIs that those projects do not expose.

The frozen registry revision is:

`4e7a5d76a371d269ce8f26549f7f2c19726d447271ebe1e630c5523168f12f24`

The release archive is prepared in `packages/ui-theme-registry/releases/v1`.
Clean builds restore historical releases. The revision hashes generated records
and the origin. Existing released bytes cannot be overwritten.

## Local results

| Check                                    | Result                     |
| ---------------------------------------- | -------------------------- |
| Complete repository ESLint               | Pass, zero warnings        |
| Complete repository Prettier             | Pass                       |
| Validation routing and release selection | 14 tests pass              |
| Runtime behavior                         | 50 tests pass              |
| CLI behavior                             | 59 tests pass              |
| Registry builder and archive             | 5 tests pass               |
| Core browser matrix                      | 146 pass, 9 platform skips |
| Control providers, Chromium and WebKit   | 18 cases pass              |
| Vue/Nuxt reference browsers              | 36 cases pass              |
| Website production browsers              | 10 cases pass              |
| Emitted registry consumers               | All 48 variants pass       |
| React reference builds and types         | Pass                       |
| Vue and Nuxt production builds and types | Pass                       |
| CI-equivalent package/website flow       | Pass                       |
| Complete local validation flow           | Pass                       |

Evidence is under the ignored `test-results` directories. Key reports:
`test-results/release-consumers-registry/summary.json`,
`test-results/release-consumers-vue/summary.json`, and
`packages/ui-theme/tests/vue-browser/playwright-report/index.html`.

Routine CI has no browser-engine downloads or example-app matrix. Local affected
validation retains those checks. The manual release workflow can run the full
package, registry, and website checks on demand.

## Review boundary

The independent review identified six valid correctness issues. Fixes now block
unsafe upgrades with removed select imports, resolve JavaScript project aliases,
parse JSX in `.js` migration and setup files, build both packed candidates for
CLI-only local validation, invalidate disposed controller requests, and pass the
Vue settings disabled state to both controls.

No regression tests were retained from this review. Earlier tests remain for
separate review. Temporary fixtures verified migration safety, aliases, Next.js
JavaScript setup, queued theme and palette disposal, remounts, and deferred
adapter failures. Temporary Chromium and WebKit checks verified disabled inputs
and re-enabled settings. Screenshots are in `test-results/review-fixes`.

The corrected registry has a new immutable revision. The earlier revision remains
unchanged in the archive. The local results table above records the initial
implementation validation, before these review fixes.

After the fixes, existing runtime, CLI, registry, and validation checks pass.
Package builds, type checks, full repository lint and formatting also pass. The
rebuilt CLI passes its independent packed check. All 48 emitted controls pass
their packed CLI, type, production build, CSS, and browser checks at the corrected
revision. These checks do not add repository tests or change routine CI. The implementation
commit also passes the full staged-snapshot hook. Snapshot commands clear inherited
Git repository variables. Packed consumer versions use the Changesets release-plan
API, so the isolated checkout does not need Git history.

The implementation is recorded in local commits on the implementation branch.
This is local implementation evidence. No remote CI run, npm publication,
registry deployment, or live website check is implied. Published Vue v1 was not
deprecated. Physical-device RN testing is outside this web-only change.
