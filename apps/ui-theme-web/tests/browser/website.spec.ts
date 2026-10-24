import { expect, test } from '@playwright/test';

test('home and documentation load without client errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const home = await page.goto('/');
  expect(home?.ok()).toBe(true);
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  const docs = await page.goto('/docs');
  expect(docs?.ok()).toBe(true);
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  await page
    .getByRole('link', { name: 'UI-Theme', exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/$/);
  expect(errors).toEqual([]);
});

test('the theme control changes appearance and persists after reload', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const html = page.locator('html');
  await expect(html).not.toHaveClass(/\bdark\b/);
  await page
    .getByRole('button', { name: 'Toggle Theme', exact: true })
    .filter({ visible: true })
    .first()
    .click();
  await expect(html).toHaveClass(/\bdark\b/);
  await page.reload();
  await expect(html).toHaveClass(/\bdark\b/);
});
