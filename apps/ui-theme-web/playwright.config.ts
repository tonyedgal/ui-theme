import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  use: {
    baseURL: 'http://127.0.0.1:4290',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium', channel: process.env.PLAYWRIGHT_CHANNEL },
    },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  webServer: {
    command: 'pnpm start --hostname 127.0.0.1 --port 4290',
    url: 'http://127.0.0.1:4290',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
