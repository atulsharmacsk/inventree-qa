import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { withApiTokens, type TokenForRole } from '../../shared/auth';
import { reportCleanup } from '../../shared/cleanup';
import { withHttpLogging } from '../../shared/http-logging';
import { credentialsFor, missingRoleMessage, type Role } from '../../shared/roles';
import { BomItemService } from '../../shared/services/bom-item.service';
import { CategoryService } from '../../shared/services/category.service';
import { CompanyService } from '../../shared/services/company.service';
import { OrderService } from '../../shared/services/order.service';
import { ParameterService } from '../../shared/services/parameter.service';
import { PartService } from '../../shared/services/part.service';
import { SettingsService, overrideGlobalSettings } from '../../shared/services/settings.service';
import { currentEnvironment } from '../../shared/environments';
import { StockItemService } from '../../shared/services/stock-item.service';
import { StockLocationService } from '../../shared/services/stock-location.service';
import { SupplierPartService } from '../../shared/services/supplier-part.service';
import { NavigationComponent } from '../src/components/navigation.component';
import { storageStatePath } from '../src/models/paths';
import { OrderLineItemsPage } from '../src/pages/order-line-items.page';
import { PartDetailPage } from '../src/pages/part-detail.page';
import { PartsListPage } from '../src/pages/parts-list.page';
import { StockLocationPage } from '../src/pages/stock-location.page';

type Fixtures = {
  /** The user the browser is logged in as; set it with `test.use({ role: 'SUPERUSER' })` or `'READER'`. */
  role: Role;
  skipWithoutRole: void;
  apiRequest: APIRequestContext;
  parts: PartService;
  categories: CategoryService;
  stockItems: StockItemService;
  stockLocations: StockLocationService;
  bomItems: BomItemService;
  parameters: ParameterService;
  companies: CompanyService;
  supplierParts: SupplierPartService;
  purchaseOrders: OrderService;
  salesOrders: OrderService;
  settings: SettingsService;
  /** Sets a global setting for this test and restores it afterwards; LOCALHOST only, used by `*.settings.spec.ts`. */
  globalSetting: (key: string, value: string) => Promise<void>;
  navigation: NavigationComponent;
  partsList: PartsListPage;
  partDetail: PartDetailPage;
  orderLineItems: OrderLineItemsPage;
  stockLocation: StockLocationPage;
};

type WorkerFixtures = {
  apiTokens: TokenForRole;
};

export const test = base.extend<Fixtures, WorkerFixtures>({
  role: ['SUPERUSER', { option: true }],

  // Runs before the browser opens, so an environment without this user skips instead of failing.
  skipWithoutRole: [
    async ({ role }, use, testInfo) => {
      testInfo.skip(!credentialsFor(role), missingRoleMessage(role));
      await use();
    },
    { auto: true },
  ],

  storageState: async ({ role }, use) => {
    await use(storageStatePath(role));
  },

  apiTokens: [async ({ playwright }, use) => withApiTokens(playwright.request, 'playwright-ui', use), { scope: 'worker' }],

  // API setup and cleanup always run as the superuser, whatever role the browser uses; each call is logged to the report.
  apiRequest: async ({ playwright, baseURL, apiTokens }, use, testInfo) => {
    const request = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: { Authorization: `Token ${await apiTokens('SUPERUSER')}` },
    });
    await use(withHttpLogging(request, testInfo));
    await request.dispose();
  },

  categories: async ({ apiRequest }, use, testInfo) => {
    const categories = new CategoryService(apiRequest);
    await use(categories);
    reportCleanup(testInfo, await categories.deleteCreated());
  },

  // Depends on `categories` so parts are deleted before the categories that hold them.
  parts: async ({ apiRequest }, use, testInfo) => {
    const parts = new PartService(apiRequest);
    await use(parts);
    reportCleanup(testInfo, await parts.deleteCreated());
  },

  // Depends on `parts` and `stockLocations` so stock is deleted before the parts and locations it belongs to.
  stockItems: async ({ apiRequest, parts, stockLocations }, use, testInfo) => {
    void parts;
    void stockLocations;
    const stockItems = new StockItemService(apiRequest);
    await use(stockItems);
    reportCleanup(testInfo, await stockItems.deleteCreated());
  },

  stockLocations: async ({ apiRequest }, use, testInfo) => {
    const stockLocations = new StockLocationService(apiRequest);
    await use(stockLocations);
    reportCleanup(testInfo, await stockLocations.deleteCreated());
  },

  bomItems: async ({ apiRequest }, use) => {
    await use(new BomItemService(apiRequest));
  },

  parameters: async ({ apiRequest }, use, testInfo) => {
    const parameters = new ParameterService(apiRequest);
    await use(parameters);
    reportCleanup(testInfo, await parameters.deleteCreated());
  },

  settings: async ({ apiRequest }, use) => {
    await use(new SettingsService(apiRequest));
  },

  companies: async ({ apiRequest }, use, testInfo) => {
    const companies = new CompanyService(apiRequest);
    await use(companies);
    reportCleanup(testInfo, await companies.deleteCreated());
  },

  // Depends on `companies` and `parts` so supplier parts are deleted before them.
  supplierParts: async ({ apiRequest, companies, parts }, use, testInfo) => {
    void companies;
    void parts;
    const supplierParts = new SupplierPartService(apiRequest);
    await use(supplierParts);
    reportCleanup(testInfo, await supplierParts.deleteCreated());
  },

  // Orders depend on what their lines point to, so they are deleted (with their lines) first.
  purchaseOrders: async ({ apiRequest, companies, supplierParts }, use, testInfo) => {
    void companies;
    void supplierParts;
    const orders = new OrderService(apiRequest, 'po');
    await use(orders);
    reportCleanup(testInfo, await orders.deleteCreated());
  },

  salesOrders: async ({ apiRequest, companies, parts }, use, testInfo) => {
    void companies;
    void parts;
    const orders = new OrderService(apiRequest, 'so');
    await use(orders);
    reportCleanup(testInfo, await orders.deleteCreated());
  },

  // Request it before `parts` and other data fixtures, so the original value is restored after their cleanup.
  globalSetting: async ({ apiRequest }, use, testInfo) => {
    testInfo.skip(!SETTINGS_TESTS_ALLOWED, SETTINGS_TESTS_SKIP_REASON);
    await overrideGlobalSettings(new SettingsService(apiRequest), use);
  },

  navigation: async ({ page }, use) => {
    await use(new NavigationComponent(page));
  },

  partsList: async ({ page }, use) => {
    await use(new PartsListPage(page));
  },

  partDetail: async ({ page }, use) => {
    await use(new PartDetailPage(page));
  },

  orderLineItems: async ({ page }, use) => {
    await use(new OrderLineItemsPage(page));
  },

  stockLocation: async ({ page }, use) => {
    await use(new StockLocationPage(page));
  },
});

export { expect };

/** Settings specs skip with this before any fixture runs, so REMOTE (the shared demo) is never contacted for them. */
export const SETTINGS_TESTS_ALLOWED = currentEnvironment() === 'LOCALHOST';
export const SETTINGS_TESTS_SKIP_REASON = 'Changes a global setting; runs on LOCALHOST only, never on the shared demo';
