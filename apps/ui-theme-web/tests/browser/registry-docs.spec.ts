import { expect, test } from '@playwright/test';

test('registry links resolve to a pinned, complete local artifact', async ({
  request,
}) => {
  const manifestResponse = await request.get('/r/manifest.json');
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json();
  expect(manifest.schemaVersion).toBe(1);

  const indexResponse = await request.get(
    new URL(manifest.stable.index).pathname
  );

  expect(indexResponse.ok()).toBe(true);
  const index = await indexResponse.json();
  expect(index.items.length).toBeGreaterThan(0);

  for (const item of index.items) {
    expect(item.meta.uiTheme.revision).toBe(manifest.stable.revision);

    for (const dependency of item.registryDependencies ?? []) {
      expect(new URL(dependency).pathname).toContain(
        `/r/v1/${manifest.stable.revision}/`
      );
      expect((await request.get(new URL(dependency).pathname)).ok()).toBe(true);
    }
  }
});

test('base selection keeps the preview, installation command and copied source aligned', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/docs/components/base-ui/theme-toggle');
  await expect(
    page.getByRole('link', { name: 'Base UI', exact: true })
  ).toHaveAttribute('aria-current', 'page');
  await expect(page.getByTestId('install-command')).toContainText(
    '--base base-ui'
  );
  await expect(page.getByTestId('registry-source')).toContainText(
    '@base-ui/react'
  );
  await page.getByRole('link', { name: 'Radix UI', exact: true }).click();
  await expect(page.getByTestId('install-command')).toContainText(
    '--base radix'
  );
  await expect(page.getByTestId('registry-source')).toContainText(
    '@radix-ui/react-toggle'
  );

  const toggle = page
    .getByRole('region', { name: 'Default preview (Radix)', exact: true })
    .getByRole('button', {
      name: 'Toggle appearance',
      exact: true,
    });

  await expect(toggle).toBeEnabled();
  const previous = await toggle.getAttribute('aria-pressed');
  await toggle.click();
  await expect(toggle).toHaveAttribute(
    'aria-pressed',
    previous === 'true' ? 'false' : 'true'
  );
  await page.getByRole('combobox', { name: 'Tailwind version' }).click();
  await page.getByRole('option', { name: '3.4', exact: true }).click();
  await page.getByRole('combobox', { name: 'Source language' }).click();
  await page.getByRole('option', { name: 'JavaScript', exact: true }).click();
  await expect(page.getByTestId('install-command')).toContainText(
    '--tailwind 3 --language js'
  );
  await expect(page.getByTestId('registry-source')).not.toContainText(
    'export type'
  );
  expect(errors).toEqual([]);
});

test('Vue selects only Reka and migration explains the v1 boundary', async ({
  page,
}) => {
  await page.goto('/docs/components/base-ui/theme-toggle');
  await page.getByRole('link', { name: 'Vue / Reka', exact: true }).click();
  await expect(
    page.getByRole('link', { name: 'Vue / Reka', exact: true })
  ).toHaveAttribute('aria-current', 'page');
  await expect(page.getByTestId('install-command')).toContainText(
    '--base reka'
  );
  await expect(page.getByTestId('registry-source')).toContainText('reka-ui');
  await page.goto('/docs/migration');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Migrate'
  );
  await expect(page.locator('article')).toContainText('uitheme-vue@1');
});
