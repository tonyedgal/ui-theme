export const docsUrl = 'https://www.ui-theme.dev/docs/migration/next-themes';

export type DocsAnchor =
  'provider-props' | 'provider-shape' | 'usetheme' | 'manual-setup';

export type NextThemesMode = 'replace' | 'keep' | 'create';

export const nextThemesModes: readonly NextThemesMode[] = [
  'replace',
  'keep',
  'create',
];

export class NextThemesRefusal extends Error {}

export const messages = {
  replaced: (files: number) =>
    `Replaced next-themes with UI-Theme in ${files} files and removed the package.`,
  replacedPackageKept: (files: number) =>
    `Replaced next-themes with UI-Theme in ${files} files. The package is not declared in this app, so the CLI did not remove it.`,
  refusal: (location: string, form: string, anchor: DocsAnchor) =>
    `Stopped. No file changed. ${location} uses ${form}, which init cannot convert. See ${docsUrl}#${anchor}`,
  noProvider: () =>
    `Stopped. No file changed. The app imports next-themes but no ThemeProvider from it, so init cannot convert it. See ${docsUrl}#provider-shape`,
  removalFailed: (files: number, command: string) =>
    `Replaced next-themes in ${files} files. The package is still installed. Run: ${command}`,
  tanstackScript: () =>
    `Add TanStackStartThemeScript to the document head with the same storageKey, defaultTheme and themes as the provider, so the theme does not flash before hydration. See ${docsUrl}#manual-setup`,
  manual: () => `Add the provider yourself. See ${docsUrl}#manual-setup`,
  prompt: 'Replace next-themes with UI-Theme? [Y/n/c]',
  promptRefused: 'Create the UI-Theme provider as a separate file? [c/N]',
  options: {
    y: '  y  Replace: convert the provider and every useTheme import, then remove next-themes (default)',
    n: '  n  Keep: leave next-themes alone and set up the provider yourself',
    c: '  c  Create: keep next-themes and add the UI-Theme provider as a separate file',
    refusedN:
      '  N  Keep: leave next-themes alone and set up the provider yourself (default)',
  },
  created: (file: string) =>
    `Created ${file} with the UI-Theme provider. next-themes is unchanged. Add the provider yourself. See ${docsUrl}#manual-setup`,
  modePlan: (mode: NextThemesMode) => `next-themes: ${mode}`,
  removalPlan: (command: string) => `remove next-themes (${command})`,
};
