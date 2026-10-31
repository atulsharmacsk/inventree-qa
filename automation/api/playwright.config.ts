import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'node:path';
import { baseUrl } from '../shared/environments';
import { retriesFromEnv, workersFromEnv } from '../shared/run-options';

// Load ENV (LOCALHOST or REMOTE) and the <ROLE>_USERNAME / <ROLE>_PASSWORD credentials from .env.
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests',
  // The shared demo answers single requests in 4-8 s, and setup plus cleanup count toward the test timeout.
  timeout: 60_000,
  globalTeardown: './src/global-teardown.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: retriesFromEnv(),
  workers: workersFromEnv(2),
  reporter: [
    ['list'],
    // Sharded CI runs (SHARD_TOTAL > 1) write a blob report; the workflow's merge-reports job combines them into one HTML report.
    Number(process.env.SHARD_TOTAL ?? 1) > 1 ? ['blob'] : ['html', { open: 'never' }],
    ['allure-playwright', { resultsDir: path.resolve(__dirname, 'allure-results') }],
  ],
  use: {
    baseURL: baseUrl(),
    trace: 'retain-on-failure',
  },
  projects: [
    // `settings` runs after every `api` test, so a test that changes a global setting never overlaps another test.
    { name: 'api', testIgnore: /\.settings\.spec\.ts$/, teardown: 'settings' },
    { name: 'settings', testMatch: /\.settings\.spec\.ts$/, fullyParallel: false },
  ],
});
