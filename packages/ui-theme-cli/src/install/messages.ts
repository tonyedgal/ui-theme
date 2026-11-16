export const docsUrl =
  'https://www.ui-theme.dev/docs/migration/existing-theme-setup';

export type DocsAnchor =
  | 'provider-props'
  | 'provider-shape'
  | 'usetheme'
  | 'manual-setup'
  | 'next-themes'
  | 'shadcn-provider'
  | 'other-library'
  | 'custom-provider'
  | 'upgrade'
  | 'v1';

export const docs = (anchor: DocsAnchor) => `${docsUrl}#${anchor}`;

export type ExistingChoice = 'convert' | 'alongside' | 'manual';

export const existingChoices: readonly ExistingChoice[] = [
  'convert',
  'alongside',
  'manual',
];

export type SetupKind =
  | 'next-themes'
  | 'shadcn-vite'
  | 'shadcn-tanstack'
  | 'ui-theme-v1'
  | 'library'
  | 'custom';

export const setupAnchor: Record<SetupKind, DocsAnchor> = {
  'next-themes': 'next-themes',
  'shadcn-vite': 'shadcn-provider',
  'shadcn-tanstack': 'shadcn-provider',
  'ui-theme-v1': 'v1',
  library: 'other-library',
  custom: 'custom-provider',
};

export class ConversionRefusal extends Error {}

export const messages = {
  label: (kind: SetupKind, library?: string) =>
    ({
      'next-themes': 'next-themes',
      'shadcn-vite': 'the shadcn theme provider for Vite',
      'shadcn-tanstack': 'the shadcn theme provider for TanStack Start',
      'ui-theme-v1': 'UI-Theme 1',
      library: library ?? 'another theme library',
      custom: 'a custom theme provider',
    })[kind],
  found: (label: string, file: string) => `Found ${label} in ${file}.`,
  evidence: (file: string, line: number, note: string) =>
    `  ${file}:${line} ${note}`,
  prompt: 'What should init do with it?',
  options: {
    convert: '  c  Convert: rewrite it to UI-Theme and remove what it replaces',
    alongside:
      '  a  Alongside: write the UI-Theme provider file, but do not mount it',
    manual: '  m  Manual: leave it unchanged and set up the provider yourself',
  },
  choiceKeys: { convert: 'c', alongside: 'a', manual: 'm' } as const,
  converted: (label: string, files: number) =>
    `Converted ${label} to UI-Theme in ${files} files.`,
  removed: (packages: string[]) => `Removed ${packages.join(', ')}.`,
  removalFailed: (files: number, command: string) =>
    `Converted ${files} files. The old package is still installed. Run: ${command}`,
  refusal: (location: string, form: string, anchor: DocsAnchor) =>
    `init did not convert the theme setup and changed no theme file. ${location} uses ${form}, which init cannot convert. See ${docs(anchor)}`,
  noProvider: () =>
    `init did not convert the theme setup and changed no theme file. The app imports next-themes but no ThemeProvider from it. See ${docs('provider-shape')}`,
  syntax: (file: string) =>
    `init did not convert the theme setup and changed no theme file. ${file} has a syntax error. Fix the error and run init again. See ${docs('provider-shape')}`,
  leftover: (file: string) =>
    `init did not convert the theme setup and changed no theme file. ${file} still mentions next-themes after the rewrite. See ${docs('provider-shape')}`,
  multiple: (labels: string[]) =>
    `The app has more than one theme setup (${labels.join(', ')}). init does not convert any of them. Keep one and run init again. See ${docs('manual-setup')}`,
  noConverter: (label: string, kind: SetupKind) =>
    kind === 'ui-theme-v1'
      ? `The app uses UI-Theme 1. Run \`uitheme migrate\` first, then run init again. See ${docs('v1')}`
      : kind === 'library'
        ? `The app uses ${label}, which also sets the dark class on <html>. init does not run UI-Theme next to it. Remove ${label} and run init again, or set up the provider yourself. See ${docs('other-library')}`
        : `The app has ${label}. init does not rewrite it. Replace it with the UI-Theme provider yourself. See ${docs('custom-provider')}`,
  invalidChoice: (choice: ExistingChoice, label: string) =>
    `--existing ${choice} does not apply to ${label}. init leaves it unchanged.`,
  manual: () => `Add the provider yourself. See ${docs('manual-setup')}`,
  alongside: (file: string) =>
    `Created ${file} with the UI-Theme provider. init did not mount it. Replace your theme provider with it. See ${docs('custom-provider')}`,
  tanstackScript: () =>
    `Add TanStackStartThemeScript to the document head with the same storageKey, defaultTheme and themes as the provider, so the theme does not flash before hydration. See ${docs('manual-setup')}`,
  plan: (label: string, choice: ExistingChoice) =>
    `existing theme setup: ${label} -> ${choice}`,
  removalPlan: (command: string) => `remove old package (${command})`,
};
