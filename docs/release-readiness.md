# UI-Theme release readiness

This work targets `uitheme-web`, with its existing `core`, `react`, and `tanstack`
public subpaths. CommonJS remains supported. Neither a package rename nor an
ESM-only major release is part of this batch.

## Handoff decisions

- Existing animation work stays intact: palettes, explicit trigger/origin,
  interruption, reduced motion, all effects, paired logos, and automatic sizing.
- Every provider publishes the same internal control context. Provider-specific
  hooks retain their existing public APIs. Controls mount a standalone hook only
  outside a provider; selector input tracking also covers its Radix portal.
- Bootstrap values are encoded as JavaScript literals with HTML-sensitive
  characters and Unicode separators escaped. Unit checks execute the scripts;
  browser checks parse and execute their actual HTML.
- Async TanStack server notifications are caught. `onServerError(error)` observes
  a failed notification; the default reports it through `console.error`. Failure
  does not roll back a successfully applied local theme.
- `useHydrated` is shared and exported from the React entry. It uses React 18's
  `useSyncExternalStore`; the existing React >=18 compatibility contract stays.
- Storage read failures use configured defaults. Failed writes reject the change
  and restore the requested destination to the last committed state, allowing
  retries.
- The existing ESLint/Prettier setup and all anti-slop rules are retained. Oxc is
  a tooling alternative from the reference repository, rather than a release
  prerequisite. Migrating while losing React compiler or framework coverage would
  reduce the current checks; no rules are disabled to clear this batch.
- ESM and CJS use minification and shared chunks. The React entry retains its
  client directive. The server helper subpath stays safe under React's server
  condition. The CLI retains its shebang and is tested with a real migration.

## Release checks

Run `pnpm install --frozen-lockfile`, `pnpm format:check`, `pnpm lint`,
`pnpm build`, and `pnpm typecheck`. Type checks now cover all five workspace
projects. Then run the library's `test`, `test:types`, `test:package`, and
`test:browser` scripts. The browser fixture imports the compiled public React
entry, while archive checks independently extract the packed package and verify
ESM/CJS imports, declarations, server helpers, and CLI behaviour.

Production dependencies were updated within supported major versions. Shadcn is
classified as development tooling; unused prospective framework dependencies
were removed from the library. Targeted yaml/esbuild overrides select patched
transitive versions. `pnpm audit --prod` is the production dependency gate.

Generated framework output is excluded from formatting and linting. TanStack
builds format their generated route tree before TypeScript consumes it. CI checks
formatting without rewriting files, runs all release checks on pull requests,
and requires the same checks before its existing main-branch release job.

Publishing, npm provenance, and remote CI results require a pushed branch and
remain outside the local verification boundary. Firefox's known active View
Transition screenshot limitation remains explicit in the affected visual tests;
its geometry and lifecycle checks still run.

## Verified local results

All five workspace builds and type checks pass. Workspace unit tests, public
declaration contracts, and extracted-package tests pass. Browser coverage reports
244 passed and 11 explicit skips across Chromium, Firefox, and WebKit, including
multiple pixel densities. ESLint and formatting checks are clean. Production Next
hydration and theme switching were also checked in a running production build.
The production dependency audit reports no known vulnerabilities.

## Development dependency boundary

The production audit is clean. The full development audit still reports
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm):
Changesets depends transitively on `braces`, and no patched version is available.
It is absent from production dependencies and the published theme package.
This finding is documented rather than ignored or suppressed. Recheck it before
running release tooling on untrusted glob patterns.
