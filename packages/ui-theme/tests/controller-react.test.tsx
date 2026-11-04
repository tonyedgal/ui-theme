// @vitest-environment jsdom
import { StrictMode, act, useLayoutEffect } from 'react';
import { createRoot, hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useTheme } from '../src/react/hooks/use-theme';
import {
  UIThemeProvider,
  useUITheme,
} from '../src/react/components/UIThemeProvider';
import type { UseThemeProps, UseThemeReturn } from '../src/react/types';
import { NextUIThemeProvider } from '../src/react/components/NextUIThemeProvider';
import { ViteUIThemeProvider } from '../src/react/components/ViteUIThemeProvider';
import { TanStackUIThemeProvider } from '../src/react/components/TanStackUIThemeProvider';

let root: Root;

let container: HTMLDivElement;

let state: UseThemeReturn;

let mediaListeners: Set<() => void>;

const Host = ({ options = {} }: { options?: UseThemeProps }) => {
  const current = useTheme(options);

  useLayoutEffect(() => {
    state = current;
  });

  return (
    <button>
      {current.theme}:{current.colorTheme}
    </button>
  );
};

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  mediaListeners = new Set();
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: (_event: string, listener: () => void) =>
      mediaListeners.add(listener),
    removeEventListener: (_event: string, listener: () => void) =>
      mediaListeners.delete(listener),
  }));
  localStorage.clear();
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

test('a provider shares one controller across consumers and follows cross-tab preferences', async () => {
  const Consumer = ({ id }: { id: string }) => {
    const shared = useUITheme();

    return (
      <button id={id} onClick={() => shared.setTheme('dark')}>
        {shared.theme}
      </button>
    );
  };

  await act(async () =>
    root.render(
      <UIThemeProvider defaultTheme="light">
        <Consumer id="first" />
        <Consumer id="second" />
      </UIThemeProvider>
    )
  );
  expect(mediaListeners.size).toBe(1);
  await act(async () => {
    container.querySelector<HTMLButtonElement>('#first')?.click();
  });
  expect(container.querySelector('#second')?.textContent).toBe('dark');
  await act(async () => {
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'theme',
        newValue: 'light',
        storageArea: localStorage,
      })
    );
  });
  expect(container.querySelector('#first')?.textContent).toBe('light');
  expect(container.querySelector('#second')?.textContent).toBe('light');
});

test('controlled hooks wait for owner updates and use new callbacks and palettes after rerender', async () => {
  const first = vi.fn();
  const second = vi.fn();
  await act(async () =>
    root.render(
      <Host
        options={{
          theme: 'light',
          onThemeChange: first,
          colorThemes: ['default'],
        }}
      />
    )
  );
  await act(async () => state.switchTheme('dark', true));
  expect(first).toHaveBeenCalledExactlyOnceWith('dark');
  expect(container.textContent).toBe('light:default');
  await act(async () =>
    root.render(
      <Host
        options={{
          theme: 'dark',
          onThemeChange: second,
          colorThemes: ['default', 'ocean'],
        }}
      />
    )
  );
  await act(async () => state.switchTheme('light', true));
  await act(async () => state.switchColorTheme('ocean', true));
  expect(second).toHaveBeenCalledExactlyOnceWith('light');
  expect(container.textContent).toBe('dark:ocean');
});

test('strict effect remounts leave one system listener and remove it on unmount', async () => {
  await act(async () =>
    root.render(
      <StrictMode>
        <Host />
      </StrictMode>
    )
  );
  expect(mediaListeners.size).toBe(1);
  await act(async () => root.unmount());
  expect(mediaListeners.size).toBe(0);
  root = createRoot(container);
});

test('hydration starts from server defaults then reads stored preferences without a mismatch', async () => {
  await act(async () => root.unmount());
  container.innerHTML = renderToString(
    <Host options={{ defaultTheme: 'light' }} />
  );
  localStorage.setItem('theme', 'dark');
  const recover = vi.fn();
  await act(async () => {
    root = hydrateRoot(
      container,
      <Host options={{ defaultTheme: 'light' }} />,
      { onRecoverableError: recover }
    );
  });
  expect(recover).not.toHaveBeenCalled();
  expect(container.textContent).toBe('dark:default');
});

for (const Provider of [
  UIThemeProvider,
  NextUIThemeProvider,
  ViteUIThemeProvider,
  TanStackUIThemeProvider,
]) {
  test(`${Provider.name} uses the first configured palette for server and client defaults`, async () => {
    const Control = () => {
      const current = useUITheme();

      return <span>{current.colorTheme}</span>;
    };

    expect(
      renderToString(
        <Provider colorThemes={['sand']}>
          <Control />
        </Provider>
      )
    ).toContain('sand');
    await act(async () =>
      root.render(
        <Provider colorThemes={['sand']}>
          <Control />
        </Provider>
      )
    );
    expect(container.querySelector('span')?.textContent).toBe('sand');
  });

  test(`${Provider.name} exposes shared state to copied controls`, async () => {
    const Control = () => {
      const current = useUITheme();

      return (
        <button onClick={() => current.setColorTheme('ocean')}>
          {current.colorTheme}
        </button>
      );
    };

    await act(async () =>
      root.render(
        <Provider colorThemes={['default', 'ocean']}>
          <Control />
        </Provider>
      )
    );
    await act(async () => container.querySelector('button')?.click());
    expect(container.querySelector('button')?.textContent).toBe('ocean');
    expect(document.documentElement.classList.contains('theme-ocean')).toBe(
      true
    );
  });
}
