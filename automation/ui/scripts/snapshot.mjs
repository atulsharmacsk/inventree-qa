// Usage: node scripts/snapshot.mjs <path> ["Click target" ...]
// Logs in with .env credentials (never printed) and prints the page's accessibility tree.
import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { baseUrl } from '../../shared/environments.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env'), quiet: true });
// Fall back to the API project's credentials when the UI project has no .env yet.
dotenv.config({ path: path.join(root, '..', 'api', '.env'), quiet: true });

const baseURL = baseUrl();
const { SUPERUSER_USERNAME: username, SUPERUSER_PASSWORD: password } = process.env;
const [target = '/web/', ...clicks] = process.argv.slice(2);

if (!username || !password) {
  console.error('Set SUPERUSER_USERNAME and SUPERUSER_PASSWORD in automation/ui/.env or automation/api/.env.');
  process.exit(1);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ baseURL });
  await page.goto('/web/');
  await page.getByRole('textbox', { name: 'login-username' }).fill(username);
  await page.getByRole('textbox', { name: 'login-password' }).fill(password);
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.waitForURL((url) => !url.pathname.includes('login'));

  await page.goto(target);
  await page.waitForLoadState('networkidle');
  for (const name of clicks) {
    await page
      .getByRole('button', { name, exact: true })
      .or(page.getByText(name, { exact: true }))
      .first()
      .click();
    await page.waitForLoadState('networkidle');
  }
  console.log(`URL: ${page.url()}`);
  console.log((await page.locator('body').ariaSnapshot()).replaceAll(username, '<user>'));
} finally {
  await browser.close();
}
