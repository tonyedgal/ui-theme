import { expect, test, type Page } from '@playwright/test';

// A click right after `load` can land before hydration and do nothing.
// Repeat it until the client navigation reaches the base page.
async function selectBase(page: Page, name: string, base: string) {
  await expect(async () => {
    await page.getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/docs/components/${base}/`), {
      timeout: 1_000,
    });
  }).toPass();
}

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

test('the site serves shadcn records only for supported styles', async ({
  request,
}) => {
  for (const style of ['new-york-v4', 'radix-nova', 'base-vega']) {
    const response = await request.get(`/r/${style}/theme-toggle.json`);
    expect(response.ok()).toBe(true);
    const record = await response.json();
    expect(record.dependencies).toContain('uitheme-web@^2.0.0');

    const index = await (await request.get(`/r/${style}/registry.json`)).json();
    expect(index.items.map((item: { name: string }) => item.name)).toContain(
      'theme-toggle'
    );
  }

  expect((await request.get('/r/aria-nova/theme-toggle.json')).status()).toBe(
    404
  );
});

test('base selection keeps the preview, installation command and copied source aligned', async ({
  page,
}) => {
  const errors: string[] = [];
  // webkit reports the resize observer loop notification as a page error
  page.on('pageerror', (error) => {
    if (!error.message.startsWith('ResizeObserver loop completed')) {
      errors.push(error.message);
    }
  });
  await page.goto('/docs/components/base-ui/theme-toggle');
  await expect(
    page.getByRole('link', { name: 'Base UI', exact: true })
  ).toHaveAttribute('aria-current', 'page');
  await expect(
    page.getByRole('navigation', { name: 'Component base' }).getByRole('link')
  ).toHaveText(['Base UI', 'Radix UI', 'UI SDK', 'Vue / Reka', 'Vue / UI SDK']);
  await expect(page.getByTestId('install-command')).toContainText(
    '--base base-ui'
  );
  await expect(page.getByTestId('shadcn-install-command')).toContainText(
    'npx shadcn@latest add @uitheme/theme-toggle'
  );
  await expect(page.getByTestId('registry-source')).toContainText(
    '@base-ui/react'
  );
  await selectBase(page, 'Radix UI', 'radix');
  await expect(page.getByTestId('install-command')).toContainText(
    '--base radix'
  );
  await expect(page.getByTestId('registry-source')).toContainText(
    "from 'radix-ui'"
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
  await selectBase(page, 'Vue / Reka', 'reka');
  await expect(
    page.getByRole('link', { name: 'Vue / Reka', exact: true })
  ).toHaveAttribute('aria-current', 'page');
  await expect(page.getByTestId('install-command')).toContainText(
    '--base reka'
  );
  await expect(page.getByTestId('shadcn-install-command')).toHaveCount(0);
  await expect(page.getByTestId('registry-source')).toContainText('reka-ui');
  await page.goto('/docs/migration');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Migrate'
  );
  await expect(page.locator('article')).toContainText('uitheme-vue@1');
});

const components = [
  'theme-toggle',
  'icon-theme-toggle',
  'tactile-theme-toggle',
  'theme-switcher',
  'theme-selector',
  'color-theme-selector',
  'theme-disclosure',
  'color-theme-disclosure',
];

test('UI SDK React pages render every control with a CLI command and no shadcn path', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  for (const component of components) {
    await page.goto(`/docs/components/ui-sdk-react/${component}`);
    await expect(
      page.getByRole('link', { name: 'UI SDK', exact: true })
    ).toHaveAttribute('aria-current', 'page');
    await expect(page.getByTestId('install-command')).toContainText(
      `add ${component} --base ui-sdk`
    );
    await expect(page.getByTestId('shadcn-install-command')).toHaveCount(0);
    await expect(page.getByTestId('registry-source')).toContainText(
      '@ui-sdk/react'
    );
    await expect(
      page.getByRole('region', { name: /^Default preview \(UI SDK\)$/ })
    ).toBeVisible();
    await expect(page.locator('article')).toContainText('@layer ui-sdk;');
  }

  expect(errors).toEqual([]);
});

test('UI SDK pages keep the Tailwind and language choices across bases', async ({
  page,
}) => {
  await page.goto(
    '/docs/components/ui-sdk-react/theme-toggle?tailwind=3&language=js'
  );
  await selectBase(page, 'Vue / UI SDK', 'ui-sdk-vue');
  await expect(page).toHaveURL(/tailwind=3&language=js/);
  await expect(page.getByTestId('install-command')).toContainText(
    '--base ui-sdk --tailwind 3 --language js'
  );
  await expect(page.getByTestId('shadcn-install-command')).toHaveCount(0);
  await expect(page.getByTestId('registry-source')).toContainText(
    '@ui-sdk/vue'
  );
});

test('UI SDK React controls respond to the pointer and the keyboard', async ({
  page,
}) => {
  await page.goto('/docs/components/ui-sdk-react/tactile-theme-toggle');

  const toggle = page
    .getByRole('region', { name: /^Default preview \(UI SDK\)$/ })
    .getByRole('switch');

  await expect(toggle).toBeEnabled();

  for (const press of [
    () => toggle.click(),
    () => page.keyboard.press('Space'),
    () => page.keyboard.press('Enter'),
  ]) {
    const before = await toggle.getAttribute('aria-checked');
    await press();
    await expect(toggle).not.toHaveAttribute('aria-checked', before ?? '');
  }

  await page.goto('/docs/components/ui-sdk-react/color-theme-selector');

  const preview = page.getByRole('region', {
    name: /^Default preview \(UI SDK\)$/,
  });

  const trigger = preview.getByRole('combobox');
  await trigger.click();

  const box = await trigger.boundingBox();
  const list = await page.getByRole('listbox').boundingBox();
  expect(Math.abs((list?.x ?? 0) - (box?.x ?? 99))).toBeLessThan(2);
  expect((list?.y ?? 0) - ((box?.y ?? 0) + (box?.height ?? 0))).toBeLessThan(
    16
  );
  await page.getByRole('option', { name: 'Caffeine' }).click();
  await expect(page.locator('html')).toHaveClass(/theme-caffeine/);
});

const vueSets = [
  { base: 'reka', label: 'Reka' },
  { base: 'ui-sdk-vue', label: 'UI SDK' },
];

function vueFrame(page: Page, label: string) {
  return page.frameLocator(`iframe[title^="Default preview (${label})"]`);
}

test('Vue pages render every control in a same-origin iframe', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  for (const { base, label } of vueSets) {
    for (const component of components) {
      await page.goto(`/docs/components/${base}/${component}`);

      const preview = vueFrame(page, label).getByRole('region', {
        name: `Default preview (${label})`,
      });

      await expect(preview).toBeVisible();

      await expect(
        preview
          .locator(
            'button, [role="switch"], [role="radiogroup"], [role="combobox"]'
          )
          .first()
      ).toBeVisible();
    }
  }

  expect(errors).toEqual([]);
});

test('a Vue control changes the site theme and the header changes the iframe', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/docs/components/reka/theme-toggle');

  const frame = vueFrame(page, 'Reka');
  const html = page.locator('html');
  const inner = frame.locator('html');
  await expect(inner).not.toHaveClass(/dark/);

  await frame.getByRole('button', { name: /Toggle theme/ }).click();
  await expect(html).toHaveClass(/dark/);
  await expect(inner).toHaveClass(/dark/);

  await page.getByRole('radio', { name: 'Light theme' }).click();
  await expect(inner).not.toHaveClass(/dark/);
  await expect(html).not.toHaveClass(/dark/);
});

test('a Vue color theme selector changes the site palette', async ({
  page,
}) => {
  await page.goto('/docs/components/ui-sdk-vue/color-theme-selector');

  const frame = vueFrame(page, 'UI SDK');
  await frame.getByRole('combobox').click();
  await frame.getByRole('option', { name: 'Caffeine' }).click();
  await expect(page.locator('html')).toHaveClass(/theme-caffeine/);
  await expect(frame.locator('html')).toHaveClass(/theme-caffeine/);
});

test('a Vue select popup stays inside its iframe', async ({ page }) => {
  for (const { base, label, component } of [
    { base: 'ui-sdk-vue', label: 'UI SDK', component: 'color-theme-selector' },
    { base: 'reka', label: 'Reka', component: 'theme-selector' },
  ]) {
    await page.goto(`/docs/components/${base}/${component}`);

    const frame = vueFrame(page, label);
    await frame.getByRole('combobox').click();

    const list = await frame.getByRole('listbox').boundingBox();

    const outer = await page
      .locator(`iframe[title^="Default preview (${label})"]`)
      .boundingBox();

    expect(list).not.toBeNull();
    expect(outer).not.toBeNull();
    expect(list!.y).toBeGreaterThanOrEqual(outer!.y);
    expect(list!.y + list!.height).toBeLessThanOrEqual(
      outer!.y + outer!.height
    );
    expect(list!.x + list!.width).toBeLessThanOrEqual(outer!.x + outer!.width);
  }
});

test('a Vue tactile toggle responds to the pointer and the keyboard', async ({
  page,
}) => {
  await page.goto('/docs/components/ui-sdk-vue/tactile-theme-toggle');

  const toggle = vueFrame(page, 'UI SDK').getByRole('switch');
  await expect(toggle).toBeEnabled();

  for (const press of [
    () => toggle.click(),
    () => page.keyboard.press('Space'),
    () => page.keyboard.press('Enter'),
  ]) {
    const before = await toggle.getAttribute('aria-checked');
    await press();
    await expect(toggle).not.toHaveAttribute('aria-checked', before ?? '');
  }
});

test('the Vue iframe has the site theme before its script runs', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('color-theme', 'caffeine');
  });
  await page.route('**/vue-preview/assets/*.js', (route) => route.abort());
  await page.goto('/docs/components/reka/theme-toggle');

  const iframe = page.locator('iframe[title^="Default preview (Reka)"]');
  await expect(iframe).toHaveAttribute('src', /vue-preview/);
  const handle = await iframe.elementHandle();

  const frame = await handle!.contentFrame();
  await frame!.waitForLoadState('domcontentloaded');
  await expect(frame!.locator('html')).toHaveClass(/dark/);
  await expect(frame!.locator('html')).toHaveClass(/theme-caffeine/);
});
