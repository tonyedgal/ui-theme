# UI-Theme registry

Private source workspace for the hosted UI-Theme control registry.

`pnpm build` creates 84 records: seven components, three supported framework/base
pairs, two Tailwind majors, and two languages. Vue uses Reka. React supports
Base UI and Radix. Templates are the canonical source for docs and copied code.

`pnpm snapshot` freezes the current generated revision in `releases/v1`.
Commit this archive when preparing a release. Clean builds restore these files
before generating the current revision. Existing archive bytes cannot change.
The revision includes generated payloads and the registry origin, so compiler
changes cannot reuse an old URL with different content.

The build also writes a shadcn layer at `{style}/{name}.json`. It has one
TypeScript, Tailwind 4 record per React component for each shadcn style:
`new-york`, `new-york-v4` and `default`, plus the `radix-*` styles, use Radix,
and the `base-*` styles use Base UI. These records follow the stable revision
and are not frozen. React Aria (`aria-*`) styles are not served. When shadcn
adds a style, add its name to `shadcnStyles` in `src/build.ts`.

shadcn records list shared libraries by package name only, for example
`lucide-react`. shadcn writes every versioned spec into the app's
`package.json`, so a bare name keeps the app's version. `uitheme-web@^2.0.0`
keeps its range, because the controls need the v2 runtime.

Each style folder also has a `registry.json` index without file content.
`shadcn search @uitheme` reads it, and the shadcn registry directory requires
it.

Run `pnpm test:registry:shadcn` from the repository root to check this layer
with the shadcn CLI. The check runs `shadcn add --dry-run` and
`shadcn search` for each style against a local build. It writes no files in
your app, but it needs network access because shadcn fetches its own `utils`
item. The logs are in `test-results/registry-shadcn`.

Each record contains absolute URLs. To serve a build from another address, run
`pnpm build --origin <url>`, for example `--origin http://localhost:4000/r`.
Then serve `dist/` at that URL and pass the same URL to the CLI `--registry`
flag. This build has a different revision. Run `pnpm build` again before you
build the website. `--origin` and `--snapshot` cannot be used together.

The website stages these artifacts at build time. It does not fetch source from
another server while serving a request. Do not publish this private workspace.

## Compatible dependency ranges

Each `metadata.json` lists the install spec for a dependency, for example
`lucide-react@^1.61.0`. `compatibleDependencies` adds an older range that an
app's existing dependency may satisfy, for example `>=0.397.0 <2.0.0`. The CLI
keeps an app's dependency inside that range and updates a dependency outside
it.

The lowest version of each range must have every named import that the
templates use, and accept the React or Vue versions that `uitheme-web`
supports. `pnpm test:registry:minimum` installs that version and checks both.
Run it after you add an import from one of these packages, and raise the range
when it fails. It needs network access.

## Inline expansion

Theme Selector and Color Theme Selector use floating menus only. Theme
Disclosure and Color Theme Disclosure are separate registry items. They contain
inline radio choices and a bounded scroll area. Selectors do not install
disclosure files. Set `direction="up"` on a disclosure to place choices above
the trigger. The default direction is `down`.

Each control ships its main component file. Icon Theme Toggle also installs
Theme Toggle. All controls reuse the configured shared `cn` utility. Transition
props use the public `ThemeControlTransitionProps` type from `uitheme-web`.
The runtime owns animation settings and preserves provider defaults when a
control passes undefined settings. Do not add local transition helpers.

Theme-changing controls accept `animationType`, `duration`, and `slideDirection` directly. `icon-theme-toggle` animates sun/moon icons. `theme-switcher` offers system/light/dark radio choices. Motion uses local Tailwind transitions and respects reduced motion.
