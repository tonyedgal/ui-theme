export type Framework =
  'vite-react' | 'vite-vue' | 'next' | 'tanstack' | 'nuxt';

export type Base = 'base-ui' | 'radix' | 'reka';

export type Language = 'ts' | 'js';

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

export interface ProjectProfile {
  cwd: string;
  workspaceRoot: string;
  framework: Framework;
  frameworkVersion: string;
  language: Language;
  packageManager: PackageManager;
  tailwind: 3 | 4;
  cssFile: string;
  tailwindConfigFile?: string;
  componentsDir: string;
  utilsFile?: string;
  aliasPrefix: string;
  base: Base;
  colorFormat: 'css' | 'hsl-channels';
  configFile: string;
}

export type ProjectOverrides = Partial<
  Omit<ProjectProfile, 'cwd' | 'workspaceRoot' | 'configFile'>
> & { cwd?: string };

export interface InstalledFile {
  path: string;
  hash: string;
}

export interface SavedConfig extends Partial<
  Omit<ProjectProfile, 'cwd' | 'workspaceRoot' | 'configFile'>
> {
  schemaVersion: 1;
  revision?: string;
  installed?: Record<string, { revision: string; files: InstalledFile[] }>;
}

export interface RegistryVariant {
  framework: 'react' | 'vue';
  base: Base;
  tailwind: 3 | 4;
  language: Language;
}

export interface RegistryMeta extends RegistryVariant {
  schemaVersion: 1;
  revision: string;
  component: string;
  webVersion: string;
  cliVersion: string;
}

export interface RegistryFile {
  path: string;
  content: string;
  type: string;
  target?: string;
}

export interface RegistryItem {
  name: string;
  type: string;
  title: string;
  description: string;
  dependencies: string[];
  registryDependencies: string[];
  files: RegistryFile[];
  meta: { uiTheme: RegistryMeta };
}

export interface RegistryManifest {
  schemaVersion: 1;
  stable: {
    revision: string;
    index: string;
    webVersion: string;
    cliVersion: string;
  };
}

export interface RegistryIndex {
  name: 'uitheme';
  homepage: string;
  items: RegistryItem[];
}

export type HttpClient = (
  url: string
  // eslint-disable-next-line anti-slop/no-unknown-returns -- external JSON is validated by the registry client
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export interface RegistryGraph {
  manifest: RegistryManifest;
  items: RegistryItem[];
}
