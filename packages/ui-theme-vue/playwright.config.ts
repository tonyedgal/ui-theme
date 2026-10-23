import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
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
        'pnpm exec vite tests/fixtures --config tests/fixtures/vite.config.ts --host 127.0.0.1 --port 4282 --strictPort',
      url: 'http://127.0.0.1:4282',
      reuseExistingServer: false,
    },
    {
      command:
        'pnpm --filter example-vue preview --host 127.0.0.1 --port 4280 --strictPort',
      url: 'http://127.0.0.1:4280',
      reuseExistingServer: false,
    },
    {
      command: 'pnpm --filter example-nuxt exec node .output/server/index.mjs',
      url: 'http://127.0.0.1:4281',
      env: { NITRO_PORT: '4281', NITRO_HOST: '127.0.0.1' },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
