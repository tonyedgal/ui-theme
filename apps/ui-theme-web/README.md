# UI-Theme website

The docs, the component previews and the hosted registry at
[ui-theme.dev](https://www.ui-theme.dev). Built with Next.js and Fumadocs.

## Quick start

From the repository root:

```sh
pnpm --filter uitheme-web build
pnpm --filter ui-theme-web dev
```

`dev` builds the registry first, then starts the site at
`http://localhost:3000`. Edit a page in `content/docs/` or a control's guide in
`content/components/`, and it reloads.

## How the registry gets here

`build` and `dev` copy the registry from `packages/ui-theme-registry/dist` into
`public/r`. The site serves those files as they are, and the component pages
show their source. Nothing is fetched from another server at runtime, and the
build stops if the registry is missing.

`/r/manifest.json` points to the current revision. Requests for `/r` on
`uitheme.dev`, `www.uitheme.dev` and `ui-theme.dev` redirect to
`https://www.ui-theme.dev/r`.

## Testing

```sh
pnpm --filter ui-theme-web typecheck
pnpm --filter ui-theme-web build
pnpm --filter ui-theme-web test:browser
```

The browser tests run against the production build on port 4290. They cover
page loads, saved themes, the registry responses, and the component page
switches for base, language and Tailwind version. Failures keep screenshots
and traces. Install the Playwright browsers first.
