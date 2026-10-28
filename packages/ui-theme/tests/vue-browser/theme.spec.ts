import { expect, test, type Page } from '@playwright/test';

async function selectTheme(page: Page, label: string, value: string) {
  await page.getByRole('combobox', { name: label, exact: true }).click();
  await page
    .getByRole('option', {
      name: value[0]!.toUpperCase() + value.slice(1),
      exact: true,
    })
    .click();
}

for (const [framework, url] of [
  ['Vue', 'http://127.0.0.1:4280'],
  ['Nuxt', 'http://127.0.0.1:4281'],
] as const) {
  test.describe(framework, () => {
    test('shares state, persists palettes, and follows system appearance', async ({
      page,
    }, testInfo) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.text().toLowerCase().includes('hydration'))
          errors.push(message.text());
      });
      await page.emulateMedia({ colorScheme: 'light' });
      await page.goto(url);
      await expect(
        page.getByRole('button', { name: 'Preview transition', exact: true })
      ).toBeEnabled();
      await selectTheme(page, 'Appearance', 'dark');
      await expect(page.locator('html')).toHaveClass(/dark/);

      const initialPrimary = await page
        .locator('html')
        .evaluate((root) =>
          getComputedStyle(root).getPropertyValue('--primary')
        );

      await page.getByRole('button', { name: 'Caffeine', exact: true }).click();
      await expect
        .poll(() =>
          page
            .locator('html')
            .evaluate((root) =>
              getComputedStyle(root).getPropertyValue('--primary')
            )
        )
        .not.toBe(initialPrimary);
      await expect(page.locator('html')).toHaveClass(/theme-caffeine/);
      await expect(page.getByLabel('Color theme', { exact: true })).toHaveText(
        'Caffeine'
      );
      await expect(
        page.getByRole('button', { name: 'Caffeine', exact: true })
      ).toHaveAttribute('aria-pressed', 'true');
      await page.reload();
      await expect(page.locator('html')).toHaveClass(/dark/);
      await expect(page.getByLabel('Color theme', { exact: true })).toHaveText(
        'Caffeine'
      );
      await selectTheme(page, 'Appearance', 'system');
      await expect(page.locator('html')).not.toHaveClass(/dark/);
      await page.emulateMedia({ colorScheme: 'dark' });
      await expect(page.locator('html')).toHaveClass(/dark/);
      await expect(page.locator('html')).not.toHaveAttribute(
        'data-ui-theme-transition'
      );
      await page.screenshot({
        path: testInfo.outputPath(`${framework.toLowerCase()}-dark.png`),
        fullPage: true,
      });
      expect(errors).toEqual([]);
      await expect(page.locator('main')).toHaveCSS('display', 'grid');

      const titleSize = await page
        .getByRole('heading', { level: 1 })
        .evaluate((title) =>
          Number.parseFloat(getComputedStyle(title).fontSize)
        );

      expect(titleSize).toBeGreaterThanOrEqual(48);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true);
    });

    test('animates all effects in both directions and cleans interrupted transitions', async ({
      page,
    }, testInfo) => {
      test.setTimeout(90_000);
      await page.goto(url);
      await selectTheme(page, 'Appearance', 'light');

      const preview = page.getByRole('button', {
        name: 'Preview transition',
        exact: true,
      });

      for (const effect of [
        'circle',
        'blur-circle',
        'slide',
        'clip-path',
        'polygon-gradient',
        'triangle',
        'svg-logo',
      ]) {
        await page
          .getByLabel('Transition style', { exact: true })
          .selectOption(effect);

        for (const mode of ['dark', 'light']) {
          await preview.click();

          if (await page.evaluate(() => 'startViewTransition' in document)) {
            await expect(page.locator('html')).toHaveAttribute(
              'data-ui-theme-transition',
              ''
            );

            if (effect === 'svg-logo')
              await expect(page.locator('[data-ui-theme-logo]')).toHaveCount(1);

            if (effect === 'circle')
              await page.screenshot({
                path: testInfo.outputPath(
                  `${framework}-${mode}-transition.png`
                ),
                animations: 'allow',
              });
          }

          await expect(
            page.getByLabel('Appearance', { exact: true })
          ).toHaveText(mode[0]!.toUpperCase() + mode.slice(1));
          await expect(page.locator('html')).not.toHaveAttribute(
            'data-ui-theme-transition'
          );
        }
      }

      await preview.evaluate((button) => {
        for (let index = 0; index < 5; index++)
          if (button instanceof HTMLButtonElement) button.click();
      });
      await expect(page.getByLabel('Appearance', { exact: true })).toHaveText(
        'Dark'
      );
      await expect(page.locator('html')).not.toHaveAttribute(
        'data-ui-theme-transition'
      );
      await expect(page.locator('[data-ui-theme-logo]')).toHaveCount(0);
    });

    test('respects reduced motion with the native transition API available', async ({
      page,
    }) => {
      await page.emulateMedia({
        reducedMotion: 'reduce',
        colorScheme: 'light',
      });
      await page.goto(url);

      const preview = page.getByRole('button', {
        name: 'Preview transition',
        exact: true,
      });

      await expect(preview).toBeEnabled();
      await preview.click();
      await expect(page.getByLabel('Appearance', { exact: true })).toHaveText(
        'Dark'
      );
      await expect(page.locator('html')).not.toHaveAttribute(
        'data-ui-theme-transition'
      );
      await page.getByRole('button', { name: 'Mocha', exact: true }).click();
      await expect(page.getByLabel('Color theme', { exact: true })).toHaveText(
        'Mocha'
      );
      await expect(page.locator('html')).not.toHaveAttribute(
        'data-ui-theme-transition'
      );
    });

    test('supports keyboard, reduced motion, unavailable transitions, and blocked storage', async ({
      page,
    }) => {
      await page.emulateMedia({
        reducedMotion: 'reduce',
        colorScheme: 'light',
      });
      await page.addInitScript(() => {
        Object.defineProperty(Document.prototype, 'startViewTransition', {
          value: undefined,
          configurable: true,
        });
        Object.defineProperty(window, 'localStorage', {
          get() {
            throw new DOMException('Blocked', 'SecurityError');
          },
        });
      });
      await page.goto(url);

      const preview = page.getByRole('button', {
        name: 'Preview transition',
        exact: true,
      });

      await expect(preview).toBeEnabled();
      await preview.focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('html')).toHaveClass(/dark/);
      await expect(page.locator('html')).not.toHaveAttribute(
        'data-ui-theme-transition'
      );
      await selectTheme(page, 'Color theme', 'mocha');
      await expect(page.locator('html')).toHaveClass(/theme-mocha/);
    });
  });
}

test('Nuxt isolates server requests and rejects invalid cookie values', async ({
  request,
}) => {
  const results = await Promise.all([
    request.get('http://127.0.0.1:4281', {
      headers: { cookie: 'theme=dark; color-theme=mocha' },
    }),
    request.get('http://127.0.0.1:4281', {
      headers: { cookie: 'theme=light; color-theme=caffeine' },
    }),
  ]);

  const dark = await results[0].text();
  const light = await results[1].text();
  expect(dark).toMatch(/<html[^>]*class="[^"]*dark[^"/]*theme-mocha/);
  expect(light).toMatch(/<html[^>]*class="[^"]*theme-caffeine/);
  expect(light).not.toMatch(/<html[^>]*class="[^"]*dark/);

  const invalid = await request.get('http://127.0.0.1:4281', {
    headers: { cookie: 'theme=invalid; color-theme=invalid' },
  });

  expect(await invalid.text()).not.toContain('theme-invalid');
});

test('Vue synchronizes appearance and palettes between open tabs', async ({
  page,
  context,
}) => {
  await page.goto('http://127.0.0.1:4280');
  const second = await context.newPage();
  await second.goto('http://127.0.0.1:4280');
  await expect(
    second.getByRole('button', { name: 'Preview transition', exact: true })
  ).toBeEnabled();
  await selectTheme(page, 'Appearance', 'dark');
  await expect(second.getByLabel('Appearance', { exact: true })).toHaveText(
    'Dark'
  );
  await selectTheme(page, 'Color theme', 'mocha');
  await expect(second.getByLabel('Color theme', { exact: true })).toHaveText(
    'Mocha'
  );
  await expect(second.locator('html')).toHaveClass(/dark.*theme-mocha/);
  await second.close();
});

for (const singleton of [false, true]) {
  test(`Vue respects configured appearance choices (${singleton ? 'singleton' : 'subset'})`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:4282/${singleton ? '?singleton' : ''}`);
    await expect(page.getByRole('combobox')).toHaveText('Light');
    await page.getByRole('combobox').click();
    await expect(
      page.getByRole('option', { name: 'Light', exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole('option', { name: 'Dark', exact: true })
    ).toHaveCount(0);
    await expect(
      page.getByRole('option', { name: 'System', exact: true })
    ).toHaveCount(singleton ? 0 : 1);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Toggle', exact: true }).click();
    await expect(page.locator('output')).toHaveText(
      singleton ? 'light' : 'system'
    );

    if (!singleton) {
      await page.getByRole('button', { name: 'Toggle', exact: true }).click();
      await expect(page.locator('output')).toHaveText('light');
    }

    expect(errors).toEqual([]);
  });
}
