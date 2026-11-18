import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4179', trace: 'retain-on-failure' },
  webServer: {
    command: 'vite tests/browser --host 127.0.0.1 --port 4179 --strictPort',
    url: 'http://127.0.0.1:4179',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium-dpr2',
      use: {
        browserName: 'chromium',
        channel: process.env.PLAYWRIGHT_CHANNEL,
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2,
      },
    },
    {
      name: 'webkit-dpr2',
      use: {
        browserName: 'webkit',
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 2,
      },
    },
    {
      name: 'firefox-dpr2',
      use: {
        browserName: 'firefox',
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 2,
      },
    },
  ],
});
