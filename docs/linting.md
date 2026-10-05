# Workspace linting

Run commands from the repository root with Node **22.18.0 or newer**, required by `antislop-plugin`:

```sh
pnpm install
pnpm lint
pnpm lint:fix
pnpm format:check
```

`pnpm lint` runs ESLint directly over the whole workspace, including root configuration files, library code, examples, documentation-app code, and browser tests. Every workspace project also has `lint` and `lint:fix` scripts for local checks. They all discover the single root `eslint.config.mjs`; the former app-specific configurations have been removed.

## Enabled presets

| Preset                                  | Scope                                                                        |
| --------------------------------------- | ---------------------------------------------------------------------------- |
| `@eslint/js` recommended                | JavaScript and TypeScript throughout the workspace                           |
| `typescript-eslint` recommended         | All `.ts`, `.tsx`, `.mts`, and `.cts` files                                  |
| React recommended and JSX runtime       | Workspace scripts and components; supports the automatic JSX transform       |
| React Hooks flat recommended            | Workspace scripts and components, including hooks written in `.ts` files     |
| Next.js recommended and Core Web Vitals | `apps/ui-theme-web` and `apps/examples/example-next`                         |
| JSX accessibility recommended           | Both Next.js apps; preserves and extends their existing accessibility checks |
| `antislop-plugin/eslint` all            | All 18 generic anti-slop rules at error severity, workspace-wide             |

The Next apps retain the existing anonymous-default-export warning. Next project roots are absolute paths so local app commands and root commands use the same framework settings. Effect-specific anti-slop rules are not enabled because this workspace does not use Effect.

The TypeScript preset is the recommended syntax-based preset, not `recommendedTypeChecked`. TypeScript compilation remains a separate check; linting includes browser tests and configuration files that are outside application compilation includes.

Prettier remains the formatter. `eslint-config-prettier` disables conflicting formatting rules. ESLint's recommended `no-unexpected-multiline` safety check is explicitly restored afterward; all requested recommended rule levels and all anti-slop rules remain active.

Generated output is ignored: dependencies, build output, Next/Fumadocs output, coverage, Playwright artifacts, generated TanStack route trees, and Next environment declarations. Authored source and tests are not excluded to hide findings.

## Validation on 2026-10-02

- Effective configurations checked across **117 files** in **six workspace projects**.
- All 18 anti-slop rules verified at error severity in every linted file.
- Every requested recommended preset's effective rule levels verified in each project, using that project's working directory.
- Next rules verified present only in the two Next apps; generated-file exclusions verified.
- The new ESLint configuration itself passes lint and Prettier checks.
- The completed release branch passes workspace lint with zero errors and zero warnings. Source findings in hydration, provider ownership, assertion safety, spacing, and accessibility have been addressed without weakening the rules.

The release workflow runs `pnpm lint` under Node 24. All five projects also have explicit TypeScript checks; formatting ignores generated framework and browser output.

## References

- [Anti-slop ESLint package guide](https://github.com/tonyedgal/anti-slop/blob/main/docs/ESLINT.md)
- [ESLint flat configuration](https://eslint.org/docs/latest/use/configure/configuration-files)
- [TypeScript ESLint configurations](https://typescript-eslint.io/users/configs/)
- [React flat configurations](https://github.com/jsx-eslint/eslint-plugin-react#flat-configs)
- [React Hooks recommended rules](https://react.dev/reference/eslint-plugin-react-hooks)
- [Next.js ESLint configuration](https://nextjs.org/docs/app/api-reference/config/eslint)
