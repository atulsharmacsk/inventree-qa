import { checkPartList, checkPartShape } from '../src/checks';
import { PART_FLAGS } from '../../shared/models';
import { newCategory, newPart, uniqueName } from '../src/test-data';
import { expect, test } from './fixtures';

// Manual cases: test-cases/api/parts-crud.md

test.describe('Parts CRUD', () => {
  test.use({ role: 'SUPERUSER' });

  test('API-PART-001: create a part with only a name', { tag: '@smoke' }, async ({ parts }) => {
    const partToCreate = newPart();

    const response = await test.step('POST /api/part/ with only a name', async () => {
      return await parts.create(partToCreate);
    });

    await test.step('Check it was created with the given name', async () => {
      expect(response.status()).toBe(201);
      const part = await response.json();
      checkPartShape(part);
      expect(part.name).toBe(partToCreate.name);
    });
  });

  test('API-PART-002: create a part with optional fields', async ({ parts, categories }) => {
    const category = await test.step('Setup: POST /api/part/category/', async () => {
      return await categories.createOrFail(newCategory());
    });
    const partToCreate = newPart({
      description: 'Created by API-PART-002',
      IPN: uniqueName('IPN'),
      keywords: 'playwright api',
      units: 'kg',
      category: category.pk,
      minimum_stock: 5,
      maximum_stock: 50,
      assembly: true,
    });

    const response = await test.step('POST /api/part/ with optional fields', async () => {
      return await parts.create(partToCreate);
    });

    await test.step('Check every field we sent comes back', async () => {
      expect(response.status()).toBe(201);
      const part = await response.json();
      checkPartShape(part);
      expect(part).toMatchObject(partToCreate);
    });
  });

  test.fixme('API-PART-003: create a part with initial stock (blocked by OQ-PART-03)', async () => {});

  test('API-PART-005: get a part by ID', { tag: '@smoke' }, async ({ parts }) => {
    const partToCreate = newPart({ description: 'Created by API-PART-005', IPN: uniqueName('IPN') });
    const created = await test.step('Setup: POST /api/part/', async () => {
      return await parts.createOrFail(partToCreate);
    });

    const response = await test.step('GET /api/part/{id}/', async () => {
      return await parts.get(created.pk);
    });

    await test.step('Check the stored values', async () => {
      expect(response.status()).toBe(200);
      const part = await response.json();
      checkPartShape(part);
      expect(part).toMatchObject(partToCreate);
    });
  });

  test('API-PART-007: list parts', async ({ parts }) => {
    await test.step('Setup: POST /api/part/', async () => {
      await parts.createOrFail(newPart());
    });

    const response = await test.step('GET /api/part/ with limit', async () => {
      return await parts.list();
    });

    await test.step('Check it is a paginated list of parts', async () => {
      expect(response.status()).toBe(200);
      checkPartList(await response.json());
    });
  });

  test('API-PART-008: change one field with PATCH', async ({ parts }) => {
    const created = await test.step('Setup: POST /api/part/', async () => {
      return await parts.createOrFail(newPart({ description: 'Old description', IPN: uniqueName('IPN') }));
    });

    const response = await test.step('PATCH /api/part/{id}/ with a new description', async () => {
      return await parts.update(created.pk, { description: 'New description' });
    });

    await test.step('Check the description changed and nothing else did', async () => {
      expect(response.status()).toBe(200);
      const part = await parts.getOrFail(created.pk);
      expect(part.description).toBe('New description');
      expect(part.name).toBe(created.name);
      expect(part.IPN).toBe(created.IPN);
    });
  });

  test('API-PART-009: replace a part with PUT', async ({ parts }) => {
    const created = await test.step('Setup: POST /api/part/', async () => {
      return await parts.createOrFail(newPart({ description: 'Old description' }));
    });
    const replacement = newPart({ description: 'Replaced by API-PART-009' });

    const response = await test.step('PUT /api/part/{id}/ with a new name and description', async () => {
      return await parts.replace(created.pk, replacement);
    });

    await test.step('Check the part now has the new values', async () => {
      expect(response.status()).toBe(200);
      checkPartShape(await response.json());
      const part = await parts.getOrFail(created.pk);
      expect(part).toMatchObject(replacement);
    });
  });

  // One test per flag, for example "API-PART-010: toggle flag active".
  for (const flag of PART_FLAGS) {
    test(`API-PART-010: toggle flag ${flag}`, async ({ parts }) => {
      const created = await test.step('Setup: POST /api/part/', async () => {
        return await parts.createOrFail(newPart());
      });
      const newValue = !created[flag];

      const response = await test.step(`PATCH /api/part/{id}/ with ${flag}=${newValue}`, async () => {
        return await parts.update(created.pk, { [flag]: newValue });
      });

      await test.step(`Check ${flag} is now ${newValue}`, async () => {
        expect(response.status()).toBe(200);
        const part = await parts.getOrFail(created.pk);
        expect(part[flag]).toBe(newValue);
      });
    });
  }

  test.fixme('API-PART-011: delete a part (blocked by OQ-PART-02)', async () => {});
});
