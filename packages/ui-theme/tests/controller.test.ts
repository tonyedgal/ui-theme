// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { createThemeController } from '../src/core/controller';

let systemDark = false;

let systemListeners: Set<() => void>;

const controllers: ReturnType<typeof createThemeController>[] = [];

const create = (...args: Parameters<typeof createThemeController>) => {
  const controller = createThemeController(...args);
  controllers.push(controller);

  return controller;
};

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = '';
  document.documentElement.style.colorScheme = '';
  systemDark = false;
  systemListeners = new Set();
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return query.includes('color-scheme') && systemDark;
    },
    addEventListener: (_event: string, listener: () => void) => {
      if (query.includes('color-scheme')) systemListeners.add(listener);
    },
    removeEventListener: (_event: string, listener: () => void) => {
      systemListeners.delete(listener);
    },
  }));
});

afterEach(() => {
  controllers.splice(0).forEach((controller) => controller.dispose());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test('construction leaves the document alone and server state excludes browser preferences', () => {
  localStorage.setItem('theme', 'dark');

  const controller = create({
    defaultTheme: 'light',
    colorThemes: ['default', 'ocean'],
  });

  expect(controller.getSnapshot().theme).toBe('dark');
  expect(controller.getServerSnapshot()).toMatchObject({
    theme: 'light',
    resolvedTheme: 'light',
    mounted: false,
  });
  expect(document.documentElement.className).toBe('');
  controller.mount();
  expect(controller.getSnapshot().mounted).toBe(true);
  expect(document.documentElement.classList.contains('dark')).toBe(true);
});

test('immediate setters synchronously share state, persistence and classes without a capture', () => {
  const capture = vi.fn();
  document.startViewTransition = capture;
  const onThemeChange = vi.fn();

  const controller = create({
    defaultTheme: 'light',
    colorThemes: ['default', 'ocean'],
    onThemeChange,
  });

  controller.mount();
  const listener = vi.fn();
  const unsubscribe = controller.subscribe(listener);
  const before = controller.getSnapshot();
  expect(controller.getSnapshot()).toBe(before);
  controller.setTheme('dark');
  controller.setColorTheme('ocean');
  expect(controller.getSnapshot()).toMatchObject({
    theme: 'dark',
    colorTheme: 'ocean',
  });
  expect(document.documentElement.classList.contains('dark')).toBe(true);
  expect(document.documentElement.classList.contains('theme-ocean')).toBe(true);
  expect(localStorage.getItem('theme')).toBe('dark');
  expect(localStorage.getItem('color-theme')).toBe('ocean');
  expect(onThemeChange).toHaveBeenCalledExactlyOnceWith('dark');
  expect(listener).toHaveBeenCalledTimes(2);
  expect(capture).not.toHaveBeenCalled();
  unsubscribe();
  controller.setTheme('light');
  expect(listener).toHaveBeenCalledTimes(2);
});

test('controlled requests notify once and wait for the owner before changing rendered state', async () => {
  const onThemeChange = vi.fn();

  const controller = create({
    theme: 'light',
    colorTheme: 'default',
    onThemeChange,
  });

  controller.mount();
  await controller.switchTheme('dark', true);
  controller.updateOptions({ duration: 200 });
  await controller.switchTheme('dark', true);
  expect(onThemeChange).toHaveBeenCalledExactlyOnceWith('dark');
  expect(controller.getSnapshot().theme).toBe('light');
  expect(document.documentElement.classList.contains('dark')).toBe(false);
  controller.updateOptions({ theme: 'dark' });
  expect(controller.getSnapshot().theme).toBe('dark');
  expect(document.documentElement.classList.contains('dark')).toBe(true);
  expect(onThemeChange).toHaveBeenCalledTimes(1);
});

test('system changes update all subscribers and disposal removes listeners across remounts', () => {
  const controller = create({ defaultTheme: 'system', systemThemeMode: 'css' });
  const unmount = controller.mount();
  expect(systemListeners.size).toBe(1);
  systemDark = true;
  systemListeners.forEach((listener) => listener());
  expect(controller.getSnapshot()).toMatchObject({
    theme: 'system',
    resolvedTheme: 'dark',
    systemTheme: 'dark',
  });
  expect(document.documentElement.classList.contains('system')).toBe(true);
  expect(document.documentElement.classList.contains('dark')).toBe(false);
  expect(document.documentElement.style.colorScheme).toBe('');
  unmount();
  expect(systemListeners.size).toBe(0);
  controller.mount();
  expect(systemListeners.size).toBe(1);
  controller.dispose();
  expect(systemListeners.size).toBe(0);
});

test('cross-tab changes validate values, avoid persistence echoes and reset removed preferences', () => {
  const onThemeChange = vi.fn();

  const controller = create({
    defaultTheme: 'light',
    colorThemes: ['default', 'ocean'],
    onThemeChange,
  });

  controller.mount();
  const write = vi.spyOn(Storage.prototype, 'setItem');

  const send = (key: string, newValue: string | null) =>
    window.dispatchEvent(
      new StorageEvent('storage', { key, newValue, storageArea: localStorage })
    );

  send('theme', 'dark');
  send('color-theme', 'ocean');
  expect(controller.getSnapshot()).toMatchObject({
    theme: 'dark',
    colorTheme: 'ocean',
  });
  send('theme', 'invalid');
  send('color-theme', 'invalid');
  expect(controller.getSnapshot()).toMatchObject({
    theme: 'dark',
    colorTheme: 'ocean',
  });
  send('theme', null);
  send('color-theme', null);
  expect(controller.getSnapshot()).toMatchObject({
    theme: 'light',
    colorTheme: 'default',
  });
  expect(write).not.toHaveBeenCalled();
  expect(onThemeChange).not.toHaveBeenCalled();
  controller.dispose();
  send('theme', 'dark');
  expect(controller.getSnapshot().theme).toBe('light');
});

test('a failed persistence request can retry the same destination', async () => {
  const controller = create({ defaultTheme: 'light' });
  controller.mount();

  const write = vi
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementationOnce(() => {
      throw new Error('Storage blocked');
    });

  await expect(controller.switchTheme('dark', true)).rejects.toThrow(
    'Storage blocked'
  );
  expect(controller.getSnapshot().theme).toBe('light');
  await controller.switchTheme('dark', true);
  expect(controller.getSnapshot().theme).toBe('dark');
  expect(write).toHaveBeenCalledTimes(2);
});

test('controllers keep state independent and remove old palette classes after option changes', () => {
  const first = create({
    defaultTheme: 'light',
    colorThemes: ['default', 'ocean'],
  });

  const second = create({ defaultTheme: 'light' });
  first.mount();
  first.setTheme('dark');
  first.setColorTheme('ocean');
  expect(second.getSnapshot().theme).toBe('light');
  first.updateOptions({ colorThemePrefix: 'palette-', colorThemes: ['ocean'] });
  expect(first.getSnapshot().colorThemes).toEqual(['ocean']);
  expect(document.documentElement.classList.contains('theme-ocean')).toBe(
    false
  );
  expect(document.documentElement.classList.contains('palette-ocean')).toBe(
    true
  );
});

test('rapid toggles use the requested destination and reject unavailable animated palettes', async () => {
  const onThemeChange = vi.fn();
  const onColorThemeChange = vi.fn();
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

  const controller = create({
    defaultTheme: 'light',
    colorThemes: ['default', 'ocean'],
    onThemeChange,
    onColorThemeChange,
  });

  controller.mount();
  await Promise.all([
    controller.toggleTheme(true),
    controller.toggleTheme(true),
  ]);
  expect(controller.getSnapshot().theme).toBe('light');
  expect(onThemeChange.mock.calls).toEqual([['dark'], ['light']]);
  await controller.switchColorTheme('missing', true);
  expect(onColorThemeChange).not.toHaveBeenCalled();
  expect(warn).toHaveBeenCalledOnce();
  await controller.toggleColorTheme(true);
  expect(controller.getSnapshot().colorTheme).toBe('ocean');
});

test('native capture waits for the adapter to finish rendering the committed state', async () => {
  let release: () => void = () => {};

  const rendered = new Promise<void>((resolve) => {
    release = resolve;
  });

  let captureDone = false;

  const capture = vi.fn((update: () => Promise<void> | void) => {
    const updateCallbackDone = Promise.resolve().then(update);
    void updateCallbackDone.then(() => {
      captureDone = true;
    });

    return {
      updateCallbackDone,
      ready: updateCallbackDone,
      finished: new Promise<void>(() => {}),
      skipTransition: vi.fn(),
    };
  });

  document.startViewTransition = capture;

  const controller = create(
    { defaultTheme: 'light' },
    {
      commit: async (update) => {
        update();
        await rendered;
      },
    }
  );

  controller.mount();

  const switching = controller.switchTheme('dark', {
    origin: { x: 20, y: 30 },
  });

  await Promise.resolve();
  await Promise.resolve();
  expect(controller.getSnapshot().theme).toBe('dark');
  expect(captureDone).toBe(false);
  release();
  await switching;
  expect(capture).toHaveBeenCalledOnce();
  expect(captureDone).toBe(true);
});

test('custom storage reads and writes its own keys and ignores browser storage events', () => {
  const storage = {
    getItem: vi.fn((key: string) => (key === 'appearance' ? 'dark' : 'ocean')),
    setItem: vi.fn(),
  };

  const controller = create({
    storage,
    storageKey: 'appearance',
    colorStorageKey: 'palette',
    colorThemes: ['default', 'ocean'],
  });

  const listen = vi.spyOn(window, 'addEventListener');
  controller.mount();
  expect(controller.getSnapshot()).toMatchObject({
    theme: 'dark',
    colorTheme: 'ocean',
  });
  controller.setTheme('light');
  controller.setColorTheme('default');
  expect(storage.setItem.mock.calls).toEqual([
    ['appearance', 'light'],
    ['palette', 'default'],
  ]);
  expect(localStorage.length).toBe(0);
  expect(listen.mock.calls.some(([type]) => type === 'storage')).toBe(false);
  window.dispatchEvent(
    new StorageEvent('storage', { key: 'appearance', newValue: 'dark' })
  );
  expect(controller.getSnapshot().theme).toBe('light');
});

test('disabled storage and blocked initial reads keep theme changes usable', () => {
  localStorage.setItem('theme', 'dark');
  const controller = create({ storage: false, defaultTheme: 'light' });
  controller.mount();
  expect(controller.getSnapshot().theme).toBe('light');
  controller.setTheme('system');
  expect(localStorage.getItem('theme')).toBe('dark');

  const blocked = create({
    storage: {
      getItem: () => {
        throw new Error('Storage blocked');
      },
      setItem: vi.fn(),
    },
    defaultTheme: 'dark',
  });

  expect(blocked.getSnapshot().theme).toBe('dark');
});

test('mount refreshes browser preferences without replacing an explicit server or user choice', () => {
  const controller = create({ defaultTheme: 'light' });
  const server = create({ initialTheme: 'light' });
  const changed = create({ defaultTheme: 'light' });
  changed.setTheme('system');
  localStorage.setItem('theme', 'dark');
  controller.mount();
  server.mount();
  changed.mount();
  expect(controller.getSnapshot().theme).toBe('dark');
  expect(server.getSnapshot().theme).toBe('light');
  expect(changed.getSnapshot().theme).toBe('system');
});

test('per-trigger animation overrides do not change another trigger or the shared defaults', async () => {
  const capture = vi.fn((update: () => Promise<void> | void) => {
    const done = Promise.resolve().then(update);

    return {
      updateCallbackDone: done,
      ready: done,
      finished: new Promise<void>(() => {}),
      skipTransition: vi.fn(),
    };
  });

  document.startViewTransition = capture;
  const controller = create({ defaultTheme: 'light', duration: 0 });
  controller.mount();
  await controller.switchTheme('dark', {
    duration: 200,
    origin: { x: 10, y: 15 },
  });
  expect(capture).toHaveBeenCalledTimes(1);
  await controller.switchTheme('light', { origin: { x: 20, y: 25 } });
  expect(capture).toHaveBeenCalledTimes(1);
});

test('configured palettes select a valid default and reject invalid defaults before mounting', () => {
  const controller = create({ colorThemes: ['sand', 'ocean'] });
  expect(controller.getSnapshot().colorTheme).toBe('sand');
  expect(controller.getServerSnapshot().colorTheme).toBe('sand');
  expect(() =>
    create({ colorThemes: ['sand'], defaultColorTheme: 'missing' })
  ).toThrow(/defaultColorTheme/);
  expect(() => create({ themes: ['light'], defaultTheme: 'dark' })).toThrow(
    /defaultTheme/
  );
  expect(() => create({ globalClassName: 'two classes' })).toThrow(
    /class token/i
  );
  expect(systemListeners.size).toBe(0);
});

test('option changes reconcile removed uncontrolled choices without writing preferences or callbacks', () => {
  const callback = vi.fn();

  const controller = create({
    defaultTheme: 'light',
    colorThemes: ['default', 'ocean'],
    onColorThemeChange: callback,
  });

  controller.mount();
  controller.setColorTheme('ocean');
  callback.mockClear();
  const write = vi.spyOn(Storage.prototype, 'setItem');
  controller.updateOptions({ colorThemes: ['sand'] });
  expect(controller.getSnapshot().colorTheme).toBe('sand');
  expect(document.documentElement.classList.contains('theme-ocean')).toBe(
    false
  );
  expect(document.documentElement.classList.contains('theme-sand')).toBe(true);
  expect(write).not.toHaveBeenCalled();
  expect(callback).not.toHaveBeenCalled();
  expect(() =>
    controller.updateOptions({ defaultColorTheme: 'missing' })
  ).toThrow(/defaultColorTheme/);
  expect(controller.getSnapshot().colorTheme).toBe('sand');
});

test('snapshots own immutable option lists while later explicit updates can replace client options', () => {
  const palettes = ['default'];
  const controller = create({ colorThemes: palettes });
  const initial = controller.getSnapshot();
  const server = controller.getServerSnapshot();
  palettes.push('ocean');
  expect(initial.colorThemes).toEqual(['default']);
  expect(server.colorThemes).toEqual(['default']);
  expect(Object.isFrozen(initial.colorThemes)).toBe(true);
  controller.updateOptions({ colorThemes: palettes });
  expect(controller.getSnapshot().colorThemes).toEqual(['default', 'ocean']);
  expect(server.colorThemes).toEqual(['default']);
});

test('malformed action values fail before persistence while immediate setters retain unlisted valid palettes', () => {
  const onThemeChange = vi.fn();
  const onColorThemeChange = vi.fn();

  const controller = create({
    defaultTheme: 'light',
    onThemeChange,
    onColorThemeChange,
  });

  controller.mount();
  expect(() => controller.setTheme(JSON.parse('"sepia"'))).toThrow(/theme/i);
  expect(() => controller.setColorTheme('two words')).toThrow(/class token/i);
  expect(localStorage.length).toBe(0);
  expect(controller.getSnapshot()).toMatchObject({
    theme: 'light',
    colorTheme: 'default',
  });
  expect(onThemeChange).not.toHaveBeenCalled();
  expect(onColorThemeChange).not.toHaveBeenCalled();
  controller.setColorTheme('custom');
  expect(controller.getSnapshot().colorTheme).toBe('custom');
});

test('malformed controlled or initial values reject before construction and options updates remain atomic', () => {
  expect(() => createThemeController(JSON.parse('{"theme":"sepia"}'))).toThrow(
    /theme/i
  );
  expect(() => create({ initialColorTheme: 'two words' })).toThrow(
    /class token/i
  );
  const controller = create({ defaultTheme: 'light' });
  expect(() => controller.updateOptions({ colorTheme: 'two words' })).toThrow(
    /class token/i
  );
  expect(controller.getSnapshot().colorTheme).toBe('default');
  controller.setTheme('dark');
  expect(controller.getSnapshot().theme).toBe('dark');
});

test('theme toggles follow configured alternatives when the resolved opposite is unavailable', async () => {
  const controller = create({
    themes: ['light', 'system'],
    defaultTheme: 'light',
  });

  await controller.toggleTheme(true);
  expect(controller.getSnapshot().theme).toBe('system');
  await controller.toggleTheme(true);
  expect(controller.getSnapshot().theme).toBe('light');
  const singleChanged = vi.fn();

  const singleton = create({
    themes: ['light'],
    defaultTheme: 'light',
    onThemeChange: singleChanged,
  });

  await singleton.toggleTheme(true);
  expect(singleton.getSnapshot().theme).toBe('light');
  expect(singleChanged).not.toHaveBeenCalled();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  await controller.switchTheme('dark', true);
  expect(controller.getSnapshot().theme).toBe('light');
});

test('an adapter may handle native write errors without swallowing explicit custom storage failures', () => {
  const error = new Error('Storage blocked');
  const handled = vi.fn();

  const controller = create(
    { defaultTheme: 'light' },
    { onBrowserStorageError: handled }
  );

  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw error;
  });
  controller.setTheme('dark');
  expect(controller.getSnapshot().theme).toBe('dark');
  expect(handled).toHaveBeenCalledExactlyOnceWith(error);

  const custom = create(
    {
      defaultTheme: 'light',
      storage: {
        getItem: () => null,
        setItem: () => {
          throw error;
        },
      },
    },
    { onBrowserStorageError: handled }
  );

  expect(() => custom.setTheme('dark')).toThrow(error);
  expect(custom.getSnapshot().theme).toBe('light');
  expect(handled).toHaveBeenCalledTimes(1);
});
