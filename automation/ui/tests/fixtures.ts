import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { withApiTokens, type TokenForRole } from '../../shared/auth';
import { useAndCleanUp } from '../../shared/cleanup';
import { withHttpLogging } from '../../shared/http-logging';
import { credentialsFor, missingRoleMessage, type Role } from '../../shared/roles';
import { BomItemService } from '../../shared/services/bom-item.service';
import { CategoryService } from '../../shared/services/category.service';
import { CompanyService } from '../../shared/services/company.service';
import { ImportSessionService } from '../../shared/services/import-session.service';
import { OrderService } from '../../shared/services/order.service';
import { ParameterService } from '../../shared/services/parameter.service';
import { PartService } from '../../shared/services/part.service';
import { SettingsService, overrideGlobalSettings } from '../../shared/services/settings.service';
import { currentEnvironment } from '../../shared/environments';
import { StockItemService } from '../../shared/services/stock-item.service';
import { StockLocationService } from '../../shared/services/stock-location.service';
import { SupplierPartService } from '../../shared/services/supplier-part.service';
import { NavigationComponent } from '../src/components/navigation.component';
import { ImporterComponent } from '../src/components/importer.component';
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
  /** Skips the test unless a boolean global setting is on, for example `requireSetting('PART_ENABLE_LOCKING')`. */
  requireSetting: (key: string) => Promise<void>;
  importSessions: ImportSessionService;
  /** Sets a global setting for this test and restores it afterwards; LOCALHOST only, used by `*.settings.spec.ts`. */
  globalSetting: (key: string, value: string) => Promise<void>;
  navigation: NavigationComponent;
  importer: ImporterComponent;
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
    await useAndCleanUp(new CategoryService(apiRequest), use, testInfo);
  },

  // Depends on `categories` so parts are deleted before the categories that hold them.
  parts: async ({ apiRequest }, use, testInfo) => {
    await useAndCleanUp(new PartService(apiRequest), use, testInfo);
  },

  // Depends on `parts` and `stockLocations` so stock is deleted before the parts and locations it belongs to.
  stockItems: async ({ apiRequest, parts, stockLocations }, use, testInfo) => {
    void parts;
    void stockLocations;
    await useAndCleanUp(new StockItemService(apiRequest), use, testInfo);
  },

  stockLocations: async ({ apiRequest }, use, testInfo) => {
    await useAndCleanUp(new StockLocationService(apiRequest), use, testInfo);
  },

  bomItems: async ({ apiRequest }, use) => {
    await use(new BomItemService(apiRequest));
  },

  parameters: async ({ apiRequest }, use, testInfo) => {
    await useAndCleanUp(new ParameterService(apiRequest), use, testInfo);
  },

  settings: async ({ apiRequest }, use) => {
    await use(new SettingsService(apiRequest));
  },

  requireSetting: async ({ settings }, use, testInfo) => {
    await use(async (key) => {
      const enabled = await base.step(`Precondition: GET /api/settings/global/${key}/`, async () => settings.isEnabledOrFail(key));
      const caseId = testInfo.title.split(':')[0];
      testInfo.skip(!enabled, `${caseId} needs ${key}, which is disabled on this instance`);
    });
  },

  importSessions: async ({ apiRequest }, use, testInfo) => {
    await useAndCleanUp(new ImportSessionService(apiRequest), use, testInfo);
  },

  companies: async ({ apiRequest }, use, testInfo) => {
    await useAndCleanUp(new CompanyService(apiRequest), use, testInfo);
  },

  // Depends on `companies` and `parts` so supplier parts are deleted before them.
  supplierParts: async ({ apiRequest, companies, parts }, use, testInfo) => {
    void companies;
    void parts;
    await useAndCleanUp(new SupplierPartService(apiRequest), use, testInfo);
  },

  // Orders depend on what their lines point to, so they are deleted (with their lines) first.
  purchaseOrders: async ({ apiRequest, companies, supplierParts }, use, testInfo) => {
    void companies;
    void supplierParts;
    await useAndCleanUp(new OrderService(apiRequest, 'po'), use, testInfo);
  },

  salesOrders: async ({ apiRequest, companies, parts }, use, testInfo) => {
    void companies;
    void parts;
    await useAndCleanUp(new OrderService(apiRequest, 'so'), use, testInfo);
  },

  // Request it before `parts` and other data fixtures, so the original value is restored after their cleanup.
  globalSetting: async ({ apiRequest }, use, testInfo) => {
    testInfo.skip(!SETTINGS_TESTS_ALLOWED, SETTINGS_TESTS_SKIP_REASON);
    await overrideGlobalSettings(new SettingsService(apiRequest), use);
  },

  navigation: async ({ page }, use) => {
    await use(new NavigationComponent(page));
  },

  importer: async ({ page }, use) => {
    await use(new ImporterComponent(page));
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
