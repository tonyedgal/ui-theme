export type Theme = 'light' | 'dark' | 'system';

export type ResolvedTheme = Exclude<Theme, 'system'>;

/** AsyncStorage, MMKV adapters, or synchronous app-owned storage. */
export interface ThemeStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
}

export interface ThemeSnapshot {
  readonly theme: Theme;
  readonly resolvedTheme: ResolvedTheme;
  readonly colorTheme: string;
  readonly systemTheme: ResolvedTheme;
  readonly isHydrated: boolean;
}

export interface ThemeStoreOptions {
  colorThemes: readonly string[];
  defaultTheme?: Theme;
  defaultColorTheme?: string;
  systemTheme?: ResolvedTheme;
  storage?: ThemeStorage;
  storageKey?: string;
  onStorageError?: (error: Error) => void;
}
