import type { Part } from '../src/models/part';
import { newCategory, newParameterTemplate, newStockLocation, partFormInput } from '../src/data/factories';
import { PART_MODEL_TYPE } from '../src/models/part';
import { expect, test } from './fixtures';

// Manual cases: test-cases/ui/part-creation.md

test.describe('Cross-functional flow', () => {
  test.use({ role: 'SUPERUSER' });

  test('UI-CREATE-015: create a part, add a parameter and stock, verify in the category', { tag: '@smoke' }, async ({
    page,
    parts,
    categories,
    stockLocations,
    stockItems,
    parameters,
    partsList,
    partDetail,
  }) => {
    // The flow crosses four pages and three forms, which exceeds the default 30 s.
    test.setTimeout(120_000);

    const { parent, child, location, template } = await test.step('Setup: parent and sub-category, stock location, parameter template (mm)', async () => {
      const parent = await categories.createOrFail(newCategory());
      const child = await categories.createOrFail(newCategory({ parent: parent.pk }));
      const location = await stockLocations.createOrFail(newStockLocation());
      const template = await parameters.createTemplateOrFail(newParameterTemplate({ units: 'mm' }));
      return { parent, child, location, template };
    });
    const input = partFormInput();
    const partName = input.name ?? '';
    const value = '25';
    const quantity = 10;

    const created = await test.step('Open Parts > Add Parts > Create Part, enter name, description, and sub-category, then submit', async () => {
      await partsList.goto();
      const form = await partsList.openCreatePartForm();
      await form.fill(input);
      await form.selectCategory(child.name);
      const response = await form.submit();
      expect(response.status()).toBe(201);
      const part = (await response.json()) as Part;
      parts.track(part.pk);
      return part;
    });

    await test.step('Check the browser opens the new part\'s detail page', async () => {
      await expect(page).toHaveURL(new RegExp(`/web/part/${created.pk}/`));
      await expect(partDetail.title(partName)).toBeVisible();
    });

    await test.step(`Open Parameters > New Parameter, select ${template.name}, enter ${value}, and submit`, async () => {
      const form = await partDetail.openAddParameterForm();
      await form.fill({ template: template.name, data: value });
      const response = await form.submit();
      expect(response.status()).toBe(201);
      await expect(form.dialog).toBeHidden();
    });

    await test.step('Check the Parameters tab lists the template with the entered value', async () => {
      const row = partDetail.tableRows('Parameters', template.name);
      await expect(row).toHaveCount(1);
      await expect(row).toContainText(value);
      const saved = await parameters.listOrFail({ model_type: PART_MODEL_TYPE, model_id: created.pk });
      expect(saved.results.map(({ template, data }) => ({ template, data }))).toEqual([{ template: template.pk, data: value }]);
    });

    await test.step(`Open Stock > New Stock Item, enter quantity ${quantity} and location ${location.name}, and submit`, async () => {
      stockItems.trackPart(created.pk);
      const form = await partDetail.openAddStockItemForm();
      await form.fill({ quantity, location: location.name });
      const response = await form.submit();
      expect(response.status()).toBe(201);
      await expect(form.dialog).toBeHidden();
    });

    await test.step('Check the Stock tab lists the item with the entered quantity and location', async () => {
      // Local 1.6.3 opens the new stock item's page after submit, so return to the part.
      await partDetail.goto(created.pk);
      await partDetail.openTab('Stock');
      const row = partDetail.tableRows('Stock', location.name);
      await expect(row).toHaveCount(1);
      await expect(row.getByRole('cell', { name: String(quantity), exact: true })).toBeVisible();
    });

    for (const category of [child, parent]) {
      await test.step(`Open the parts list of ${category.name} and check the part row`, async () => {
        await partsList.goto(category.pk);
        await partsList.search(partName);
        const row = partsList.row(partName);
        await expect(row).toHaveCount(1);
        await expect(row).toContainText(input.description ?? '');
        await expect(row).toContainText(child.name);
        await expect(row.getByRole('cell', { name: String(quantity), exact: true })).toBeVisible();
      });
    }
  });
});
