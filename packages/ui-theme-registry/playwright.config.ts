import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  use: { baseURL: 'http://127.0.0.1:4287', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], deviceScaleFactor: 2 },
    },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command:
      'vite tests/browser --config tests/browser/vite.config.ts --host 127.0.0.1 --port 4287 --strictPort',
    url: 'http://127.0.0.1:4287',
    reuseExistingServer: !process.env.CI,
  },
});
