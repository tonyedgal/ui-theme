import { expect, test } from '@playwright/test';
import { basesFor } from '../../../ui-theme-cli/src/bases.ts';

const reactBases = basesFor('react');

const queries = ['ui', 'next', 'vite', 'tanstack']
  .flatMap((provider) =>
    reactBases.map(
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
    const ocean = page.getByRole('option', { name: 'Ocean', exact: true });

    // ui-sdk keeps focus on the list and highlights with the arrow keys.
    if (query.includes('base=ui-sdk')) {
      await expect(ocean).toBeVisible();
      await page.keyboard.press('ArrowDown');
    } else await ocean.focus();
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

    // ui-sdk names a radio group; the other bases name a fieldset.
    const choiceRole = query.includes('base=ui-sdk') ? 'radiogroup' : 'group';

    const themeChoices = page.getByRole(choiceRole, {
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

    const colorChoices = page.getByRole(choiceRole, {
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

for (const base of reactBases) {
  test(`${base} tactile toggle switches with Space and Enter`, async ({
    page,
  }) => {
    await page.goto(`/?framework=react&base=${base}`);

    const tactile = page.getByRole('switch', {
      name: 'Dark theme',
      exact: true,
    });

    await expect(tactile).toBeEnabled();
    await expect(tactile).toHaveAttribute('aria-checked', 'false');
    await tactile.focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#state')).toHaveText('dark/default');
    await expect(tactile).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.press('Enter');
    await expect(page.locator('#state')).toHaveText('light/default');
    await expect(tactile).toHaveAttribute('aria-checked', 'false');
    await expect(tactile).toBeFocused();
    await tactile.click();
    await expect(page.locator('#state')).toHaveText('dark/default');
  });

  test(`${base} select popup opens below its trigger inside the viewport`, async ({
    page,
  }) => {
    await page.goto(`/?framework=react&base=${base}`);

    const trigger = page.getByRole('combobox', { name: 'Theme', exact: true });

    await expect(trigger).toBeEnabled();

    const anchor = (await trigger.boundingBox())!;

    await trigger.click();

    const listbox = page.getByRole('listbox');

    await expect(listbox).toBeVisible();

    const popup = (await listbox.boundingBox())!;
    const viewport = page.viewportSize()!;

    expect(popup.x).toBeGreaterThanOrEqual(0);
    expect(popup.y + popup.height).toBeLessThanOrEqual(viewport.height);
    expect(Math.abs(popup.x - anchor.x)).toBeLessThanOrEqual(1);
    expect(popup.y - (anchor.y + anchor.height)).toBeGreaterThanOrEqual(4);
    expect(popup.y - (anchor.y + anchor.height)).toBeLessThanOrEqual(8);

    await page.keyboard.press('Escape');
    await expect(listbox).toBeHidden();
    await expect(
      page.getByRole('combobox', { name: 'Theme', exact: true })
    ).toBeFocused();
  });
}
