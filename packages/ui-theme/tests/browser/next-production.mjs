import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const browser = await chromium.launch();

try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      /hydration|did not match|server rendered/i.test(message.text())
    )
      errors.push(message.text());
  });
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('color-theme', 'ocean');
  });
  await page.goto('http://127.0.0.1:4180/');
  await page.waitForFunction(() =>
    document.documentElement.classList.contains('dark')
  );

  const dark = page
    .getByRole('radio', { name: 'Switch to dark theme' })
    .first();

  await dark.waitFor();
  assert.equal(await dark.getAttribute('aria-checked'), 'true');
  await page
    .getByRole('radio', { name: 'Switch to light theme' })
    .first()
    .click();
  await page.waitForFunction(
    () =>
      !document.documentElement.classList.contains('dark') &&
      !document.documentElement.hasAttribute('data-ui-theme-transition')
  );
  assert.deepEqual(errors, []);
  console.log(
    'Production Next.js: persisted theme hydration and provider control passed without hydration errors.'
  );
} finally {
  await browser.close();
}
