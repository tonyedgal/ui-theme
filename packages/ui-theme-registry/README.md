# UI-Theme registry

Private source workspace for the hosted UI-Theme control registry.

`pnpm build` creates 48 records: four controls, three supported framework/base
pairs, two Tailwind majors, and two languages. Vue uses Reka. React supports
Base UI and Radix. Templates are the canonical source for docs and copied code.

`pnpm snapshot` freezes the current generated revision in `releases/v1`.
Commit this archive when preparing a release. Clean builds restore these files
before generating the current revision. Existing archive bytes cannot change.
The revision includes generated payloads and the registry origin, so compiler
changes cannot reuse an old URL with different content.

The website stages these artifacts at build time. It does not fetch source from
another server while serving a request. Do not publish this private workspace.
