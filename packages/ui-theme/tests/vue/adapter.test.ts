// @vitest-environment jsdom
import {
  createApp,
  createSSRApp,
  h,
  nextTick,
  reactive,
  isReadonly,
  shallowRef,
} from 'vue';
import { renderToString } from 'vue/server-renderer';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  createUITheme,
  UIThemeProvider,
  useUITheme as getUITheme,
  type UIThemeOptions,
} from '../../src/vue';

let listeners: Set<() => void>;

const apps: ReturnType<typeof createApp>[] = [];

beforeEach(() => {
  localStorage.clear();
  listeners = new Set();
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: (_: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) =>
      listeners.delete(listener),
  }));
});

afterEach(() => {
  apps.forEach((app) => app.unmount());
  apps.length = 0;
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test('SSR apps keep their own initial preferences without reading browser storage', async () => {
  localStorage.setItem('theme', 'dark');

  const Consumer = {
    setup() {
      const state = getUITheme();

      return () =>
        h(
          'span',
          `${state.theme.value}:${state.colorTheme.value}:${state.mounted.value}`
        );
    },
  };

  const first = createSSRApp(Consumer).use(
    createUITheme({
      defaultTheme: 'light',
      colorThemes: ['sand'],
      defaultColorTheme: 'sand',
    })
  );

  const second = createSSRApp(Consumer).use(
    createUITheme({
      defaultTheme: 'dark',
      colorThemes: ['sea'],
      defaultColorTheme: 'sea',
    })
  );

  expect(await renderToString(first)).toContain('light:sand:false');
  expect(await renderToString(second)).toContain('dark:sea:false');
  expect(await renderToString(first)).toContain('light:sand:false');
  expect(listeners.size).toBe(0);
});

test('consumers share read-only reactive state and release one listener on app unmount', async () => {
  let state!: ReturnType<typeof getUITheme>;

  const Consumer = {
    setup() {
      const current = getUITheme();
      state = current;

      return () =>
        h('button', `${current.theme.value}:${current.colorTheme.value}`);
    },
  };

  const container = document.createElement('div');
  document.body.append(container);

  const app = createApp(() => h('main', [h(Consumer), h(Consumer)]));

  apps.push(app);
  app.use(
    createUITheme({ defaultTheme: 'light', colorThemes: ['default', 'sea'] })
  );
  app.mount(container);
  expect(listeners.size).toBe(1);
  expect(isReadonly(state.theme)).toBe(true);
  state.setTheme('dark');
  await state.switchColorTheme('sea', true);
  await nextTick();
  expect(
    [...container.querySelectorAll('button')].map(
      (button) => button.textContent
    )
  ).toEqual(['dark:sea', 'dark:sea']);
  expect(state.isColorThemeActive('sea')).toBe(true);
  app.unmount();
  apps.length = 0;
  expect(listeners.size).toBe(0);
});

test('provider options update callbacks and available palettes without replacing its state', async () => {
  const first = vi.fn();
  const second = vi.fn();

  const options = reactive({
    defaultTheme: 'light' as const,
    colorThemes: ['default'],
    onThemeChange: first,
  });

  let state!: ReturnType<typeof getUITheme>;

  const Consumer = {
    setup() {
      state = getUITheme();

      return () => h('span', state.colorTheme.value);
    },
  };

  const container = document.createElement('div');
  document.body.append(container);

  const app = createApp(() =>
    h(UIThemeProvider, { options }, { default: () => h(Consumer) })
  );

  apps.push(app);
  app.mount(container);
  state.setTheme('dark');
  options.colorThemes = ['default', 'sea'];
  options.onThemeChange = second;
  await nextTick();
  state.setTheme('light');
  await state.switchColorTheme('sea', true);
  expect(first).toHaveBeenCalledExactlyOnceWith('dark');
  expect(second).toHaveBeenCalledExactlyOnceWith('light');
  expect(state.colorThemes).toEqual(['default', 'sea']);
  expect(container.textContent).toBe('sea');
});

test('a palette list without an explicit default renders the first configured palette on server and client', async () => {
  const Consumer = {
    setup() {
      const state = getUITheme();

      return () => h('span', state.colorTheme.value);
    },
  };

  const server = createSSRApp(Consumer).use(
    createUITheme({ colorThemes: ['sand'] })
  );

  expect(await renderToString(server)).toContain('sand');
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp(Consumer).use(createUITheme({ colorThemes: ['sand'] }));
  apps.push(app);
  app.mount(container);
  expect(container.textContent).toBe('sand');
  expect(document.documentElement.classList.contains('theme-sand')).toBe(true);
});

test('replacing provider options removes callbacks and storage from the previous options object', async () => {
  const changed = vi.fn();
  const storage = { getItem: () => null, setItem: vi.fn() };

  const options = shallowRef<UIThemeOptions>({
    storage,
    onThemeChange: changed,
  });

  let state!: ReturnType<typeof getUITheme>;

  const Consumer = {
    setup() {
      state = getUITheme();

      return () => h('span', state.theme.value);
    },
  };

  const container = document.createElement('div');
  document.body.append(container);

  const app = createApp(() =>
    h(
      UIThemeProvider,
      { options: options.value },
      { default: () => h(Consumer) }
    )
  );

  apps.push(app);
  app.mount(container);
  state.setTheme('dark');
  options.value = {};
  await nextTick();
  state.setTheme('light');
  expect(changed).toHaveBeenCalledExactlyOnceWith('dark');
  expect(storage.setItem).toHaveBeenCalledExactlyOnceWith('theme', 'dark');
  expect(localStorage.getItem('theme')).toBe('light');
});

test('custom storage errors propagate and failed destinations can retry', async () => {
  let state!: ReturnType<typeof getUITheme>;

  const Consumer = {
    setup() {
      state = getUITheme();

      return () => h('span', state.theme.value);
    },
  };

  const container = document.createElement('div');
  document.body.append(container);

  const write = vi.fn().mockImplementationOnce(() => {
    throw new Error('Write blocked');
  });

  const app = createApp(Consumer).use(
    createUITheme({
      defaultTheme: 'light',
      storage: {
        getItem: () => {
          throw new Error('Read blocked');
        },
        setItem: write,
      },
    })
  );

  apps.push(app);
  app.mount(container);
  await expect(state.switchTheme('dark', true)).rejects.toThrow(
    'Write blocked'
  );
  expect(container.textContent).toBe('light');
  await state.switchTheme('dark', true);
  await nextTick();
  expect(container.textContent).toBe('dark');
});

test('palette activity tracks Vue rendering without another state read', async () => {
  let state!: ReturnType<typeof getUITheme>;

  const Consumer = {
    setup() {
      state = getUITheme();

      return () =>
        h('button', { 'aria-pressed': state.isColorThemeActive('sea') }, 'Sea');
    },
  };

  const container = document.createElement('div');
  document.body.append(container);

  const app = createApp(Consumer).use(
    createUITheme({ colorThemes: ['default', 'sea'] })
  );

  apps.push(app);
  app.mount(container);
  expect(container.querySelector('button')?.getAttribute('aria-pressed')).toBe(
    'false'
  );
  state.setColorTheme('sea');
  await nextTick();
  expect(container.querySelector('button')?.getAttribute('aria-pressed')).toBe(
    'true'
  );
});

test('blocked native browser writes do not stop Vue state or cross-tab updates', async () => {
  let state!: ReturnType<typeof getUITheme>;
  const changed = vi.fn();

  const Consumer = {
    setup() {
      state = getUITheme();

      return () => h('span', state.theme.value);
    },
  };

  const container = document.createElement('div');
  document.body.append(container);

  const app = createApp(Consumer).use(
    createUITheme({ defaultTheme: 'light', onThemeChange: changed })
  );

  apps.push(app);
  app.mount(container);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Storage blocked');
  });
  await expect(state.switchTheme('dark', true)).resolves.toBeUndefined();
  await nextTick();
  expect(container.textContent).toBe('dark');
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: 'theme',
      newValue: 'light',
      storageArea: localStorage,
    })
  );
  await nextTick();
  expect(container.textContent).toBe('light');
  expect(changed).toHaveBeenCalledExactlyOnceWith('dark');
});

test('deleting a callback from reactive provider options stops later notifications', async () => {
  const changed = vi.fn();
  const options = reactive<UIThemeOptions>({ onThemeChange: changed });
  let state!: ReturnType<typeof getUITheme>;

  const Consumer = {
    setup() {
      state = getUITheme();

      return () => h('span', state.theme.value);
    },
  };

  const container = document.createElement('div');
  document.body.append(container);

  const app = createApp(() =>
    h(UIThemeProvider, { options }, { default: () => h(Consumer) })
  );

  apps.push(app);
  app.mount(container);
  state.setTheme('dark');
  delete options.onThemeChange;
  await nextTick();
  state.setTheme('light');
  expect(changed).toHaveBeenCalledExactlyOnceWith('dark');
});
