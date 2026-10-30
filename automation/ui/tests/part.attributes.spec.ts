import { newCategory, newPart, newStockItem } from '../src/data/factories';
import { expect, test } from './fixtures';

// Manual cases: test-cases/ui/part-attributes.md

const DUPLICATE_SERIAL = '100';

test.describe('Part attributes', () => {
  test.use({ role: 'SUPERUSER' });

  test('UI-ATTR-008: a serial number used by one variant is rejected for another variant', async ({ parts, stockItems, partDetail }) => {
    const { secondVariant } = await test.step('Setup: trackable template T, variants V1 and V2, V1 stock with serial 100', async () => {
      const template = await parts.createOrFail(newPart({ is_template: true, trackable: true }));
      const firstVariant = await parts.createOrFail(newPart({ variant_of: template.pk, trackable: true }));
      const secondVariant = await parts.createOrFail(newPart({ variant_of: template.pk, trackable: true }));
      await stockItems.createOrFail(newStockItem(firstVariant.pk, { serial_numbers: DUPLICATE_SERIAL }));
      stockItems.trackPart(secondVariant.pk);
      return { secondVariant };
    });

    const form = await test.step('Open V2 > Stock > Add Stock Item', async () => {
      await partDetail.goto(secondVariant.pk);
      return await partDetail.openAddStockItemForm();
    });

    await test.step(`Enter quantity 1 and serial number ${DUPLICATE_SERIAL}, then submit`, async () => {
      await form.fill({ quantity: 1, serialNumbers: DUPLICATE_SERIAL });
      await form.submit();
    });

    // How the rejection is shown is open (OQ-ATTR-04); the business result is that no stock is created.
    await test.step(`Check V2 has no stock item with serial ${DUPLICATE_SERIAL}`, async () => {
      const stock = await stockItems.listOrFail({ part: secondVariant.pk, serial: DUPLICATE_SERIAL });
      expect(stock.count).toBe(0);
    });
  });

  test('UI-ATTR-012: mark a part inactive', { tag: '@smoke' }, async ({ parts, stockItems, partDetail }) => {
    const part = await test.step('Setup: active part with one stock item', async () => {
      const part = await parts.createOrFail(newPart({ active: true }));
      await stockItems.createOrFail(newStockItem(part.pk));
      return part;
    });

    const form = await test.step('Open the part > Part Actions > Edit', async () => {
      await partDetail.goto(part.pk);
      return await partDetail.openEditForm();
    });

    const response = await test.step('Turn Active off and submit', async () => {
      await form.setActive(false);
      return await form.submit();
    });

    await test.step('Reload the detail page', async () => {
      expect(response.status()).toBe(200);
      await partDetail.reload();
    });

    await test.step('Check the part still opens, Active is off, and its stock item still exists', async () => {
      await expect(partDetail.title(part.name)).toBeVisible();
      await expect(partDetail.detail('Active')).toHaveText('No');
      expect((await parts.getOrFail(part.pk)).active).toBe(false);
      expect((await stockItems.listOrFail({ part: part.pk })).count).toBe(1);
    });
  });

  test.fixme('UI-ATTR-013: inactive part restrictions (blocked by OQ-ATTR-05)', async () => {});

  test('UI-ATTR-016: delete an inactive part', async ({ parts, categories, partDetail, partsList }) => {
    const { category, part } = await test.step('Setup: inactive part in a category', async () => {
      const category = await categories.createOrFail(newCategory());
      const part = await parts.createOrFail(newPart({ category: category.pk, active: false }));
      return { category, part };
    });

    const dialog = await test.step('Open the part > Part Actions > Delete', async () => {
      await partDetail.goto(part.pk);
      return await partDetail.openDeleteDialog(part.pk);
    });

    const response = await test.step('Confirm the deletion', async () => {
      return await dialog.confirm();
    });

    await test.step('Open the category parts list and search for the part', async () => {
      expect(response.status()).toBe(204);
      await partsList.goto(category.pk);
      await partsList.search(part.name);
    });

    await test.step('Check the part is deleted and not listed in the category', async () => {
      await expect(partsList.row(part.name)).toHaveCount(0);
      expect((await parts.get(part.pk)).status()).toBe(404);
    });
  });

  test('UI-ATTR-017: a locked part cannot be deleted', async ({ parts, settings, partDetail }) => {
    const lockingEnabled = await test.step('Precondition: GET /api/settings/global/PART_ENABLE_LOCKING/', async () => {
      return await settings.isEnabledOrFail('PART_ENABLE_LOCKING');
    });
    test.skip(!lockingEnabled, 'UI-ATTR-017 needs part locking (PART_ENABLE_LOCKING), which is disabled on this instance');

    const part = await test.step('Setup: inactive, locked part with no stock', async () => {
      return await parts.createOrFail(newPart({ active: false, locked: true }));
    });

    const dialog = await test.step('Open the part > Part Actions > Delete', async () => {
      await partDetail.goto(part.pk);
      return await partDetail.openDeleteDialog(part.pk);
    });

    // How the restriction is shown is open (OQ-TAB-07); the business result is that the part remains.
    await test.step('Confirm the deletion', async () => {
      await dialog.confirm();
    });

    await test.step('Reload the detail page and check the part still exists', async () => {
      await partDetail.goto(part.pk);
      await expect(partDetail.title(part.name)).toBeVisible();
      expect((await parts.get(part.pk)).status()).toBe(200);
    });
  });
});
