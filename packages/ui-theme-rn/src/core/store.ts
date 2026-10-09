import type {
  Theme,
  ThemeSnapshot,
  ThemeStoreOptions,
  ResolvedTheme,
} from './types';
import { z } from 'zod';

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system';
}

/** One store per provider. No global state, native imports, or browser APIs. */
export function createThemeStore(options: ThemeStoreOptions) {
  const colorThemes = [...options.colorThemes];
  const defaultColorTheme = options.defaultColorTheme ?? colorThemes[0];

  if (!defaultColorTheme || !colorThemes.includes(defaultColorTheme)) {
    throw new Error('UI-Theme requires an available default color theme.');
  }

  if (options.defaultTheme !== undefined && !isTheme(options.defaultTheme)) {
    throw new Error('Invalid default appearance mode.');
  }

  const storageKey = options.storageKey ?? 'uitheme-rn:preferences';

  const storedPreferences = z.object({
    version: z.literal(1),
    theme: z.enum(['light', 'dark', 'system']).optional().catch(undefined),
    colorTheme: z
      .string()
      .refine((name) => colorThemes.includes(name))
      .optional()
      .catch(undefined),
  });

  const listeners = new Set<() => void>();

  let state: ThemeSnapshot = Object.freeze({
    theme: options.defaultTheme ?? 'system',
    colorTheme: defaultColorTheme,
    systemTheme: options.systemTheme ?? 'light',
    resolvedTheme:
      options.defaultTheme === 'dark'
        ? 'dark'
        : options.defaultTheme === 'light'
          ? 'light'
          : (options.systemTheme ?? 'light'),
    isHydrated: !options.storage,
  });

  let dirtyTheme = false;
  let dirtyColorTheme = false;
  let hydration: Promise<void> | undefined;
  let writes = Promise.resolve();

  function update(next: Partial<ThemeSnapshot>) {
    const merged = { ...state, ...next };
    merged.resolvedTheme =
      merged.theme === 'system' ? merged.systemTheme : merged.theme;

    if (
      merged.theme === state.theme &&
      merged.colorTheme === state.colorTheme &&
      merged.systemTheme === state.systemTheme &&
      merged.resolvedTheme === state.resolvedTheme &&
      merged.isHydrated === state.isHydrated
    )
      return;
    state = Object.freeze(merged);
    listeners.forEach((listener) => listener());
  }

  function persist() {
    if (!options.storage || !state.isHydrated) return;

    const value = JSON.stringify({
      version: 1,
      theme: state.theme,
      colorTheme: state.colorTheme,
    });

    writes = writes
      .then(() => options.storage?.setItem(storageKey, value))
      .catch((cause) => {
        options.onStorageError?.(
          new Error('Could not write UI-Theme preferences.', { cause })
        );
      });
  }

  async function restore() {
    try {
      const value = await options.storage?.getItem(storageKey);

      if (value) {
        const result = storedPreferences.safeParse(JSON.parse(value));

        if (!result.success) return;
        const saved = result.data;
        update({
          theme:
            !dirtyTheme && saved.theme !== undefined
              ? saved.theme
              : state.theme,
          colorTheme:
            !dirtyColorTheme && saved.colorTheme !== undefined
              ? saved.colorTheme
              : state.colorTheme,
        });
      }
    } catch (cause) {
      options.onStorageError?.(
        new Error('Could not restore UI-Theme preferences.', { cause })
      );
    } finally {
      update({ isHydrated: true });

      if (dirtyTheme || dirtyColorTheme) persist();
    }
  }

  function setTheme(theme: Theme) {
    if (!['system', 'light', 'dark'].includes(theme))
      throw new Error('Invalid appearance mode.');
    // An explicit choice during restoration wins even when equal to the default.
    dirtyTheme = true;

    if (theme === state.theme) return;
    update({ theme });
    persist();
  }

  function setColorTheme(colorTheme: string) {
    if (!colorThemes.includes(colorTheme))
      throw new Error(`Unknown color theme: ${colorTheme}`);
    dirtyColorTheme = true;

    if (colorTheme === state.colorTheme) return;
    update({ colorTheme });
    persist();
  }

  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    hydrate() {
      hydration ??= restore();

      return hydration;
    },
    async flush() {
      hydration ??= restore();
      await hydration;
      await writes;
    },
    setTheme,
    setColorTheme,
    setSystemTheme(systemTheme: ResolvedTheme) {
      update({ systemTheme });
    },
    toggleTheme() {
      setTheme(state.resolvedTheme === 'dark' ? 'light' : 'dark');
    },
    toggleColorTheme() {
      setColorTheme(
        colorThemes[
          (colorThemes.indexOf(state.colorTheme) + 1) % colorThemes.length
        ]
      );
    },
  };
}

export type ThemeStore = ReturnType<typeof createThemeStore>;
