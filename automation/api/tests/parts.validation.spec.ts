import { checkCategoryShape, checkPartShape } from '../src/checks';
import type { Category, Part } from '../../shared/models';
import {
  CATEGORY_TEXT_LIMITS,
  MULTI_BYTE_CHARACTER,
  PART_TEXT_LIMITS,
  PART_WRITE_ONLY_FIELDS,
  newCategory,
  newPart,
  textOfLength,
} from '../src/test-data';
import { expect, test } from './fixtures';

// Manual cases: test-cases/api/field-validation.md
// Rejected values have no documented error status (OQ-VAL-01), so those cases stay fixme until it is answered.

test.describe('Field-level validation', () => {
  test.use({ role: 'SUPERUSER' });

  test.describe('Required fields', () => {
    test.fixme('API-VAL-001: create a part without name (blocked by OQ-VAL-01)', async () => {});
    test.fixme('API-VAL-002: create a category without name (blocked by OQ-VAL-01)', async () => {});
    test.fixme('API-VAL-003: empty or whitespace-only name (blocked by OQ-VAL-03)', async () => {});
    test.fixme('API-VAL-004: full update without name (blocked by OQ-VAL-01)', async () => {});
  });

  test.describe('Maximum lengths', () => {
    for (const { field, maxLength } of PART_TEXT_LIMITS) {
      test(`API-VAL-005: part ${field} at its maximum length ${maxLength}`, async ({ parts }) => {
        const value = textOfLength(maxLength);
        const partToCreate = field === 'name' ? newPart({ name: value }) : newPart({ [field]: value });

        const response = await test.step(`POST /api/part/ with a ${maxLength}-character ${field}`, async () => {
          return await parts.create(partToCreate);
        });

        const created = await test.step('Check POST /api/part/ returns 201 and a valid part', async () => {
          expect(response.status()).toBe(201);
          const body = (await response.json()) as Part;
          checkPartShape(body);
          return body;
        });

        await test.step(`Check GET /api/part/{id}/ returns 200 with ${field} exactly as sent`, async () => {
          const readResponse = await parts.get(created.pk);
          expect(readResponse.status()).toBe(200);
          const stored = (await readResponse.json()) as Part;
          checkPartShape(stored);
          expect(stored[field]).toBe(value);
          expect(stored[field]).toHaveLength(maxLength);
        });
      });
    }

    test.fixme('API-VAL-006: part text fields one character over the maximum (blocked by OQ-VAL-01)', async () => {});
    test.fixme('API-VAL-007: over-length value on a partial update (blocked by OQ-VAL-01)', async () => {});

    for (const { field, maxLength } of CATEGORY_TEXT_LIMITS) {
      test(`API-VAL-008: category ${field} at its maximum length ${maxLength}`, async ({ categories }) => {
        const value = textOfLength(maxLength);
        const categoryToCreate = field === 'name' ? newCategory({ name: value }) : newCategory({ [field]: value });

        const response = await test.step(`POST /api/part/category/ with a ${maxLength}-character ${field}`, async () => {
          return await categories.create(categoryToCreate);
        });

        await test.step(`Check GET /api/part/category/{id}/ returns ${field} exactly as sent`, async () => {
          expect(response.status()).toBe(201);
          const created = (await response.json()) as Category;
          checkCategoryShape(created);
          const stored = await categories.getOrFail(created.pk);
          expect(stored[field]).toBe(value);
          expect(stored[field]).toHaveLength(maxLength);
        });
      });
    }

    test.fixme('API-VAL-008: category icon at its maximum length 100 (blocked by OQ-VAL-04)', async () => {});
    test.fixme('API-VAL-009: category text fields one character over the maximum (blocked by OQ-VAL-01)', async () => {});
    test.fixme('API-VAL-010: part link length and format (blocked by OQ-VAL-01)', async () => {});

    test('API-VAL-011: maximum length counts characters, not bytes', async ({ parts }) => {
      const name = textOfLength(100, MULTI_BYTE_CHARACTER);

      const response = await test.step('POST /api/part/ with a 100-character multi-byte name', async () => {
        return await parts.create(newPart({ name }));
      });

      await test.step('Check GET /api/part/{id}/ returns the name exactly as sent', async () => {
        expect(response.status()).toBe(201);
        const created = (await response.json()) as Part;
        checkPartShape(created);
        const stored = await parts.getOrFail(created.pk);
        expect(stored.name).toBe(name);
        expect(stored.name).toHaveLength(100);
      });
    });
  });

  test.describe('Nullable fields', () => {
    test.fixme('API-VAL-012: set nullable part fields to null (blocked by OQ-VAL-05)', async () => {});
    test.fixme('API-VAL-013: null on non-nullable part fields (blocked by OQ-VAL-01)', async () => {});
    test.fixme('API-VAL-014: set nullable category fields to null (blocked by OQ-VAL-05)', async () => {});
    test.fixme('API-VAL-015: null on non-nullable category fields (blocked by OQ-VAL-01)', async () => {});
  });

  test.describe('Read-only and write-only fields', () => {
    test.fixme('API-VAL-016: read-only part fields sent on create are not stored (blocked by OQ-VAL-02)', async () => {});
    test.fixme('API-VAL-017: read-only part fields sent on update do not change the part (blocked by OQ-VAL-02)', async () => {});
    test.fixme('API-VAL-018: read-only category fields sent on update do not change the category (blocked by OQ-VAL-02)', async () => {});

    test('API-VAL-019: write-only part fields are not returned', async ({ parts }) => {
      const response = await test.step('POST /api/part/ with copy_category_parameters=false', async () => {
        return await parts.create(newPart({ copy_category_parameters: false }));
      });

      const created = await test.step('Check the POST response has no write-only fields', async () => {
        expect(response.status()).toBe(201);
        const body = (await response.json()) as Record<string, unknown>;
        checkPartShape(body);
        for (const field of PART_WRITE_ONLY_FIELDS) expect(body, `POST response contains ${field}`).not.toHaveProperty(field);
        return body as unknown as Part;
      });

      await test.step('Check GET /api/part/{id}/ has no write-only fields', async () => {
        const response = await parts.get(created.pk);
        expect(response.status()).toBe(200);
        const body = (await response.json()) as Record<string, unknown>;
        for (const field of PART_WRITE_ONLY_FIELDS) expect(body, `GET response contains ${field}`).not.toHaveProperty(field);
      });
    });
  });

  test.describe('Numeric and related-record limits', () => {
    test.fixme('API-VAL-020: default_expiry minimum (blocked by OQ-VAL-01)', async () => {});
    test.fixme('API-VAL-021: supplier part SKU maximum length (blocked by OQ-VAL-01)', async () => {});
  });
});
