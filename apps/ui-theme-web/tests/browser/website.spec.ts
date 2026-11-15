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

for (const [name, size] of [
  ['desktop', { width: 1280, height: 800 }],
  ['mobile', { width: 390, height: 800 }],
] as const) {
  // The component pages load their own stylesheet. It must not push the
  // palette popup under the mobile menu or hide it.
  test(`the ${name} palette selector opens above the page and changes the palette`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await page.goto('/docs/components/base-ui/color-theme-selector');
    const html = page.locator('html');
    const before = await html.getAttribute('class');

    if (name === 'mobile') {
      await expect(async () => {
        await page
          .getByRole('button', { name: 'Toggle menu', exact: true })
          .click();
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 1_000 });
      }).toPass();
    }

    const scope =
      name === 'mobile' ? page.getByRole('dialog') : page.locator('header');

    const trigger = scope.getByRole('combobox', { name: 'Site color theme' });
    await expect(async () => {
      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true', {
        timeout: 1_000,
      });
    }).toPass();

    const option = page.getByRole('option', { name: 'Mono', exact: true });
    await expect(option).toBeVisible();
    // Playwright fails this click when another element covers the option.
    await option.click();
    await expect(html).toHaveClass(/\btheme-mono\b/);
    expect(before).not.toMatch(/\btheme-mono\b/);
  });
}
