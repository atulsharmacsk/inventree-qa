import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'node:path';
import { baseUrl } from '../shared/environments';
import { retriesFromEnv, workersFromEnv } from '../shared/run-options';

dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });

export default defineConfig({
  testDir: './tests',
  // The shared demo is slow: fixture setup alone (API token, test data) can take 18 s, and it counts toward the test timeout.
  timeout: 120_000,
  // Redacts session cookies, CSRF tokens, auth headers, and the password before the HTML report copies traces.
  globalTeardown: './src/global-teardown.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: retriesFromEnv(),
  // Default 1: the local Docker instance drops requests (for example /api/user/me/) with parallel browsers, which logs the page out.
  workers: workersFromEnv(1),
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['allure-playwright', { resultsDir: path.resolve(__dirname, 'allure-results') }],
  ],
  use: {
    baseURL: baseUrl(),
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    // One file, one worker: the roles log in one after another so the demo never sees simultaneous logins.
    { name: 'setup', testMatch: /auth\.setup\.ts/, fullyParallel: false },
    {
      name: 'ui',
      testIgnore: /auth\.setup\.ts/,
      dependencies: ['setup'],
      // Storage state is chosen per test from the `role` fixture in tests/fixtures.ts.
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});