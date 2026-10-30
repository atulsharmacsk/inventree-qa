import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { withApiTokens, type TokenForRole } from '../../shared/auth';
import { reportCleanup } from '../../shared/cleanup';
import { credentialsFor, missingRoleMessage, type Role } from '../../shared/roles';
import { BomItemService } from '../../shared/services/bom-item.service';
import { CategoryService } from '../../shared/services/category.service';
import { ParameterService } from '../../shared/services/parameter.service';
import { PartService } from '../../shared/services/part.service';
import { SettingsService } from '../../shared/services/settings.service';
import { StockItemService } from '../../shared/services/stock-item.service';
import { StockLocationService } from '../../shared/services/stock-location.service';
import { NavigationComponent } from '../src/components/navigation.component';
import { storageStatePath } from '../src/models/paths';
import { PartDetailPage } from '../src/pages/part-detail.page';
import { PartsListPage } from '../src/pages/parts-list.page';

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
  settings: SettingsService;
  navigation: NavigationComponent;
  partsList: PartsListPage;
  partDetail: PartDetailPage;
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

  // API setup and cleanup always run as the superuser, whatever role the browser uses.
  apiRequest: async ({ playwright, baseURL, apiTokens }, use) => {
    const request = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: { Authorization: `Token ${await apiTokens('SUPERUSER')}` },
    });
    await use(request);
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

  navigation: async ({ page }, use) => {
    await use(new NavigationComponent(page));
  },

  partsList: async ({ page }, use) => {
    await use(new PartsListPage(page));
  },

  partDetail: async ({ page }, use) => {
    await use(new PartDetailPage(page));
  },
});

export { expect };
