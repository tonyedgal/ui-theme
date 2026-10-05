import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Start test:browser:serve first. Raw traces open in Chrome's Performance panel.
const output = resolve(
  process.env.THEME_PROFILE_OUTPUT ?? 'test-results/performance'
);

await mkdir(output, { recursive: true });

const browser = await chromium.launch({
  // Playwright's headless shell can use software rendering even on a GPU Mac.
  // Use the full browser and record its renderer; keep software as an opt-in.
  channel: process.argv.includes('--software') ? undefined : 'chromium',
  headless: !process.argv.includes('--headed'),
});

const browserSession = await browser.newBrowserCDPSession();

const { gpu } = await browserSession.send('SystemInfo.getInfo');

const summary = {
  browser: browser.version(),
  renderer: gpu.devices,
  featureStatus: gpu.featureStatus,
  runs: [],
};

const easing = process.env.THEME_PROFILE_EASING;

const tail = process.argv.includes('--tail');

const duration = Number(
  process.env.THEME_PROFILE_DURATION ?? (tail ? 6000 : 750)
);

const selectedEffect = process.env.THEME_PROFILE_EFFECT;

const cases = tail
  ? [
      ['large-right-zoom', 3215, 2000, 1.8, 'top-right'],
      ['large-right', 3215, 2000, 2, 'top-right'],
      ['large-left', 3215, 2000, 2, 'top-left'],
    ]
  : [
      ['dpr1', 1440, 900, 1, 'bottom-right'],
      ['dpr2', 1440, 900, 2, 'bottom-right'],
      ['4k', 1920, 1080, 2, 'bottom-right'],
    ];

try {
  for (const [name, width, height, dpr, corner] of cases) {
    for (const effect of selectedEffect
      ? [selectedEffect]
      : tail
        ? ['circle']
        : ['circle', 'blur-circle']) {
      const context = await browser.newContext({
        viewport: { width, height },
        deviceScaleFactor: dpr,
      });

      const page = await context.newPage();
      await page.goto(
        `http://127.0.0.1:4179/?animation=${effect}&duration=${duration}&corner=${corner}&direction=${corner}&logo=/logo.svg${tail ? '&probe' : ''}${easing ? `&easing=${encodeURIComponent(easing)}` : ''}`
      );
      await page.waitForFunction(() => !!window.themeFixture);

      if (effect === 'svg-logo')
        await page.evaluate(() => window.themeFixture.preloadLogo());
      await page.evaluate(() => {
        localStorage.clear();
        window.themeFixture.state.setTheme('light');
      });
      await page.waitForFunction(
        () => !document.documentElement.classList.contains('dark')
      );
      const session = await context.newCDPSession(page);
      const events = [];
      session.on('Tracing.dataCollected', ({ value }) => events.push(...value));
      await session.send('Tracing.start', {
        categories:
          'devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame,cc',
        transferMode: 'ReportEvents',
      });
      await page.locator(tail ? '#element-toggle' : '#ref-toggle').click();
      await page.waitForFunction(
        () => !document.documentElement.hasAttribute('data-ui-theme-transition')
      );

      const complete = new Promise((done) =>
        session.once('Tracing.tracingComplete', done)
      );

      await session.send('Tracing.end');
      await complete;
      const metrics = {};

      for (const event of events) {
        if (
          !['Paint', 'Layout', 'UpdateLayoutTree', 'RasterTask'].includes(
            event.name
          )
        )
          continue;
        metrics[event.name] ??= { count: 0, ms: 0 };
        metrics[event.name].count++;
        metrics[event.name].ms += (event.dur ?? 0) / 1000;
      }

      const run = {
        name,
        effect,
        width,
        height,
        dpr,
        duration,
        easing: easing ?? 'cubic-bezier(0.32, 0.72, 0, 1)',
        metrics,
      };

      if (tail) {
        const probe = await page.evaluate(() =>
          window.themeFixture.inspection.probes.at(-1)
        );

        const { ...timing } = probe;
        run.timing = timing;
        await writeFile(
          resolve(output, `${name}-${effect}-timing.json`),
          JSON.stringify(probe, null, 2)
        );
      }

      summary.runs.push(run);
      console.log(JSON.stringify(run));
      await writeFile(
        resolve(output, `${name}-${effect}.json`),
        JSON.stringify({ traceEvents: events })
      );
      await context.close();
    }
  }

  await writeFile(
    resolve(output, 'summary.json'),
    JSON.stringify(summary, null, 2)
  );
} finally {
  await browser.close();
}
