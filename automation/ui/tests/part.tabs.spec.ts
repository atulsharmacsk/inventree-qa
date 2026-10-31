import { PART_MODEL_TYPE, type Part } from '../src/models/part';
import { newParameterTemplate, newPart, newStockItem, newStockLocation, uniqueName } from '../src/data/factories';
import { expect, test } from './fixtures';

// Manual cases: test-cases/ui/part-detail-tabs.md

// A status the server gives new stock by default (docs:stock/status/).
const DEFAULT_STOCK_STATUS = 'OK';

test.describe('Part detail view tabs', () => {
  test.use({ role: 'SUPERUSER' });

  test.describe('Stock', () => {
    test("UI-TAB-005: the Stock tab lists the part's stock items", async ({ parts, stockItems, stockLocations, partDetail }) => {
      const { part, stock } = await test.step('Setup: part with two stock items in different locations', async () => {
        const part = await parts.createOrFail(newPart());
        const first = await stockLocations.createOrFail(newStockLocation());
        const second = await stockLocations.createOrFail(newStockLocation());
        const stock = [
          { location: first, quantity: 7 },
          { location: second, quantity: 13 },
        ];
        for (const { location, quantity } of stock) {
          await stockItems.createOrFail(newStockItem(part.pk, { location: location.pk, quantity }));
        }
        return { part, stock };
      });

      await test.step('Open the part > Stock tab', async () => {
        await partDetail.goto(part.pk);
        await partDetail.openTab('Stock');
        await partDetail.waitForTable('Stock');
      });

      for (const { location, quantity } of stock) {
        await test.step(`Check the item in ${location.name} shows quantity ${quantity} and status ${DEFAULT_STOCK_STATUS}`, async () => {
          const row = partDetail.tableRows('Stock', location.name);
          await expect(row).toHaveCount(1);
          await expect(row.getByRole('cell', { name: String(quantity), exact: true })).toBeVisible();
          await expect(row).toContainText(DEFAULT_STOCK_STATUS);
        });
      }
    });

    test('UI-TAB-006: create a stock item from the Stock tab', async ({ parts, stockItems, stockLocations, partDetail }) => {
      const { part, location } = await test.step('Setup: part without stock and a location', async () => {
        const part = await parts.createOrFail(newPart());
        const location = await stockLocations.createOrFail(newStockLocation());
        stockItems.trackPart(part.pk);
        return { part, location };
      });
      const quantity = 5;

      const form = await test.step('Open the part > Stock > Add Stock Item', async () => {
        await partDetail.goto(part.pk);
        return await partDetail.openAddStockItemForm();
      });

      const response = await test.step(`Enter quantity ${quantity} and location ${location.name}, then submit`, async () => {
        await form.fill({ quantity, location: location.name });
        return await form.submit();
      });

      await test.step('Check the server saved the item with the entered quantity and location', async () => {
        expect(response.status()).toBe(201);
        await expect(form.dialog).toBeHidden();
        const stock = await stockItems.listOrFail({ part: part.pk });
        expect(stock.results.map(({ quantity, location }) => ({ quantity, location }))).toEqual([{ quantity, location: location.pk }]);
      });

      // Local 1.6.3 opens the new stock item's page after submit, so return to the part.
      await test.step('Open the part > Stock tab', async () => {
        await partDetail.goto(part.pk);
        await partDetail.openTab('Stock');
        await partDetail.waitForTable('Stock');
      });

      await test.step('Check the item is listed in the Stock tab with the entered quantity and location', async () => {
        const row = partDetail.tableRows('Stock', location.name);
        await expect(row).toHaveCount(1);
        await expect(row.getByRole('cell', { name: String(quantity), exact: true })).toBeVisible();
      });
    });

    test('UI-TAB-009: template stock includes variant stock', async ({ parts, stockItems, partDetail }) => {
      const { template, variants } =
        await test.step('Setup: template with two variants, each with stock; the template has none', async () => {
          const template = await parts.createOrFail(newPart({ is_template: true }));
          const variants = [
            { part: await parts.createOrFail(newPart({ variant_of: template.pk })), quantity: 4 },
            { part: await parts.createOrFail(newPart({ variant_of: template.pk })), quantity: 6 },
          ];
          for (const { part, quantity } of variants) {
            await stockItems.createOrFail(newStockItem(part.pk, { quantity }));
          }
          return { template, variants };
        });

      await test.step('Open the template > Stock tab', async () => {
        await partDetail.goto(template.pk);
        await partDetail.openTab('Stock');
        await partDetail.waitForTable('Stock');
      });

      for (const { part, quantity } of variants) {
        await test.step(`Check the template's stock lists ${part.name} with quantity ${quantity}`, async () => {
          const row = partDetail.tableRows('Stock', part.name);
          await expect(row).toHaveCount(1);
          await expect(row.getByRole('cell', { name: String(quantity), exact: true })).toBeVisible();
        });
      }
    });
  });

  test.describe('Bill of Materials', () => {
    test('UI-TAB-011: add a BOM item in editing mode', async ({ parts, bomItems, partDetail }) => {
      const { assembly, component } = await test.step('Setup: assembly part and component part', async () => {
        const assembly = await parts.createOrFail(newPart({ assembly: true }));
        const component = await parts.createOrFail(newPart({ component: true }));
        return { assembly, component };
      });
      const quantity = 3;

      const form = await test.step('Open the assembly > BOM tab > Edit BOM > Add BOM Item', async () => {
        await partDetail.goto(assembly.pk);
        return await partDetail.openAddBomItemForm();
      });

      const response = await test.step(`Select ${component.name}, enter quantity ${quantity}, and submit`, async () => {
        await form.fill({ component: component.name, quantity });
        return await form.submit();
      });

      await test.step('Check the component is listed in the BOM with the entered quantity', async () => {
        expect(response.status()).toBe(201);
        await expect(form.dialog).toBeHidden();
        await partDetail.waitForTable('Bill of Materials');
        const row = partDetail.tableRows('Bill of Materials', component.name);
        await expect(row).toHaveCount(1);
        await expect(row.getByRole('cell', { name: String(quantity), exact: true })).toBeVisible();
        const bom = await bomItems.listOrFail(assembly.pk);
        expect(bom.results.map(({ sub_part, quantity }) => ({ sub_part, quantity }))).toEqual([{ sub_part: component.pk, quantity }]);
      });
    });

    test('UI-TAB-013: BOM of a locked assembly cannot be changed', async ({ parts, bomItems, settings, partDetail }) => {
      const lockingEnabled = await test.step('Precondition: GET /api/settings/global/PART_ENABLE_LOCKING/', async () => {
        return await settings.isEnabledOrFail('PART_ENABLE_LOCKING');
      });
      test.skip(!lockingEnabled, 'UI-TAB-013 needs part locking (PART_ENABLE_LOCKING), which is disabled on this instance');
      const quantity = 2;

      const { assembly, component } =
        await test.step(`Setup: assembly with one BOM line (quantity ${quantity}), then PATCH locked=true`, async () => {
          const assembly = await parts.createOrFail(newPart({ assembly: true }));
          const component = await parts.createOrFail(newPart({ component: true }));
          await bomItems.createOrFail({ part: assembly.pk, sub_part: component.pk, quantity });
          await parts.updateOrFail(assembly.pk, { locked: true });
          return { assembly, component };
        });

      await test.step('Open the assembly > BOM tab', async () => {
        await partDetail.goto(assembly.pk);
        await partDetail.openTab('Bill of Materials');
        await partDetail.waitForTable('Bill of Materials');
      });

      await test.step('Check the "Part is Locked" alert is shown and add, edit, and delete are not offered', async () => {
        await expect(partDetail.lockedAlert('Bill of Materials')).toBeVisible();
        await expect(partDetail.tableRows('Bill of Materials', component.name)).toHaveCount(1);
        await expect(partDetail.editBomButton()).toHaveCount(0);
        await expect(partDetail.rowActionMenus('Bill of Materials', component.name)).toHaveCount(0);
      });

      await test.step('Check the BOM still has its original single line', async () => {
        const bom = await bomItems.listOrFail(assembly.pk);
        expect(bom.results.map(({ sub_part, quantity }) => ({ sub_part, quantity }))).toEqual([{ sub_part: component.pk, quantity }]);
      });
    });
  });

  test.describe('Parameters', () => {
    test('UI-TAB-015: add a parameter to a part', async ({ parts, parameters, partDetail }) => {
      const { part, template } = await test.step('Setup: part and a parameter template without units', async () => {
        const part = await parts.createOrFail(newPart());
        const template = await parameters.createTemplateOrFail(newParameterTemplate());
        return { part, template };
      });
      const value = uniqueName('value');

      const form = await test.step('Open the part > Parameters > Add Parameters > Create Parameter', async () => {
        await partDetail.goto(part.pk);
        return await partDetail.openAddParameterForm();
      });

      const response = await test.step(`Select ${template.name}, enter ${value} in Data, and submit`, async () => {
        await form.fill({ template: template.name, data: value });
        return await form.submit();
      });

      await test.step('Check the parameter is listed in the Parameters tab with the entered value', async () => {
        expect(response.status()).toBe(201);
        await expect(form.dialog).toBeHidden();
        await partDetail.waitForTable('Parameters');
        const row = partDetail.tableRows('Parameters', template.name);
        await expect(row).toHaveCount(1);
        await expect(row).toContainText(value);
        const saved = await parameters.listOrFail({ model_type: PART_MODEL_TYPE, model_id: part.pk });
        expect(saved.results.map(({ template, data }) => ({ template, data }))).toEqual([{ template: template.pk, data: value }]);
      });
    });

    test('UI-TAB-018: parameters of a locked part cannot be changed', async ({ parts, parameters, settings, partDetail }) => {
      const lockingEnabled = await test.step('Precondition: GET /api/settings/global/PART_ENABLE_LOCKING/', async () => {
        return await settings.isEnabledOrFail('PART_ENABLE_LOCKING');
      });
      test.skip(!lockingEnabled, 'UI-TAB-018 needs part locking (PART_ENABLE_LOCKING), which is disabled on this instance');
      const value = uniqueName('value');

      const { part, template } = await test.step(`Setup: part with one parameter (${value}), then PATCH locked=true`, async () => {
        const part = await parts.createOrFail(newPart());
        const template = await parameters.createTemplateOrFail(newParameterTemplate());
        await parameters.createOrFail({
          model_type: PART_MODEL_TYPE,
          model_id: part.pk,
          template: template.pk,
          data: value,
        });
        await parts.updateOrFail(part.pk, { locked: true });
        return { part, template };
      });

      await test.step('Open the part > Parameters tab', async () => {
        await partDetail.goto(part.pk);
        await partDetail.openTab('Parameters');
        await partDetail.waitForTable('Parameters');
      });

      await test.step('Check the "Part is Locked" alert is shown and add, edit, and delete are not offered', async () => {
        await expect(partDetail.lockedAlert('Parameters')).toBeVisible();
        await expect(partDetail.tableRows('Parameters', template.name)).toHaveCount(1);
        await expect(partDetail.addParametersMenu()).toHaveCount(0);
        await expect(partDetail.rowActionMenus('Parameters', template.name)).toHaveCount(0);
      });

      await test.step('Check the part still has its original parameter and value', async () => {
        const saved = await parameters.listOrFail({ model_type: PART_MODEL_TYPE, model_id: part.pk });
        expect(saved.results.map(({ template, data }) => ({ template, data }))).toEqual([{ template: template.pk, data: value }]);
      });
    });
  });

  test.describe('Variants', () => {
    test('UI-TAB-019: create a variant from the Variants tab', async ({ parts, partDetail }) => {
      const template = await test.step('Setup: template part', async () => {
        return await parts.createOrFail(newPart({ is_template: true }));
      });
      const variantName = uniqueName('pw-ui-variant');

      const form = await test.step('Open the template > Variants > Add Parts > Create Part', async () => {
        await partDetail.goto(template.pk);
        return await partDetail.openCreateVariantForm();
      });

      const response = await test.step(`Enter the name ${variantName} and submit`, async () => {
        await form.fill({ name: variantName });
        return await form.submit();
      });

      const variant = await test.step('Check the part is saved as a variant of the template', async () => {
        expect(response.status()).toBe(201);
        const created = (await response.json()) as Part;
        parts.track(created.pk);
        expect(created.variant_of).toBe(template.pk);
        return created;
      });

      await test.step('Open the template > Variants tab and check the variant is listed', async () => {
        await partDetail.goto(template.pk);
        await partDetail.openTab('Variants');
        await partDetail.waitForTable('Variants');
        await expect(partDetail.tableRows('Variants', variant.name)).toHaveCount(1);
      });
    });
  });
});
