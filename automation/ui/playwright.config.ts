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
  // Tables show a spinner first, and the demo or a fresh CI instance can take several seconds to fill them.
  expect: { timeout: 10_000 },
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
    // Not redactable like traces; safe because tests log in through the API, never by typing the password in the browser.
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'ui',
      testIgnore: [/auth\.setup\.ts/, /\.settings\.spec\.ts$/],
      dependencies: ['setup'],
      // `settings` runs after every `ui` test, so a test that changes a global setting never overlaps another test.
      teardown: 'settings',
      // Storage state is chosen per test from the `role` fixture in tests/fixtures.ts.
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Teardown of `ui`, so it cannot depend on `setup`; it reuses the sessions `ui` already required.
      name: 'settings',
      testMatch: /\.settings\.spec\.ts$/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});