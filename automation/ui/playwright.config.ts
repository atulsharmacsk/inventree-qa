import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'node:path';
import { baseUrl } from '../shared/environments';

dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });

export default defineConfig({
  testDir: './tests',
  // Redacts session cookies, CSRF tokens, auth headers, and the password before the HTML report copies traces.
  globalTeardown: './src/global-teardown.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // The local Docker instance drops requests (for example /api/user/me/) with parallel browsers, which logs the page out.
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: baseUrl(),
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'ui',
      testIgnore: /auth\.setup\.ts/,
      dependencies: ['setup'],
      // Storage state is chosen per test from the `role` fixture in tests/fixtures.ts.
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});