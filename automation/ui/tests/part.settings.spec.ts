import type { Part } from '../src/models/part';
import { newStockLocation, partFormInput } from '../src/data/factories';
import { SETTINGS_TESTS_ALLOWED, SETTINGS_TESTS_SKIP_REASON, expect, test } from './fixtures';

// Manual cases: test-cases/ui/part-creation.md
// Each test switches a global setting through the `globalSetting` fixture, which restores it afterwards. The `settings`
// project runs after all `ui` tests, and these tests skip on REMOTE so the shared demo is never changed.

test.describe('Global setting variants', () => {
  test.skip(!SETTINGS_TESTS_ALLOWED, SETTINGS_TESTS_SKIP_REASON);
  test.use({ role: 'SUPERUSER' });

  // `globalSetting` comes first so the setting is restored after the part, stock, and location are cleaned up.
  test('UI-CREATE-009: create a part with initial stock', async ({
    globalSetting,
    page,
    parts,
    stockLocations,
    stockItems,
    partsList,
    partDetail,
  }) => {
    await test.step('Setup: PART_CREATE_INITIAL=true (Initial Stock Data)', async () => {
      await globalSetting('PART_CREATE_INITIAL', 'true');
    });
    const location = await test.step('Setup: a stock location', async () => {
      return await stockLocations.createOrFail(newStockLocation());
    });
    const input = partFormInput();
    const quantity = 7;

    const created =
      await test.step(`Open Parts > Add Parts > Create Part, enter a name and initial stock ${quantity} at ${location.name}, then submit`, async () => {
        await partsList.goto();
        const form = await partsList.openCreatePartForm();
        await form.fill(input);
        await form.fillInitialStock(quantity, location.name);
        const response = await form.submit();
        expect(response.status()).toBe(201);
        const part = (await response.json()) as Part;
        parts.track(part.pk);
        stockItems.trackPart(part.pk);
        return part;
      });

    await test.step('Check the part was created with one stock item of that quantity at the location', async () => {
      await expect(page).toHaveURL(new RegExp(`/web/part/${created.pk}/`));
      const stock = await stockItems.listOrFail({ part: created.pk });
      expect(stock.results.map(({ quantity, location }) => ({ quantity, location }))).toEqual([{ quantity, location: location.pk }]);
    });

    await test.step('Open the part > Stock tab and check the item is listed', async () => {
      await partDetail.goto(created.pk);
      await partDetail.openTab('Stock');
      await partDetail.waitForTable('Stock');
      const row = partDetail.tableRows('Stock', location.name);
      await expect(row).toHaveCount(1);
      await expect(row.getByRole('cell', { name: String(quantity), exact: true })).toBeVisible();
    });
  });
});
