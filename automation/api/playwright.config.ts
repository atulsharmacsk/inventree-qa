import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'node:path';
import { baseUrl } from '../shared/environments';

// Load ENV (LOCALHOST or REMOTE) and the <ROLE>_USERNAME / <ROLE>_PASSWORD credentials from .env.
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests',
  globalTeardown: './src/global-teardown.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: baseUrl(),
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'api' }],
});
