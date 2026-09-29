---
'uitheme-web': patch
---

Require `@radix-ui/react-select` so the react entry loads for a new user
instead of failing with `ERR_MODULE_NOT_FOUND`.

Also drop the peer dependencies for the frameworks the package does not
build, stop publishing sourcemaps, and document the Tailwind `@source`
setup in the Next.js and Vite guides.
