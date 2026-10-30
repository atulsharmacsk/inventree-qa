import { checkCategoryList, checkCategoryShape, checkCategoryTreeList } from '../src/checks';
import type { Category, CategoryTreeItem, Page } from '../../shared/models';
import { newCategory } from '../src/test-data';
import { expect, test } from './fixtures';

// Manual cases: test-cases/api/categories-crud.md

const pksOf = (page: Page<Category>): number[] => page.results.map((category) => category.pk);

test.describe('Part Categories CRUD', () => {
  test.use({ role: 'SUPERUSER' });

  test.describe('Create', () => {
    test('API-CAT-001: create a category with only a name', { tag: '@smoke' }, async ({ categories }) => {
      const categoryToCreate = newCategory();

      const response = await test.step('POST /api/part/category/ with only a name', async () => {
        return await categories.create(categoryToCreate);
      });

      await test.step('Check it was created with the given name', async () => {
        expect(response.status()).toBe(201);
        const category = await response.json();
        checkCategoryShape(category);
        expect(category.name).toBe(categoryToCreate.name);
      });
    });

    test('API-CAT-002: create a category with optional writable fields', async ({ categories }) => {
      const categoryToCreate = newCategory({
        description: 'Created by API-CAT-002',
        default_keywords: 'playwright api',
        structural: false,
      });

      const response = await test.step('POST /api/part/category/ with description, default_keywords, structural', async () => {
        return await categories.create(categoryToCreate);
      });

      await test.step('Check every field we sent comes back', async () => {
        expect(response.status()).toBe(201);
        const category = await response.json();
        checkCategoryShape(category);
        expect(category).toMatchObject(categoryToCreate);
      });
    });

    test('API-CAT-003: create a sub-category', { tag: '@smoke' }, async ({ categories }) => {
      const parent = await test.step('Setup: POST /api/part/category/ for the parent', async () => {
        return await categories.createOrFail(newCategory());
      });

      const response = await test.step('POST /api/part/category/ with parent', async () => {
        return await categories.create(newCategory({ parent: parent.pk }));
      });

      const child = await test.step('Check the new category points to its parent', async () => {
        expect(response.status()).toBe(201);
        const created = (await response.json()) as Category;
        checkCategoryShape(created);
        expect(created.parent).toBe(parent.pk);
        return created;
      });

      await test.step('GET /api/part/category/?parent={id} lists the sub-category', async () => {
        const response = await categories.list({ parent: parent.pk });
        expect(response.status()).toBe(200);
        const subCategories = (await response.json()) as Page<Category>;
        checkCategoryList(subCategories);
        expect(pksOf(subCategories)).toContain(child.pk);
      });
    });

    test('API-CAT-004: create a structural category', async ({ categories }) => {
      const response = await test.step('POST /api/part/category/ with structural=true', async () => {
        return await categories.create(newCategory({ structural: true }));
      });

      const created = await test.step('Check the response has structural=true', async () => {
        expect(response.status()).toBe(201);
        const category = (await response.json()) as Category;
        checkCategoryShape(category);
        expect(category.structural).toBe(true);
        return category;
      });

      await test.step('GET /api/part/category/{id}/ still has structural=true', async () => {
        const stored = await categories.getOrFail(created.pk);
        expect(stored.structural).toBe(true);
      });
    });
  });

  test.describe('Read', () => {
    test('API-CAT-005: retrieve a category by ID', async ({ categories }) => {
      const categoryToCreate = newCategory({ description: 'Created by API-CAT-005' });
      const created = await test.step('Setup: POST /api/part/category/', async () => {
        return await categories.createOrFail(categoryToCreate);
      });

      const response = await test.step('GET /api/part/category/{id}/', async () => {
        return await categories.get(created.pk);
      });

      await test.step('Check the stored values', async () => {
        expect(response.status()).toBe(200);
        const category = await response.json();
        checkCategoryShape(category);
        expect(category).toMatchObject({ pk: created.pk, ...categoryToCreate });
      });
    });

    test('API-CAT-007: list and search categories', async ({ categories }) => {
      const created = await test.step('Setup: POST /api/part/category/ with a unique name', async () => {
        return await categories.createOrFail(newCategory());
      });

      const response = await test.step('GET /api/part/category/?search={name}', async () => {
        return await categories.list({ search: created.name });
      });

      await test.step('Check it is a paginated list that contains the category', async () => {
        expect(response.status()).toBe(200);
        const list = (await response.json()) as Page<Category>;
        checkCategoryList(list);
        expect(pksOf(list)).toContain(created.pk);
      });
    });

    test('API-CAT-008: category tree includes a new category', async ({ categories }) => {
      const child = await test.step('Setup: POST /api/part/category/ for a parent and a sub-category', async () => {
        const parent = await categories.createOrFail(newCategory());
        return await categories.createOrFail(newCategory({ parent: parent.pk }));
      });

      const response = await test.step('GET /api/part/category/tree/?search={name}', async () => {
        return await categories.tree(child.name);
      });

      await test.step('Check the tree contains the sub-category with its parent', async () => {
        expect(response.status()).toBe(200);
        const tree = (await response.json()) as Page<CategoryTreeItem>;
        checkCategoryTreeList(tree);
        const item = tree.results.find((node) => node.pk === child.pk);
        expect(item).toMatchObject({ pk: child.pk, name: child.name, parent: child.parent });
      });
    });
  });

  test.describe('Update', () => {
    test('API-CAT-009: partially update a category', async ({ categories }) => {
      const created = await test.step('Setup: POST /api/part/category/ for a parent and a sub-category', async () => {
        const parent = await categories.createOrFail(newCategory());
        return await categories.createOrFail(newCategory({ parent: parent.pk, description: 'Old description' }));
      });

      const response = await test.step('PATCH /api/part/category/{id}/ with a new description', async () => {
        return await categories.update(created.pk, { description: 'New description' });
      });

      await test.step('Check the description changed and name and parent did not', async () => {
        expect(response.status()).toBe(200);
        checkCategoryShape(await response.json());
        const category = await categories.getOrFail(created.pk);
        expect(category.description).toBe('New description');
        expect(category.name).toBe(created.name);
        expect(category.parent).toBe(created.parent);
      });
    });

    test('API-CAT-010: fully update a category', async ({ categories }) => {
      const created = await test.step('Setup: POST /api/part/category/', async () => {
        return await categories.createOrFail(newCategory({ description: 'Old description' }));
      });
      const replacement = newCategory({ description: 'Replaced by API-CAT-010' });

      const response = await test.step('PUT /api/part/category/{id}/ with a new name and description', async () => {
        return await categories.replace(created.pk, replacement);
      });

      await test.step('Check the category now has the new values', async () => {
        expect(response.status()).toBe(200);
        checkCategoryShape(await response.json());
        const category = await categories.getOrFail(created.pk);
        expect(category).toMatchObject(replacement);
      });
    });

    test('API-CAT-011: move a category to another parent', async ({ categories }) => {
      const { oldParent, newParent, child } = await test.step('Setup: categories A and B, and C under A', async () => {
        const oldParent = await categories.createOrFail(newCategory());
        const newParent = await categories.createOrFail(newCategory());
        const child = await categories.createOrFail(newCategory({ parent: oldParent.pk }));
        return { oldParent, newParent, child };
      });

      const response = await test.step('PATCH /api/part/category/{C}/ with parent=B', async () => {
        return await categories.update(child.pk, { parent: newParent.pk });
      });

      await test.step('Check C now has parent B', async () => {
        expect(response.status()).toBe(200);
        const moved = await categories.getOrFail(child.pk);
        expect(moved.parent).toBe(newParent.pk);
      });

      await test.step('GET /api/part/category/?parent={B} lists C and ?parent={A} does not', async () => {
        const underNewParent = await categories.listOrFail({ parent: newParent.pk });
        const underOldParent = await categories.listOrFail({ parent: oldParent.pk });
        expect(pksOf(underNewParent)).toContain(child.pk);
        expect(pksOf(underOldParent)).not.toContain(child.pk);
      });
    });

    test('API-CAT-012: move a sub-category to the top level', async ({ categories }) => {
      const child = await test.step('Setup: category A, and C under A', async () => {
        const parent = await categories.createOrFail(newCategory());
        return await categories.createOrFail(newCategory({ parent: parent.pk }));
      });

      const response = await test.step('PATCH /api/part/category/{C}/ with parent=null', async () => {
        return await categories.update(child.pk, { parent: null });
      });

      await test.step('Check C has no parent', async () => {
        expect(response.status()).toBe(200);
        const moved = await categories.getOrFail(child.pk);
        expect(moved.parent).toBeNull();
      });

      await test.step('GET /api/part/category/?top_level=true&search={C name} lists C', async () => {
        const topLevel = await categories.listOrFail({ top_level: true, search: child.name });
        expect(pksOf(topLevel)).toContain(child.pk);
      });
    });

    test.fixme('API-CAT-013: reject a category as its own parent (blocked by OQ-ACAT-02)', async () => {});
    test.fixme('API-CAT-013: reject a category under its own child (blocked by OQ-ACAT-02)', async () => {});
  });

  test.describe('Delete', () => {
    test.fixme('API-CAT-014: delete an empty category (blocked by OQ-ACAT-03)', async () => {});
    test.fixme('API-CAT-015: delete a category that has a sub-category and a part (blocked by OQ-ACAT-03)', async () => {});
    test.fixme('API-CAT-016: operations on a category that does not exist (blocked by OQ-ACAT-01)', async () => {});
  });
});
