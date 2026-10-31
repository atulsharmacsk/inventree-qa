import type { Part } from '../src/models/part';
import { newCategory, newPart, partFormInput, partImportCsv, uniqueName } from '../src/data/factories';
import { expect, test } from './fixtures';

// Manual cases: test-cases/ui/part-creation.md

test.describe('Part creation', () => {
  test.use({ role: 'SUPERUSER' });

  test('UI-CREATE-001: create a part with valid details', { tag: '@smoke' }, async ({ page, parts, categories, partsList, partDetail }) => {
    const category = await test.step('Setup: POST /api/part/category/', async () => {
      return await categories.createOrFail(newCategory());
    });
    const input = partFormInput();

    const form = await test.step('Open Parts > Add Parts > Create Part', async () => {
      await partsList.goto();
      return await partsList.openCreatePartForm();
    });

    const response = await test.step('Enter name, description, and category, then submit', async () => {
      await form.fill(input);
      await form.selectCategory(category.name);
      return await form.submit();
    });

    await test.step('Check the part was saved and the detail page shows the entered values', async () => {
      expect(response.status()).toBe(201);
      const created = (await response.json()) as Part;
      parts.track(created.pk);
      await expect(page).toHaveURL(new RegExp(`/web/part/${created.pk}/`));
      await expect(partDetail.title(input.name ?? '')).toBeVisible();
      await expect(partDetail.detail('Description')).toHaveText(input.description ?? '');
      await expect(partDetail.detail('Category')).toContainText(category.name);
    });
  });

  test('UI-CREATE-003: new part appears in its category and parent category', async ({ parts, categories, partsList }) => {
    const { parent, child, part } = await test.step('Setup: parent and sub-category, part in the sub-category', async () => {
      const parent = await categories.createOrFail(newCategory());
      const child = await categories.createOrFail(newCategory({ parent: parent.pk }));
      const part = await parts.createOrFail(newPart({ category: child.pk }));
      return { parent, child, part };
    });

    await test.step(`Open the sub-category parts list and search for the part`, async () => {
      await partsList.goto(child.pk);
      await partsList.search(part.name);
    });

    await test.step('Check the part is listed in the sub-category', async () => {
      await expect(partsList.row(part.name)).toHaveCount(1);
    });

    await test.step('Open the parent category parts list and search for the part', async () => {
      await partsList.goto(parent.pk);
      await partsList.search(part.name);
    });

    await test.step('Check the part is listed in the parent category', async () => {
      await expect(partsList.row(part.name)).toHaveCount(1);
    });
  });

  test('UI-CREATE-005: submit an empty Create Part form', async ({ partsList }) => {
    const form = await test.step('Open Parts > Add Parts > Create Part', async () => {
      await partsList.goto();
      return await partsList.openCreatePartForm();
    });

    const response = await test.step('Submit without entering any values', async () => {
      return await form.submit();
    });

    await test.step('Check the form is rejected, errors are shown, and no part is created', async () => {
      expect(response.status()).toBe(400);
      await expect(form.formError).toBeVisible();
      await expect(form.textField('name')).toHaveAttribute('aria-invalid', 'true');
      await expect(form.requiredFieldError).toBeVisible();
      await expect(form.dialog).toBeVisible();
    });
  });

  // UI-CREATE-009 is in part.settings.spec.ts, because it switches the Initial Stock Data setting on.

  test('UI-IMPORT-007: import with a category that does not exist', async ({ parts, categories, partsList, importer, importSessions }) => {
    const { valid, invalid } =
      await test.step('Setup: a category, and a CSV row in it plus a row with a category that does not exist', async () => {
        const category = await categories.createOrFail(newCategory());
        return {
          valid: { name: uniqueName('pw-ui-import-ok'), category: category.name },
          invalid: { name: uniqueName('pw-ui-import-bad'), category: uniqueName('pw-ui-missing-category') },
        };
      });

    await test.step('Open Parts > Add Parts > Import from File, upload the CSV, and submit', async () => {
      await partsList.goto();
      expect(await partsList.canImportFromFile()).toBe(true);
      const form = await partsList.openImportForm();
      await form.upload(partImportCsv([valid, invalid]));
      const response = await form.submit();
      expect(response.status()).toBe(201);
      importSessions.track(((await response.json()) as { pk: number }).pk);
    });

    await test.step('Accept the suggested column mapping and wait for the rows', async () => {
      await importer.acceptMapping(invalid.name);
    });

    await test.step('Check the row with the unknown category is in error, with a category error', async () => {
      const row = importer.row(invalid.name);
      await expect(importer.errorIcon(row)).toBeVisible();
      const errors = await importer.openRowErrors(row);
      await expect(errors).toContainText('Row contains errors');
      await expect(errors).toContainText('category:');
    });

    await test.step('Check the row with the existing category has no error', async () => {
      await expect(importer.errorIcon(importer.row(valid.name))).toHaveCount(0);
    });

    await test.step('Check no part was created (rows are not imported until accepted)', async () => {
      expect(await parts.findByName(invalid.name)).toEqual([]);
      expect(await parts.findByName(valid.name)).toEqual([]);
    });
  });
});

test.describe('Part import without staff status', () => {
  test.use({ role: 'ENGINEER' });

  // Expected to fail until InvenTree enforces the documented staff requirement for import; turns red once fixed.
  test.fail(
    'UI-IMPORT-008: import is not permitted for a non-staff user',
    {
      annotation: {
        type: 'issue',
        description:
          'Application finding OQ-CREATE-06 (DEF-13): a non-staff user with Part add and change can create a part import session (201); the docs require staff status',
      },
    },
    async ({ partsList, importSessions }) => {
      const file = partImportCsv();

      const offered = await test.step('Open Parts > Add Parts as a non-staff user with Part create and change', async () => {
        await partsList.goto();
        return await partsList.canImportFromFile();
      });

      const status = await test.step('If Import from File is offered, upload a one-row CSV and submit', async () => {
        if (!offered) return undefined;
        const form = await partsList.openImportForm();
        await form.upload(file);
        const response = await form.submit();
        if (response.status() === 201) importSessions.track(((await response.json()) as { pk: number }).pk);
        return response.status();
      });

      await test.step('Check the user cannot start an import (not offered, or rejected by the server)', async () => {
        expect(status === undefined || status >= 400, `Import from File offered: ${offered}; server status: ${status}`).toBe(true);
      });
    },
  );
});

test.describe('Part creation without create permission', () => {
  test.use({ role: 'READER' });

  test('UI-CREATE-013: no Add Parts menu without create permission', async ({ partsList }) => {
    await test.step('Open the Parts view as a view-only user', async () => {
      await partsList.goto();
    });

    await test.step('Check the Add Parts menu is not available', async () => {
      await expect(partsList.searchInput).toBeVisible();
      await expect(partsList.addPartsMenu).toHaveCount(0);
    });
  });
});
