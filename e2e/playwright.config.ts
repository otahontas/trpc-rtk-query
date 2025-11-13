import { defineConfig, devices } from '@playwright/test';

/**
 * E2E tests configuration for Playwright.
 * Tests the built library in a real React application.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: 'pnpm run server',
      url: 'http://localhost:3456',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'cd client && pnpm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
