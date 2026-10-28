# UI-Theme website

The website serves v2 framework documentation, canonical component previews,
and the static UI-Theme registry.

From the workspace root, build the runtime and registry before the website:

```sh
pnpm --filter uitheme-web build
pnpm --filter @ui-theme/registry build
pnpm --filter ui-theme-web build
```

Both website `build` and `dev` stage the registry first. The staging script
reads `packages/ui-theme-registry/dist`, copies the static artifact to ignored
`public/r`, and writes ignored `.generated/registry.json` for the source viewer.
A missing or inconsistent registry artifact stops the build. The website does
not fetch an upstream registry at runtime. Keep older immutable revisions in
the registry artifact when producing a later release.

`/r/manifest.json` selects the stable revision. Its index and component URLs
live under `/r/v1/<revision>/`. Preview source comes from that same artifact.
React previews import the canonical template files directly for Base UI and
Radix. They share a provider and controlled transition settings. Vue source is
shown for Reka; this React website does not render Vue previews.

```sh
pnpm --filter ui-theme-web typecheck
pnpm --filter ui-theme-web test:browser
```

Browser tests use an existing production build on port 4290. They cover page
loading, appearance persistence, local registry graph responses, base/source/
command consistency, language and Tailwind selection, and migration guidance.
Playwright retains screenshots and traces for failures. Browser binaries must
already be installed; routine CI does not download them.

The homepage and its design assets are maintained separately from this docs
integration.
