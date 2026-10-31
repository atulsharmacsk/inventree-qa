import { expectPartsListed } from '../src/checks';
import type { Part } from '../../shared/models';
import { newCategory, newPart, newStockLocation, uniqueName } from '../src/test-data';
import { expect, test } from './fixtures';

// Manual cases: test-cases/api/edge-cases.md
// Statuses were confirmed by the user on local 1.6.3 (2026-10-30): 400 for rejected bodies, 401 for missing or invalid credentials, 405 for an unlisted method.
// API-EDGE-005 and 006 are not automated: they need a user whose only Part role is view.

test.describe('Edge cases', () => {
  test.use({ role: 'SUPERUSER' });

  test.describe('Unauthenticated and unauthorized access', () => {
    test('API-EDGE-001: list parts without credentials', async ({ partsWithAuthorization }) => {
      const anonymous = await partsWithAuthorization(null);

      const response = await test.step('GET /api/part/ with no credentials', async () => {
        return await anonymous.list();
      });

      await test.step('Check the request returns 401 and no part data', async () => {
        expect(response.status()).toBe(401);
        expect(await response.json()).not.toHaveProperty('results');
      });
    });

    test('API-EDGE-002: create a part without credentials', async ({ partsWithAuthorization, parts }) => {
      const anonymous = await partsWithAuthorization(null);
      const partToCreate = newPart();

      const response = await test.step('POST /api/part/ with no credentials', async () => {
        return await anonymous.create(partToCreate);
      });

      await test.step('Check the request returns 401 and no part was created', async () => {
        expect(response.status()).toBe(401);
        await expectPartsListed(await parts.listFiltered({ search: partToCreate.name }), []);
      });
    });

    const TOKEN_VARIANTS = [
      { variant: 'an unknown token', header: () => `Token ${uniqueName('pw-unknown')}` },
      { variant: 'a token without the Token prefix', header: () => uniqueName('pw-unprefixed') },
      { variant: 'an empty token', header: () => 'Token ' },
    ];

    for (const { variant, header } of TOKEN_VARIANTS) {
      test(`API-EDGE-003: list parts with ${variant}`, async ({ partsWithAuthorization }) => {
        const client = await partsWithAuthorization(header());

        const response = await test.step('GET /api/part/ with the Authorization header', async () => {
          return await client.list();
        });

        await test.step('Check the request returns 401 and no part data', async () => {
          expect(response.status()).toBe(401);
          expect(await response.json()).not.toHaveProperty('results');
        });
      });
    }

    test('API-EDGE-004: list parts with a revoked token', async ({ partsWithAuthorization, revokedToken }) => {
      const client = await partsWithAuthorization(`Token ${revokedToken}`);

      const response = await test.step('GET /api/part/ with a token that was issued and revoked', async () => {
        return await client.list();
      });

      await test.step('Check the request returns 401 and no part data', async () => {
        expect(response.status()).toBe(401);
        expect(await response.json()).not.toHaveProperty('results');
      });
    });
  });

  test.describe('Invalid payloads', () => {
    // Expected to fail until InvenTree rejects malformed JSON with 400 instead of 500; turns red once fixed.
    test.fail(
      'API-EDGE-007: send a malformed JSON body',
      {
        annotation: {
          type: 'issue',
          description: 'Application finding OQ-EDGE-02: malformed JSON returns 500 (AttributeError) instead of 400',
        },
      },
      async ({ parts }) => {
        const token = uniqueName('pw-edge');

        const response = await test.step('POST /api/part/ with Content-Type application/json and a truncated JSON body', async () => {
          return await parts.createRawJson(`{"name": "${token}"`);
        });

        await test.step('Check the request returns 400 and no part was created', async () => {
          expect(response.status()).toBe(400);
          await expectPartsListed(await parts.listFiltered({ search: token }), []);
        });
      },
    );

    const WRONG_TYPES = [
      { field: 'assembly', value: 'not-a-boolean' },
      { field: 'minimum_stock', value: 'abc' },
      { field: 'category', value: 'abc' },
      { field: 'tags', value: 'not-an-array' },
    ];

    for (const { field, value } of WRONG_TYPES) {
      test(`API-EDGE-008: send a wrong-typed ${field}`, async ({ parts }) => {
        const name = uniqueName('pw-part');

        const response = await test.step(`POST /api/part/ with ${field} set to a value of the wrong type`, async () => {
          return await parts.createInvalid({ name, [field]: value });
        });

        await test.step('Check the request returns 400 and no part was created', async () => {
          expect(response.status()).toBe(400);
          await expectPartsListed(await parts.listFiltered({ search: name }), []);
        });
      });
    }

    test('API-EDGE-009: create a part in a category that does not exist', async ({ parts, categories }) => {
      const missingId = await test.step('Setup: create and delete a category to get an ID that no longer exists', async () => {
        const category = await categories.createOrFail(newCategory());
        expect((await categories.delete(category.pk)).status()).toBe(204);
        return category.pk;
      });
      const name = uniqueName('pw-part');

      const response = await test.step('POST /api/part/ with the missing category', async () => {
        return await parts.createInvalid({ name, category: missingId });
      });

      await test.step('Check the request returns 400 and no part was created', async () => {
        expect(response.status()).toBe(400);
        await expectPartsListed(await parts.listFiltered({ search: name }), []);
      });
    });

    test('API-EDGE-009: create a part with a default location that does not exist', async ({ parts, stockLocations }) => {
      const missingId = await test.step('Setup: create and delete a stock location to get an ID that no longer exists', async () => {
        const location = await stockLocations.createOrFail(newStockLocation());
        expect((await stockLocations.delete(location.pk)).status()).toBe(204);
        return location.pk;
      });
      const name = uniqueName('pw-part');

      const response = await test.step('POST /api/part/ with the missing default location', async () => {
        return await parts.createInvalid({ name, default_location: missingId });
      });

      await test.step('Check the request returns 400 and no part was created', async () => {
        expect(response.status()).toBe(400);
        await expectPartsListed(await parts.listFiltered({ search: name }), []);
      });
    });

    test('API-EDGE-009: create a category under a parent that does not exist', async ({ categories }) => {
      const missingId = await test.step('Setup: create and delete a category to get an ID that no longer exists', async () => {
        const category = await categories.createOrFail(newCategory());
        expect((await categories.delete(category.pk)).status()).toBe(204);
        return category.pk;
      });
      const name = uniqueName('pw-category');

      const response = await test.step('POST /api/part/category/ with the missing parent', async () => {
        return await categories.createInvalid({ name, parent: missingId });
      });

      await test.step('Check the request returns 400 and no category was created', async () => {
        expect(response.status()).toBe(400);
        expect((await categories.listOrFail({ search: name })).count).toBe(0);
      });
    });

    test('API-EDGE-010: use a method the endpoint does not list', async ({ parts }) => {
      const created = await test.step('Setup: POST /api/part/', async () => {
        return await parts.createOrFail(newPart());
      });

      const response = await test.step('DELETE /api/part/ (the list endpoint)', async () => {
        return await parts.deleteList();
      });

      await test.step('Check the request returns 405 and the part still exists', async () => {
        expect(response.status()).toBe(405);
        expect((await parts.get(created.pk)).status()).toBe(200);
      });
    });
  });

  test.describe('Conflict scenarios', () => {
    // OQ-EDGE-04 (confirmed by the user): the lock blocks a delete even when the part is inactive.
    // Assumes PART_ENABLE_LOCKING is enabled, as on the local instance; tests never change global settings.
    for (const active of [true, false]) {
      test(`API-EDGE-011: delete a locked ${active ? 'active' : 'inactive'} part while locking is enabled`, async ({ parts }) => {
        const part = await test.step(`Setup: POST /api/part/ with locked=true and active=${active}`, async () => {
          return await parts.createOrFail(newPart({ locked: true, active }));
        });

        const response = await test.step('DELETE /api/part/{id}/', async () => {
          return await parts.delete(part.pk);
        });

        await test.step('Check 400 with non_field_errors, and the part still exists and is locked', async () => {
          expect(response.status()).toBe(400);
          expect(await response.json()).toHaveProperty('non_field_errors');
          expect((await parts.getOrFail(part.pk)).locked).toBe(true);
        });
      });
    }

    // API-EDGE-012 (locking disabled) is in parts.settings.spec.ts, because it switches PART_ENABLE_LOCKING off.

    // OQ-EDGE-05 (confirmed by the user): locking blocks delete, BOM, and parameters, not field edits; the schema text is a documentation defect.
    test("API-EDGE-013: edit a locked part's fields", async ({ parts }) => {
      const part = await test.step('Setup: POST /api/part/ with locked=true and a known description', async () => {
        return await parts.createOrFail(newPart({ locked: true, description: 'Original description' }));
      });

      const response = await test.step('PATCH /api/part/{id}/ with a new description', async () => {
        return await parts.update(part.pk, { description: 'Edited while locked' });
      });

      await test.step('Check 200, the new description is stored, and the part is still locked', async () => {
        expect(response.status()).toBe(200);
        const stored = await parts.getOrFail(part.pk);
        expect(stored.description).toBe('Edited while locked');
        expect(stored.locked).toBe(true);
      });
    });
    // OQ-CREATE-08 (partly confirmed): PART_ALLOW_DUPLICATE_IPN is on locally; tests never change global settings.
    test('API-EDGE-014: create a part with an IPN that is already used, duplicates allowed', async ({ parts }) => {
      const ipn = uniqueName('PW-IPN');
      const original = await test.step('Setup: part A with a unique IPN', async () => {
        return await parts.createOrFail(newPart({ IPN: ipn }));
      });

      const response = await test.step('POST /api/part/ with a new name and the same IPN', async () => {
        return await parts.create(newPart({ IPN: ipn }));
      });

      await test.step('Check 201, the IPN search lists both parts, and A is unchanged', async () => {
        expect(response.status()).toBe(201);
        const duplicate = (await response.json()) as Part;
        await expectPartsListed(await parts.listFiltered({ IPN: ipn }), [original, duplicate]);
        expect((await parts.getOrFail(original.pk)).name).toBe(original.name);
      });
    });

    // The duplicates-not-allowed rows of API-EDGE-014 are in parts.settings.spec.ts, because they switch the setting off.
    // OQ-EDGE-06 (confirmed by the user): names are unique per parent, compared case-sensitively.
    const DUPLICATE_NAME_ROWS = [
      { label: 'the same name under the same parent', underParent: true, upperCase: false, accepted: false },
      { label: 'the same name at the top level', underParent: false, upperCase: false, accepted: true },
      {
        label: 'the same name in upper case under the same parent',
        underParent: true,
        upperCase: true,
        accepted: true,
      },
    ];

    for (const { label, underParent, upperCase, accepted } of DUPLICATE_NAME_ROWS) {
      test(`API-EDGE-015: create a category with ${label}`, async ({ categories }) => {
        const { parent, child } = await test.step('Setup: category P with child C', async () => {
          const parent = await categories.createOrFail(newCategory());
          const child = await categories.createOrFail(newCategory({ parent: parent.pk }));
          return { parent, child };
        });
        const name = upperCase ? child.name.toUpperCase() : child.name;

        const response = await test.step(`POST /api/part/category/ with ${label}`, async () => {
          return await categories.createInvalid(underParent ? { name, parent: parent.pk } : { name });
        });

        await test.step(accepted ? 'Check 201' : 'Check 400 with non_field_errors and P still has only C', async () => {
          if (accepted) {
            expect(response.status()).toBe(201);
          } else {
            expect(response.status()).toBe(400);
            expect(await response.json()).toHaveProperty('non_field_errors');
            expect((await categories.listOrFail({ parent: parent.pk })).results.map((category) => category.pk)).toEqual([child.pk]);
          }
          expect((await categories.getOrFail(child.pk)).name).toBe(child.name);
        });
      });
    }
  });
});
