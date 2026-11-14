import React from 'react';
import { test, expect } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  TanStackStartThemeScript,
  NextUIThemeProvider,
} from 'uitheme-web/react';
import { getThemeScript } from '../../src/server';

const inlineScript = (element: React.ReactElement) =>
  renderToStaticMarkup(element).match(/<script[^>]*>([\s\S]*?)<\/script>/)![1];

const bootstraps = {
  next: () =>
    inlineScript(
      React.createElement(
        NextUIThemeProvider,
        { colorThemes: ['default', 'ocean'] },
        null
      )
    ),
  'next-data-theme': () =>
    inlineScript(
      React.createElement(
        NextUIThemeProvider,
        { attribute: 'data-theme', colorThemes: ['default', 'ocean'] },
        null
      )
    ),
  tanstack: () =>
    inlineScript(
      React.createElement(TanStackStartThemeScript, {
        colorThemes: ['default', 'ocean'],
      })
    ),
  'tanstack-css': () =>
    inlineScript(
      React.createElement(TanStackStartThemeScript, {
        colorThemes: ['default', 'ocean'],
        systemThemeMode: 'css',
      })
    ),
  server: () => getThemeScript({ colorThemes: ['default', 'ocean'] }),
};

async function runBootstrap(
  page: import('@playwright/test').Page,
  code: string,
  stored: Record<string, string>
) {
  await page.goto('/bootstrap.html');

  return page.evaluate(
    ([source, values]) => {
      localStorage.clear();

      for (const [key, value] of Object.entries(values))
        localStorage.setItem(key, value);
      const root = document.documentElement;
      root.removeAttribute('class');
      root.removeAttribute('style');
      root.removeAttribute('data-theme');
      new Function(source)();

      return {
        class: root.getAttribute('class'),
        style: root.getAttribute('style'),
        dataTheme: root.getAttribute('data-theme'),
      };
    },
    [code, stored] as const
  );
}

// Each provider keeps the DOM it wrote before the scripts were shared.
const validDom = {
  next: {
    class: 'dark theme-ocean',
    style: 'color-scheme: dark;',
    dataTheme: null,
  },
  'next-data-theme': {
    class: 'theme-ocean',
    style: 'color-scheme: dark;',
    dataTheme: 'dark',
  },
  tanstack: {
    class: 'dark theme-ocean',
    style: 'color-scheme: dark;',
    dataTheme: null,
  },
  'tanstack-css': {
    class: 'dark theme-ocean',
    style: 'color-scheme: dark;',
    dataTheme: null,
  },
  server: {
    class: 'dark theme-ocean',
    style: 'color-scheme: dark;',
    dataTheme: null,
  },
};

const defaultDom = {
  next: {
    class: 'theme-default',
    style: 'color-scheme: light;',
    dataTheme: null,
  },
  'next-data-theme': {
    class: 'theme-default',
    style: 'color-scheme: light;',
    dataTheme: 'light',
  },
  tanstack: { class: null, style: 'color-scheme: light;', dataTheme: null },
  'tanstack-css': { class: 'system', style: null, dataTheme: null },
  server: {
    class: 'theme-default',
    style: 'color-scheme: light;',
    dataTheme: null,
  },
};

for (const [name, build] of Object.entries(bootstraps)) {
  test(`${name} bootstrap keeps valid stored values and drops stale ones`, async ({
    page,
  }) => {
    // SAFETY: name comes from Object.entries(bootstraps).
    const key = name as keyof typeof bootstraps;
    expect(
      await runBootstrap(page, build(), {
        theme: 'dark',
        'color-theme': 'ocean',
      })
    ).toEqual(validDom[key]);
    expect(
      await runBootstrap(page, build(), {
        theme: 'sepia',
        'color-theme': 'removed-palette',
      })
    ).toEqual(defaultDom[key]);
  });
}

for (const provider of ['next', 'tanstack']) {
  test(`${provider} bootstrap stays within one HTML script and executes escaped keys`, async ({
    page,
  }) => {
    const storageKey =
      'quote\'\\"</script><script>globalThis.escaped=true</script>&\u2028\u2029';

    const nextProps = {
      storageKey,
      defaultTheme: 'dark',
      children: null,
    } satisfies import('uitheme-web/react').NextUIThemeProviderProps;

    const html = renderToStaticMarkup(
      provider === 'next'
        ? React.createElement(NextUIThemeProvider, nextProps)
        : React.createElement(TanStackStartThemeScript, {
            storageKey,
            defaultTheme: 'dark',
          })
    );

    await page.goto('/bootstrap.html');
    await page.evaluate((key) => localStorage.setItem(key, 'dark'), storageKey);
    await page.setContent(
      `<html><head>${html}</head><body><p>Bootstrap test</p></body></html>`
    );
    await expect(page.locator('script')).toHaveCount(1);
    await expect(page.locator('html')).toHaveClass(/dark/);
    expect(await page.evaluate(() => Reflect.has(globalThis, 'escaped'))).toBe(
      false
    );
  });
}
