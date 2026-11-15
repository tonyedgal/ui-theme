export const docsUrl = 'https://www.ui-theme.dev/docs/guides/next-themes';

export type DocsAnchor =
  'provider-props' | 'provider-shape' | 'usetheme' | 'manual-setup';

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
  manual: () => `Add the provider yourself. See ${docsUrl}#manual-setup`,
  removalPlan: (command: string) => `remove next-themes (${command})`,
};
