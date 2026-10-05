import { expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextUIThemeProvider } from '../src/react/components/NextUIThemeProvider';
import { TanStackStartThemeScript } from '../src/react/components/TanStackUIThemeProvider';
import { notifyServerChange } from '../src/react/components/server-notifications';

const storageKey =
  'quote\'\\"</script><script>globalThis.escaped=true</script>&\u2028\u2029';

for (const provider of ['next', 'tanstack']) {
  test(`${provider} serializes bootstrap values for JavaScript and HTML`, () => {
    const html = renderToStaticMarkup(
      provider === 'next' ? (
        <NextUIThemeProvider storageKey={storageKey} defaultTheme="dark">
          <div />
        </NextUIThemeProvider>
      ) : (
        <TanStackStartThemeScript storageKey={storageKey} defaultTheme="dark" />
      )
    );

    expect(html.match(/<script/g)).toHaveLength(1);
    const code = html.match(/<script[^>]*>([\s\S]*?)<\/script>/)?.[1];
    expect(code).toBeTruthy();
    expect(code).not.toContain('</script>');
    expect(code).not.toContain('\u2028');
    const getItem = vi.fn(() => null);
    const classList = { add: vi.fn(), remove: vi.fn() };
    const root = { classList, style: {} };
    new Function('localStorage', 'document', 'window', code ?? '')(
      { getItem },
      { documentElement: root },
      { matchMedia: () => ({ matches: false }) }
    );
    expect(getItem).toHaveBeenCalledWith(storageKey);
    expect(classList.add).toHaveBeenCalledWith('dark');
  });
}

test('rejected server notifications are observed without rejecting state updates', async () => {
  const error = new Error('Cookie write failed');
  const report = vi.fn();
  await expect(
    notifyServerChange(
      async () => {
        throw error;
      },
      'dark',
      report
    )
  ).resolves.toBeUndefined();
  expect(report).toHaveBeenCalledTimes(1);
  expect(report).toHaveBeenCalledWith(error);
});
