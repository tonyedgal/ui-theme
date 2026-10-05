import React from 'react';
import { test, expect } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  TanStackStartThemeScript,
  NextUIThemeProvider,
} from 'uitheme-web/react';

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
