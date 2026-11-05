import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/vue-browser',
  fullyParallel: true,
  workers: 3,
  outputDir: 'tests/vue-browser/test-results',
  reporter: [
    ['list'],
    [
      'html',
      { open: 'never', outputFolder: 'tests/vue-browser/playwright-report' },
    ],
  ],
  use: { trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        deviceScaleFactor: 2,
        channel: process.env.PLAYWRIGHT_CHANNEL,
      },
    },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], channel: process.env.PLAYWRIGHT_CHANNEL },
    },
  ],
  webServer: [
    {
      command:
        'pnpm exec vite tests/vue-browser/fixtures/vue --config tests/vue-browser/fixtures/vue/vite.config.ts --host 127.0.0.1 --port 4280 --strictPort',
      url: 'http://127.0.0.1:4280',
      reuseExistingServer: false,
    },
    {
      command:
        'pnpm exec nuxt build tests/vue-browser/fixtures/nuxt && node tests/vue-browser/fixtures/nuxt/.output/server/index.mjs',
      url: 'http://127.0.0.1:4281',
      env: { NITRO_PORT: '4281', NITRO_HOST: '127.0.0.1' },
      reuseExistingServer: false,
      timeout: 240_000,
    },
  ],
});
