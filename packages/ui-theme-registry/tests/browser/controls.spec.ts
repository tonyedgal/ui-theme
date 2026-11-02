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
    await expect(page.locator('#state')).toHaveText('light/default');

    const appearance = page.getByRole('combobox', {
      name: 'Theme',
      exact: true,
    });

    await expect(appearance).toContainText('Light');
    await appearance.click();
    await page.getByRole('option', { name: 'Dark', exact: true }).click();
    await expect(page.locator('#state')).toHaveText('dark/default');
    await expect(page.locator('html')).toHaveClass(/dark/);

    const palette = page.getByRole('combobox', {
      name: 'Color theme',
      exact: true,
    });

    await palette.focus();
    await page.keyboard.press('Enter');
    await page.getByRole('option', { name: 'Ocean', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#state')).toHaveText('dark/ocean');
    await expect(page.locator('html')).toHaveClass(/theme-ocean/);

    const light = page.getByRole('radio', { name: 'Light theme', exact: true });
    await light.check();
    await light.focus();
    await page.keyboard.press('ArrowRight');
    await expect(
      page.getByRole('radio', { name: 'Dark theme', exact: true })
    ).toBeChecked();
    await expect(page.locator('#state')).toHaveText('dark/ocean');

    const themeDisclosure = page.getByRole('button', {
      name: 'Inline theme: Dark',
      exact: true,
    });

    await themeDisclosure.focus();
    await page.keyboard.press('Enter');

    const themeChoices = page.getByRole('group', {
      name: 'Inline theme',
      exact: true,
    });

    await themeChoices
      .getByRole('radio', { name: 'Light', exact: true })
      .check();
    await expect(page.locator('#state')).toHaveText('light/ocean');
    await themeChoices
      .getByRole('radio', { name: 'Dark', exact: true })
      .check();
    await expect(
      page.getByRole('button', { name: 'Inline theme: Dark', exact: true })
    ).toHaveAttribute('aria-expanded', 'true');
    await page
      .getByRole('button', { name: 'Inline theme: Dark', exact: true })
      .click();
    await expect(themeChoices).toBeHidden();

    await page
      .getByRole('button', { name: 'Inline color theme: Ocean', exact: true })
      .click();

    const colorChoices = page.getByRole('group', {
      name: 'Inline color theme',
      exact: true,
    });

    await colorChoices
      .getByRole('radio', { name: 'Default', exact: true })
      .check();
    await expect(page.locator('#state')).toHaveText('dark/default');
    await colorChoices
      .getByRole('radio', { name: 'Ocean', exact: true })
      .check();
    await expect(page.locator('#state')).toHaveText('dark/ocean');
    await page.reload();
    await expect(page.locator('#state')).toHaveText('dark/ocean');
    expect(errors).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath('controls.png') });
  });
}
