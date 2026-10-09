import { describe, expect, it, vi } from 'vitest';
import { createThemeStore } from '../src/core/store';

function deferred<T>() {
  let resolve!: (value: T) => void;

  const promise = new Promise<T>((done) => {
    resolve = done;
  });

  return { promise, resolve };
}

describe('native theme preference contract', () => {
  it('resolves system changes without replacing an explicit preference', () => {
    const store = createThemeStore({ colorThemes: ['default', 'mint'] });
    store.setSystemTheme('dark');
    expect(store.getSnapshot()).toMatchObject({
      theme: 'system',
      resolvedTheme: 'dark',
    });
    store.setTheme('light');
    store.setSystemTheme('dark');
    expect(store.getSnapshot().resolvedTheme).toBe('light');
    store.setTheme('system');
    expect(store.getSnapshot().resolvedTheme).toBe('dark');
  });

  it('restores untouched fields but never overwrites input during a slow read', async () => {
    const read = deferred<string | null>();
    const writes: string[] = [];

    const store = createThemeStore({
      colorThemes: ['default', 'mint'],
      storage: {
        getItem: () => read.promise,
        setItem: (_key, value) => {
          writes.push(value);
        },
      },
    });

    const hydration = store.hydrate();
    store.setTheme('light');
    expect(writes).toHaveLength(0);
    read.resolve(
      JSON.stringify({ version: 1, theme: 'dark', colorTheme: 'mint' })
    );
    await hydration;
    await store.flush();
    expect(store.getSnapshot()).toMatchObject({
      theme: 'light',
      colorTheme: 'mint',
      isHydrated: true,
    });
    expect(JSON.parse(writes.at(-1)!)).toMatchObject({
      theme: 'light',
      colorTheme: 'mint',
    });
  });

  it('serializes rapid writes so an older choice cannot finish last', async () => {
    const first = deferred<void>();
    const persisted: string[] = [];

    const store = createThemeStore({
      colorThemes: ['default'],
      storage: {
        getItem: () => null,
        setItem: async (_key, value) => {
          if (persisted.length === 0) await first.promise;
          persisted.push(JSON.parse(value).theme);
        },
      },
    });

    await store.hydrate();
    store.setTheme('dark');
    store.setTheme('light');
    await Promise.resolve();
    expect(persisted).toEqual([]);
    first.resolve();
    await store.flush();
    expect(persisted).toEqual(['dark', 'light']);
  });

  it.each([
    'not json',
    '{"version":2,"theme":"dark"}',
    '{"version":1,"theme":"invalid","colorTheme":"removed"}',
  ])('ignores incompatible stored data: %s', async (value) => {
    const store = createThemeStore({
      colorThemes: ['default'],
      storage: { getItem: () => value, setItem: vi.fn() },
    });

    await store.hydrate();
    expect(store.getSnapshot()).toMatchObject({
      theme: 'system',
      colorTheme: 'default',
      isHydrated: true,
    });
  });

  it('reports storage failures and continues accepting preferences', async () => {
    const error = new Error('disk unavailable');
    const onStorageError = vi.fn();

    const store = createThemeStore({
      colorThemes: ['default'],
      onStorageError,
      storage: {
        getItem: () => Promise.reject(error),
        setItem: () => Promise.reject(error),
      },
    });

    await store.hydrate();
    store.setTheme('dark');
    await store.flush();
    expect(store.getSnapshot()).toMatchObject({
      theme: 'dark',
      isHydrated: true,
    });
    expect(onStorageError).toHaveBeenCalledTimes(2);
  });

  it('hydrates once, maintains snapshot identity, and removes subscriptions', async () => {
    const getItem = vi.fn(() => null);

    const store = createThemeStore({
      colorThemes: ['default'],
      storage: { getItem, setItem: vi.fn() },
    });

    await Promise.all([store.hydrate(), store.hydrate()]);
    expect(getItem).toHaveBeenCalledTimes(1);
    const snapshot = store.getSnapshot();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.setTheme('system');
    expect(store.getSnapshot()).toBe(snapshot);
    store.setTheme('dark');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.setTheme('light');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid palette choices without changing or persisting state', () => {
    const store = createThemeStore({ colorThemes: ['default'] });
    expect(() => store.setColorTheme('missing')).toThrow();
    expect(() => createThemeStore({ colorThemes: [] })).toThrow();
    expect(() =>
      createThemeStore({
        colorThemes: ['default'],
        defaultColorTheme: 'missing',
      })
    ).toThrow();
    expect(store.getSnapshot().colorTheme).toBe('default');
  });
});
