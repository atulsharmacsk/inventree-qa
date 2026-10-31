import { randomUUID } from 'node:crypto';
import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { requestToken, revokeToken, withApiTokens, type TokenForRole } from '../../shared/auth';
import { reportCleanup } from '../../shared/cleanup';
import { credentialsFor, missingRoleMessage, type Role } from '../../shared/roles';
import { CategoryService } from '../../shared/services/category.service';
import { BomItemService } from '../../shared/services/bom-item.service';
import { OrderService } from '../../shared/services/order.service';
import { currentEnvironment } from '../../shared/environments';
import { PartService } from '../../shared/services/part.service';
import { SettingsService, overrideGlobalSettings } from '../../shared/services/settings.service';
import { StockItemService } from '../../shared/services/stock-item.service';
import { StockLocationService } from '../../shared/services/stock-location.service';
import { CompanyService } from '../../shared/services/company.service';
import { ManufacturerPartService } from '../src/services/manufacturer-part.service';
import { SupplierPartService } from '../../shared/services/supplier-part.service';
import { SystemService } from '../src/services/system.service';
import { withHttpLogging } from '../src/http-logging';

// Everything a test can ask for by name, for example `async ({ parts }) => { ... }`.
type Fixtures = {
  /** The user every request is sent as; set it with `test.use({ role: 'SUPERUSER' })` or `'READER'`. */
  role: Role;
  skipWithoutRole: void;
  authenticatedRequest: APIRequestContext;
  parts: PartService;
  /** Builds a part service that sends this `Authorization` header, or none for `null`; for authentication checks. */
  partsWithAuthorization: (authorization: string | null) => Promise<PartService>;
  /** An API token that was issued and revoked within this test. */
  revokedToken: string;
  categories: CategoryService;
  stockItems: StockItemService;
  stockLocations: StockLocationService;
  companies: CompanyService;
  supplierParts: SupplierPartService;
  manufacturerParts: ManufacturerPartService;
  bomItems: BomItemService;
  purchaseOrders: OrderService;
  salesOrders: OrderService;
  system: SystemService;
  /** Sets a global setting for this test and restores it afterwards; LOCALHOST only, used by `*.settings.spec.ts`. */
  globalSetting: (key: string, value: string) => Promise<void>;
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

  // An HTTP client that sends the role's token with every request and logs each call to the report.
  authenticatedRequest: async ({ playwright, baseURL, apiTokens, role }, use, testInfo) => {
    const request = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: { Authorization: `Token ${await apiTokens(role)}` },
    });
    await use(withHttpLogging(request, testInfo));
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

  partsWithAuthorization: async ({ playwright, baseURL }, use, testInfo) => {
    const contexts: APIRequestContext[] = [];
    await use(async (authorization) => {
      const context = await playwright.request.newContext({
        baseURL,
        extraHTTPHeaders: authorization === null ? {} : { Authorization: authorization },
      });
      contexts.push(context);
      return new PartService(withHttpLogging(context, testInfo));
    });
    for (const context of contexts) await context.dispose();
  },

  revokedToken: async ({ playwright, baseURL }, use) => {
    const credentials = credentialsFor('SUPERUSER');
    if (!credentials) throw new Error(missingRoleMessage('SUPERUSER'));
    const login = await playwright.request.newContext({ baseURL, httpCredentials: { ...credentials, send: 'always' } });
    const name = `playwright-api-revoked-${randomUUID().slice(0, 8)}`;
    const token = await requestToken(login, name);
    await revokeToken(login, name);
    await login.dispose();
    await use(token);
  },

  stockLocations: async ({ authenticatedRequest }, use, testInfo) => {
    const stockLocations = new StockLocationService(authenticatedRequest);
    await use(stockLocations);
    reportCleanup(testInfo, await stockLocations.deleteCreated());
  },

  // Set up before `parts` and torn down after it, so test records are cleaned up while the setting still applies.
  globalSetting: async ({ authenticatedRequest }, use, testInfo) => {
    testInfo.skip(!SETTINGS_TESTS_ALLOWED, SETTINGS_TESTS_SKIP_REASON);
    await overrideGlobalSettings(new SettingsService(authenticatedRequest), use);
  },

  // Depends on `parts` and `stockLocations` so stock is deleted before the parts and locations it belongs to.
  stockItems: async ({ authenticatedRequest, parts, stockLocations }, use, testInfo) => {
    void parts;
    void stockLocations;
    const stockItems = new StockItemService(authenticatedRequest);
    await use(stockItems);
    reportCleanup(testInfo, await stockItems.deleteCreated());
  },

  companies: async ({ authenticatedRequest }, use, testInfo) => {
    const companies = new CompanyService(authenticatedRequest);
    await use(companies);
    reportCleanup(testInfo, await companies.deleteCreated());
  },

  // Depends on `parts` and `companies` so these links are deleted before the records they point to.
  manufacturerParts: async ({ authenticatedRequest, parts, companies }, use, testInfo) => {
    void parts;
    void companies;
    const manufacturerParts = new ManufacturerPartService(authenticatedRequest);
    await use(manufacturerParts);
    reportCleanup(testInfo, await manufacturerParts.deleteCreated());
  },

  // Also depends on `manufacturerParts` because a supplier part can point to a manufacturer part.
  supplierParts: async ({ authenticatedRequest, parts, companies, manufacturerParts }, use, testInfo) => {
    void parts;
    void companies;
    void manufacturerParts;
    const supplierParts = new SupplierPartService(authenticatedRequest);
    await use(supplierParts);
    reportCleanup(testInfo, await supplierParts.deleteCreated());
  },

  system: async ({ authenticatedRequest }, use) => {
    await use(new SystemService(authenticatedRequest));
  },

  bomItems: async ({ authenticatedRequest }, use) => {
    await use(new BomItemService(authenticatedRequest));
  },

  // Orders depend on what their lines point to, so they are deleted (with their lines) first.
  purchaseOrders: async ({ authenticatedRequest, companies, supplierParts }, use, testInfo) => {
    void companies;
    void supplierParts;
    const orders = new OrderService(authenticatedRequest, 'po');
    await use(orders);
    reportCleanup(testInfo, await orders.deleteCreated());
  },

  salesOrders: async ({ authenticatedRequest, companies, parts }, use, testInfo) => {
    void companies;
    void parts;
    const orders = new OrderService(authenticatedRequest, 'so');
    await use(orders);
    reportCleanup(testInfo, await orders.deleteCreated());
  },
});

export { expect };

/** Settings specs skip with this before any fixture runs, so REMOTE (the shared demo) is never contacted for them. */
export const SETTINGS_TESTS_ALLOWED = currentEnvironment() === 'LOCALHOST';
export const SETTINGS_TESTS_SKIP_REASON = 'Changes a global setting; runs on LOCALHOST only, never on the shared demo';
