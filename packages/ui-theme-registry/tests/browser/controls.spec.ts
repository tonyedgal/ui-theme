import { expect, test } from '@playwright/test';

const queries = ['ui', 'next', 'vite', 'tanstack']
  .flatMap((provider) =>
    ['base-ui', 'radix'].map(
      (base) => `framework=react&base=${base}&provider=${provider}`
    )
  )
  .concat('framework=vue');

for (const query of queries) {
  test(`${query} shares preferences and supports keyboard controls`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/?${query}`);
    await expect(page.locator('#state')).toHaveText('light/default/400');

    const appearance = page.getByRole('combobox', {
      name: 'Appearance',
      exact: true,
    });

    await expect(appearance).toContainText('Light');
    await appearance.click();
    await page.getByRole('option', { name: 'Dark', exact: true }).click();
    await expect(page.locator('#state')).toHaveText('dark/default/400');
    await expect(page.locator('html')).toHaveClass(/dark/);

    const palette = page.getByRole('combobox', {
      name: 'Color theme',
      exact: true,
    });

    await palette.focus();
    await page.keyboard.press('Enter');
    await page.getByRole('option', { name: 'Ocean', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#state')).toHaveText('dark/ocean/400');
    await expect(page.locator('html')).toHaveClass(/theme-ocean/);

    const slider = page.getByRole('slider', {
      name: 'Transition duration',
      exact: true,
    });

    await expect(slider).toHaveAttribute('aria-valuenow', '400');
    await slider.focus();
    await page.keyboard.press('ArrowRight');
    await expect(slider).toHaveAttribute('aria-valuenow', '450');
    await expect(page.locator('#state')).toHaveText('dark/ocean/450');
    await page.reload();
    await expect(page.locator('#state')).toHaveText('dark/ocean/400');
    expect(errors).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath('controls.png') });
  });
}
