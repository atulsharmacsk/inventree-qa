import type { Part } from '../src/models/part';
import { newCategory, newPart, partFormInput } from '../src/data/factories';
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

  test.fixme('UI-CREATE-009: create a part with initial stock (blocked: Create Initial Stock setting is disabled on the local instance)', async () => {});

  test.fixme('UI-IMPORT-007: import with a category that does not exist (blocked by OQ-CREATE-05)', async () => {});

  // READER lacks the Part create and change permissions this case requires, so it needs its own role.
  test.fixme('UI-IMPORT-008: import is not permitted for a non-staff user (blocked by OQ-CREATE-06; needs a non-staff role with Part create and change permission)', async () => {});
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
