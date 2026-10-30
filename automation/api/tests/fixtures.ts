import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { withApiTokens, type TokenForRole } from '../../shared/auth';
import { reportCleanup } from '../../shared/cleanup';
import { credentialsFor, missingRoleMessage, type Role } from '../../shared/roles';
import { CategoryService } from '../../shared/services/category.service';
import { PartService } from '../../shared/services/part.service';
import { SystemService } from '../src/services/system.service';

// Everything a test can ask for by name, for example `async ({ parts }) => { ... }`.
type Fixtures = {
  /** The user every request is sent as; set it with `test.use({ role: 'SUPERUSER' })` or `'READER'`. */
  role: Role;
  skipWithoutRole: void;
  authenticatedRequest: APIRequestContext;
  parts: PartService;
  categories: CategoryService;
  system: SystemService;
};

// Shared by all tests in one worker process.
type WorkerFixtures = {
  apiTokens: TokenForRole;
};

export const test = base.extend<Fixtures, WorkerFixtures>({
  role: ['SUPERUSER', { option: true }],

  // Runs before the token fixture, so an environment without this user skips instead of failing.
  skipWithoutRole: [
    async ({ role }, use, testInfo) => {
      testInfo.skip(!credentialsFor(role), missingRoleMessage(role));
      await use();
    },
    { auto: true },
  ],

  apiTokens: [async ({ playwright }, use) => withApiTokens(playwright.request, 'playwright-api', use), { scope: 'worker' }],

  // An HTTP client that sends the role's token with every request.
  authenticatedRequest: async ({ playwright, baseURL, apiTokens, role }, use) => {
    const request = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: { Authorization: `Token ${await apiTokens(role)}` },
    });
    await use(request);
    await request.dispose();
  },

  categories: async ({ authenticatedRequest }, use, testInfo) => {
    const categories = new CategoryService(authenticatedRequest);
    await use(categories);
    reportCleanup(testInfo, await categories.deleteCreated());
  },

  // Uses `categories` so Playwright deletes parts before the categories they belong to.
  parts: async ({ authenticatedRequest }, use, testInfo) => {
    const parts = new PartService(authenticatedRequest);
    await use(parts);
    reportCleanup(testInfo, await parts.deleteCreated());
  },

  system: async ({ authenticatedRequest }, use) => {
    await use(new SystemService(authenticatedRequest));
  },
});

export { expect };
