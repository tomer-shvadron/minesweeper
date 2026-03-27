import { defineConfig, devices } from '@playwright/test';

// In CI we run e2e against the production preview build (port 4173).
// Locally, we run against the dev server (port 5173).
const usePreview = !!process.env.PLAYWRIGHT_PREVIEW || !!process.env.CI;
const BASE_URL = usePreview ? 'http://localhost:4173' : 'http://localhost:5173';
const WEB_SERVER_CMD = usePreview ? 'pnpm preview' : 'pnpm dev';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Each browser runs on its own dedicated CI runner (matrix job), so 2 workers
  // matches the 2 vCPUs available on ubuntu-latest and roughly halves run time.
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['github'], ['list'], ['html', { open: 'never' }]]
    : [['list'], ['html']],
  timeout: 30_000,
  expect: { timeout: 8_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 15'] },
    },
  ],

  webServer: {
    command: WEB_SERVER_CMD,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
