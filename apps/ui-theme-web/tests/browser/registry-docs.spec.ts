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
  page.on('pageerror', (error) => errors.push(error.message));
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

test('a Vue control changes only the iframe and the header still updates it', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/docs/components/reka/theme-toggle');

  const frame = vueFrame(page, 'Reka');
  const html = page.locator('html');
  const inner = frame.locator('html');
  await expect(inner).not.toHaveClass(/dark/);
  const stored = await page.evaluate(() => JSON.stringify(localStorage));

  await frame.getByRole('button', { name: /Toggle theme/ }).click();
  await expect(inner).toHaveClass(/dark/);
  await expect(html).not.toHaveClass(/dark/);
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(stored);

  await page.getByRole('radio', { name: 'Dark theme' }).click();
  await expect(html).toHaveClass(/dark/);
  await page.getByRole('radio', { name: 'Light theme' }).click();
  await expect(html).not.toHaveClass(/dark/);
  await expect(inner).not.toHaveClass(/dark/);
});

test('a Vue iframe applies a header theme change made during its own transition', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/docs/components/reka/theme-toggle');

  const frame = vueFrame(page, 'Reka');
  const inner = frame.locator('html');
  await expect(
    frame.getByRole('button', { name: /Toggle theme/ })
  ).toBeVisible();
  await expect(inner).not.toHaveClass(/dark/);

  // hold the frame's theme update back so the header changes arrive first
  await inner.evaluate(() => {
    const start = document.startViewTransition.bind(document);

    document.startViewTransition = (update) =>
      start(async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        if (update instanceof Function) await update();
      });
  });

  await frame.getByRole('button', { name: /Toggle theme/ }).click();
  await expect(inner).toHaveAttribute('data-ui-theme-transition', '');
  await page.getByRole('radio', { name: 'Dark theme' }).click();
  await page.getByRole('radio', { name: 'Light theme' }).click();

  await expect(inner).not.toHaveAttribute('data-ui-theme-transition', '');
  await expect(inner).not.toHaveClass(/dark/);
});

test('a Vue color theme selector changes only the iframe palette and the site palette still updates it', async ({
  page,
}) => {
  await page.goto('/docs/components/ui-sdk-vue/color-theme-selector');

  const frame = vueFrame(page, 'UI SDK');
  await frame.getByRole('combobox').click();
  await frame.getByRole('option', { name: 'Caffeine' }).click();
  await expect(frame.locator('html')).toHaveClass(/theme-caffeine/);
  await expect(page.locator('html')).not.toHaveClass(/theme-caffeine/);
  await expect(frame.locator('html')).not.toHaveAttribute(
    'data-ui-theme-transition',
    ''
  );

  await page.getByRole('combobox', { name: 'Site color theme' }).click();
  await page.getByRole('option', { name: 'Supabase' }).click();
  await expect(page.locator('html')).toHaveClass(/theme-supabase/);
  await expect(frame.locator('html')).toHaveClass(/theme-supabase/);
  await expect(frame.locator('html')).not.toHaveClass(/theme-caffeine/);
});

test('the Vue iframe paints the Preview frame surface when themes match', async ({
  page,
}) => {
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/docs/components/reka/theme-toggle');

    const frame = vueFrame(page, 'Reka');
    await expect(frame.getByRole('button').first()).toBeVisible();

    // the site and the iframe bundle compile the colour differently, so
    // compare the painted pixels
    const colors = await page.evaluate(() => {
      const iframe = document.querySelector('iframe')!;
      const doc = iframe.contentDocument!;
      const context = document.createElement('canvas').getContext('2d')!;

      const pixel = (value: string) => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = value;
        context.fillRect(0, 0, 1, 1);

        return [...context.getImageData(0, 0, 1, 1).data];
      };

      return {
        frame: pixel(getComputedStyle(iframe).backgroundColor),
        page: pixel(getComputedStyle(document.body).backgroundColor),
        inner: pixel(getComputedStyle(doc.body).backgroundColor),
      };
    });

    expect(colors.frame).toEqual(colors.page);
    expect(colors.inner).toEqual(colors.page);
    expect(colors.inner[3]).toBe(255);
  }
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

function swatchColor(frame: ReturnType<Page['frameLocator']>, name: string) {
  return frame
    .locator(`[data-testid="theme-swatches"] [data-swatch="${name}"]`)
    .evaluate((node) => getComputedStyle(node).backgroundColor);
}

test('Vue previews draw a decorative swatch strip that follows the preview theme', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });

  for (const [base, label, component] of [
    ['reka', 'Reka', 'theme-toggle'],
    ['ui-sdk-vue', 'UI SDK', 'color-theme-selector'],
  ]) {
    await page.goto(`/docs/components/${base}/${component}`);

    const frame = vueFrame(page, label);
    const strip = frame.getByTestId('theme-swatches');
    await expect(strip).toHaveAttribute('aria-hidden', 'true');
    await expect(strip.locator('[data-swatch]')).toHaveCount(7);
    await expect(strip.locator('button, a, [tabindex]')).toHaveCount(0);
  }

  await page.goto('/docs/components/ui-sdk-vue/color-theme-selector');

  const frame = vueFrame(page, 'UI SDK');
  const primary = await swatchColor(frame, 'primary');
  await frame.getByRole('combobox').click();
  await frame.getByRole('option', { name: 'Caffeine' }).click();
  await expect(frame.locator('html')).toHaveClass(/theme-caffeine/);
  await expect.poll(() => swatchColor(frame, 'primary')).not.toBe(primary);

  await page.goto('/docs/components/reka/theme-toggle');

  const toggleFrame = vueFrame(page, 'Reka');
  const background = await swatchColor(toggleFrame, 'background');
  await toggleFrame.getByRole('button', { name: /Toggle theme/ }).click();
  await expect(toggleFrame.locator('html')).toHaveClass(/dark/);
  await expect
    .poll(() => swatchColor(toggleFrame, 'background'))
    .not.toBe(background);
});

test('the Vue swatch strip stays clear of an open popup and an upward panel', async ({
  page,
}) => {
  const overlaps = (frame: ReturnType<Page['frameLocator']>) =>
    frame.locator('html').evaluate((html) => {
      const strip = html
        .querySelector('[data-testid="theme-swatches"]')!
        .getBoundingClientRect();

      return [
        ...html.querySelectorAll(
          '[role="region"] button, [role="region"] [role="radio"], [role="listbox"], [data-state="open"]'
        ),
      ].flatMap((node) => {
        const box = node.getBoundingClientRect();

        return box.width > 0 &&
          box.height > 0 &&
          box.left < strip.right &&
          box.right > strip.left &&
          box.top < strip.bottom &&
          box.bottom > strip.top
          ? [box]
          : [];
      }).length;
    });

  await page.goto('/docs/components/ui-sdk-vue/color-theme-selector');

  const selector = vueFrame(page, 'UI SDK');
  await selector.getByRole('combobox').click();
  await expect(selector.getByRole('listbox')).toBeVisible();
  expect(await overlaps(selector)).toBe(0);

  await page.goto('/docs/components/ui-sdk-vue/theme-disclosure');

  const upward = page.frameLocator('iframe[title^="Opens upward (UI SDK)"]');

  await page
    .locator('iframe[title^="Opens upward (UI SDK)"]')
    .scrollIntoViewIfNeeded();
  await upward.getByRole('region').getByRole('button').first().click();
  await expect(upward.getByRole('radio').first()).toBeVisible();
  expect(await overlaps(upward)).toBe(0);
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

test('Vue pages explain the iframe preview and React pages do not', async ({
  page,
}) => {
  const note =
    'This preview runs in an iframe. The theme transition stays in the preview frame. In your app, the transition covers the full page.';

  for (const base of ['reka', 'ui-sdk-vue']) {
    await page.goto(`/docs/components/${base}/theme-toggle`);
    await expect(page.getByText(note).first()).toBeVisible();
  }

  for (const base of ['base-ui', 'ui-sdk-react']) {
    await page.goto(`/docs/components/${base}/theme-toggle`);
    await expect(page.getByRole('region').first()).toBeVisible();
    await expect(page.getByText(note)).toHaveCount(0);
  }
});
