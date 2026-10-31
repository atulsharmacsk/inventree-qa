import type { Part } from '../../shared/models';
import type { CompanyService } from '../../shared/services/company.service';
import type { OrderService } from '../../shared/services/order.service';
import type { PartService } from '../../shared/services/part.service';
import type { StockLocationService } from '../../shared/services/stock-location.service';
import type { SupplierPartService } from '../../shared/services/supplier-part.service';
import type { ModalFormComponent } from '../src/components/modal-form.component';
import { newCategory, newCustomer, newPart, newStockItem, newStockLocation, newSupplier, uniqueName } from '../src/data/factories';
import type { OrderLineItemsPage } from '../src/pages/order-line-items.page';
import type { PartDetailPage } from '../src/pages/part-detail.page';
import type { StockLocationPage } from '../src/pages/stock-location.page';
import { expect, test } from './fixtures';

// Manual cases: test-cases/ui/part-attributes.md

const DUPLICATE_SERIAL = '100';

type PickerContext = {
  parts: PartService;
  companies: CompanyService;
  supplierParts: SupplierPartService;
  purchaseOrders: OrderService;
  salesOrders: OrderService;
  stockLocations: StockLocationService;
  partDetail: PartDetailPage;
  orderLineItems: OrderLineItemsPage;
  stockLocation: StockLocationPage;
};

/** UI-ATTR-013 rows (OQ-ATTR-05): each form whose part picker hides inactive parts. */
type InactivePickerCase = {
  action: string;
  /** API name of the related field that picks the part. */
  field: string;
  setupStep: string;
  /** Creates the record the form belongs to and returns its id. */
  arrange: (ctx: PickerContext, parts: [inactive: Part, active: Part]) => Promise<number>;
  openStep: string;
  open: (ctx: PickerContext, targetId: number) => Promise<ModalFormComponent>;
};

const INACTIVE_PICKER_CASES: InactivePickerCase[] = [
  {
    action: 'Add BOM Item',
    field: 'sub_part',
    setupStep: 'Setup: assembly part',
    arrange: async ({ parts }) => (await parts.createOrFail(newPart({ assembly: true }))).pk,
    openStep: 'Open the assembly > Bill of Materials > Edit BOM > Add BOM Item',
    open: async ({ partDetail }, assemblyId) => {
      await partDetail.goto(assemblyId);
      return partDetail.openAddBomItemForm();
    },
  },
  {
    action: 'Purchase order Add Line Item',
    field: 'part',
    setupStep: 'Setup: supplier with a supplier part (SKU = part name) for both parts, and a purchase order',
    arrange: async ({ companies, supplierParts, purchaseOrders }, pair) => {
      const supplier = await companies.createOrFail(newSupplier());
      for (const part of pair) await supplierParts.createOrFail({ part: part.pk, supplier: supplier.pk, SKU: part.name });
      return (await purchaseOrders.createOrFail({ supplier: supplier.pk })).pk;
    },
    openStep: 'Open the purchase order > Line Items > Add Line Item',
    open: async ({ orderLineItems }, orderId) => {
      await orderLineItems.goto('po', orderId);
      return orderLineItems.openAddLineItemForm();
    },
  },
  {
    action: 'Sales order Add Line Item',
    field: 'part',
    setupStep: 'Setup: customer and a sales order',
    arrange: async ({ companies, salesOrders }) => {
      const customer = await companies.createOrFail(newCustomer());
      return (await salesOrders.createOrFail({ customer: customer.pk })).pk;
    },
    openStep: 'Open the sales order > Line Items > Add Line Item',
    open: async ({ orderLineItems }, orderId) => {
      await orderLineItems.goto('so', orderId);
      return orderLineItems.openAddLineItemForm();
    },
  },
  {
    action: 'Stock location Add Stock Item',
    field: 'part',
    setupStep: 'Setup: stock location',
    arrange: async ({ stockLocations }) => (await stockLocations.createOrFail(newStockLocation())).pk,
    openStep: 'Open the stock location > Stock Items > Add Stock Item',
    open: async ({ stockLocation }, locationId) => {
      await stockLocation.gotoStockItems(locationId);
      return stockLocation.openAddStockItemForm();
    },
  },
];

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

  for (const row of INACTIVE_PICKER_CASES) {
    test(`UI-ATTR-013: ${row.action} does not offer an inactive part`, async ({
      parts,
      companies,
      supplierParts,
      purchaseOrders,
      salesOrders,
      stockLocations,
      partDetail,
      orderLineItems,
      stockLocation,
    }) => {
      const ctx = {
        parts,
        companies,
        supplierParts,
        purchaseOrders,
        salesOrders,
        stockLocations,
        partDetail,
        orderLineItems,
        stockLocation,
      };

      const { searchText, inactive, active } =
        await test.step('Setup: inactive part and an active control part, both Component, Purchaseable and Salable', async () => {
          const searchText = uniqueName('pw-ui-pick');
          const flags = { component: true, purchaseable: true, salable: true };
          const inactive = await parts.createOrFail(newPart({ name: `${searchText}-inactive`, active: false, ...flags }));
          const active = await parts.createOrFail(newPart({ name: `${searchText}-active`, ...flags }));
          return { searchText, inactive, active };
        });

      const targetId = await test.step(row.setupStep, async () => row.arrange(ctx, [inactive, active]));

      const form = await test.step(row.openStep, async () => row.open(ctx, targetId));

      await test.step(`Search the ${row.field} picker for the shared name prefix`, async () => {
        await form.searchRelated(row.field, searchText);
      });

      // The active control proves the search returned before checking the inactive part is missing.
      await test.step('Check the active part is offered and the inactive part is not', async () => {
        await expect(form.relatedOption(active.name)).toBeVisible();
        await expect(form.relatedOption(inactive.name)).toHaveCount(0);
      });
    });
  }

  // Expected to fail until stock can no longer be added from an inactive part's own page; turns red once fixed.
  test.fail(
    "UI-ATTR-013: the inactive part's Stock tab does not create a stock item",
    {
      annotation: {
        type: 'issue',
        description:
          "Application finding OQ-ATTR-05: Add Stock Item on an inactive part's Stock tab saves a stock item (201), while every part picker hides inactive parts",
      },
    },
    async ({ parts, stockItems, partDetail }) => {
      const part = await test.step('Setup: inactive part with Component, Purchaseable and Salable on, and no stock', async () => {
        const part = await parts.createOrFail(newPart({ active: false, component: true, purchaseable: true, salable: true }));
        stockItems.trackPart(part.pk);
        return part;
      });

      const available = await test.step('Open the inactive part > Stock and check whether Add Stock Item is offered', async () => {
        await partDetail.goto(part.pk);
        return await partDetail.canAddStockItem();
      });

      // Passes whether a fix hides the action or rejects the save, so test.fail reports either fix.
      if (available) {
        await test.step('Add Stock Item with quantity 1 and submit', async () => {
          const form = await partDetail.openAddStockItemForm();
          await form.fill({ quantity: 1 });
          await form.submit();
        });
      }

      await test.step('Check GET /api/stock/?part={id} returns no stock items', async () => {
        expect((await stockItems.listOrFail({ part: part.pk })).count).toBe(0);
      });
    },
  );

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
