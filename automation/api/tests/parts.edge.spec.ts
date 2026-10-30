import { expectPartsListed } from '../src/checks';
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
    test.fixme('API-EDGE-007: send a malformed JSON body (application finding: the server returns 500 instead of 400, OQ-EDGE-02)', async () => {});

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
    test.fixme('API-EDGE-011: delete a locked part while locking is enabled (blocked by OQ-EDGE-04)', async () => {});

    // Skipped, not deleted: the body is ready to run once an instance has part locking (PART_ENABLE_LOCKING) disabled.
    // Tests never change global settings, and locking is enabled on the local instance.
    test.fixme('API-EDGE-012: delete a locked part while locking is disabled (blocked: PART_ENABLE_LOCKING is enabled on the local instance)', async ({ parts }) => {
      const part = await test.step('Setup: POST /api/part/ with locked=true and active=false', async () => {
        return await parts.createOrFail(newPart({ locked: true, active: false }));
      });

      const response = await test.step('DELETE /api/part/{id}/', async () => {
        return await parts.delete(part.pk);
      });

      await test.step('Check DELETE returns 204 and the part is no longer listed', async () => {
        expect(response.status()).toBe(204);
        await expectPartsListed(await parts.listFiltered({ search: part.name }), []);
      });
    });

    test.fixme('API-EDGE-013: edit a locked part\'s fields (blocked by OQ-EDGE-05)', async () => {});
    test.fixme('API-EDGE-014: create a part with an IPN that is already used (blocked by OQ-CREATE-08)', async () => {});
    test.fixme('API-EDGE-015: create a category with a name already used under the same parent (blocked by OQ-EDGE-06)', async () => {});
  });
});
