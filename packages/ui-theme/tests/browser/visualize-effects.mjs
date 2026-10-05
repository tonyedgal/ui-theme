import { chromium } from '@playwright/test';
import { mkdir, rename } from 'node:fs/promises';
import { resolve } from 'node:path';

// Start test:browser:serve first. Records real playback plus inspectable stills.
const output = resolve(
  process.env.THEME_VISUAL_OUTPUT ?? 'test-results/effects'
);

await mkdir(output, { recursive: true });

const browser = await chromium.launch({ channel: 'chromium' });

try {
  for (const effect of [
    'clip-path',
    'polygon-gradient',
    'triangle',
    'svg-logo',
  ]) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 2,
      recordVideo: { dir: output, size: { width: 1280, height: 800 } },
    });

    const page = await context.newPage();
    const video = page.video();
    const progress = effect === 'svg-logo' ? 0.55 : 0.25;
    await page.goto(
      `http://127.0.0.1:4179/?gallery&animation=${effect}&position=center&logo=/logo.svg&duration=1200&easing=linear&progress=${progress}`
    );
    await page.waitForFunction(() => !!window.themeFixture);
    await page.evaluate(() => window.themeFixture.preloadLogo());
    await page.locator('#freeze').click();
    await page.locator('#element-toggle').click();
    await page.waitForFunction(() =>
      document
        .getAnimations()
        .some((animation) => animation.playState === 'paused')
    );
    await page.screenshot({ path: resolve(output, `${effect}-midpoint.png`) });
    await page.locator('#resume').evaluate((button) => button.click());
    await page.waitForFunction(
      () => !document.documentElement.hasAttribute('data-ui-theme-transition')
    );
    await page.locator('#freeze').click();

    for (const selector of ['#element-toggle', '#cycle']) {
      await page.locator(selector).click();
      await page.waitForFunction(
        () => !document.documentElement.hasAttribute('data-ui-theme-transition')
      );
    }

    await context.close();
    await rename(await video.path(), resolve(output, `${effect}.webm`));
  }
} finally {
  await browser.close();
}
