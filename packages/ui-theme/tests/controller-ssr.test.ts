import { expect, test } from 'vitest';
import { createThemeController } from '../src/core/controller';

test('server controllers do not need a document and never share request state', async () => {
  const first = createThemeController({
    initialTheme: 'dark',
    initialColorTheme: 'ocean',
  });

  const second = createThemeController({ defaultTheme: 'light' });
  first.mount();
  await first.switchTheme('light', true);
  expect(first.getSnapshot()).toMatchObject({
    theme: 'light',
    colorTheme: 'ocean',
    mounted: false,
  });
  expect(second.getSnapshot()).toMatchObject({
    theme: 'light',
    colorTheme: 'default',
    mounted: false,
  });
  expect(first.getServerSnapshot().theme).toBe('dark');
  first.dispose();
  second.dispose();
});
