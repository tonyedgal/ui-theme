import { defineConfig } from '@playwright/test';

// Extra display-density runs cover geometry and rasterization contracts.
// Engine compatibility remains covered by the full DPR 2 projects.
const displayCases =
  /declared ref|circle origins|covers all four corners|SVG logo stays centered|clicked element overrides|CSS zoom|last corner/;

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
      name: 'chromium-dpr1',
      grep: displayCases,
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'chromium-dpr2',
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2,
      },
    },
    {
      name: 'chromium-dpr3-mobile',
      grep: displayCases,
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
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
