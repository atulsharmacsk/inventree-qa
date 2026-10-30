import { expectPartsListed } from '../src/checks';
import { newPart } from '../src/test-data';
import { expect, test } from './fixtures';

// Manual cases: test-cases/api/edge-cases.md
// Rejected requests have no documented error status (OQ-EDGE-01 to 06, OQ-CREATE-08), so those cases stay fixme.
// API-EDGE-005 and 006 are not automated: they need a user whose only Part role is view.

test.describe('Edge cases', () => {
  test.use({ role: 'SUPERUSER' });

  test.describe('Unauthenticated and unauthorized access', () => {
    test.fixme('API-EDGE-001: list parts without credentials (blocked by OQ-EDGE-01)', async () => {});
    test.fixme('API-EDGE-002: create a part without credentials (blocked by OQ-EDGE-01)', async () => {});
    test.fixme('API-EDGE-003: use an invalid or badly formed token (blocked by OQ-EDGE-01)', async () => {});
    test.fixme('API-EDGE-004: use a revoked token (blocked by OQ-EDGE-01)', async () => {});
  });

  test.describe('Invalid payloads', () => {
    test.fixme('API-EDGE-007: send a malformed JSON body (blocked by OQ-EDGE-02)', async () => {});
    test.fixme('API-EDGE-008: send values of the wrong type (blocked by OQ-EDGE-02)', async () => {});
    test.fixme('API-EDGE-009: refer to records that do not exist (blocked by OQ-EDGE-02)', async () => {});
    test.fixme('API-EDGE-010: use a method the endpoint does not list (blocked by OQ-EDGE-03)', async () => {});
  });

  test.describe('Conflict scenarios', () => {
    test.fixme('API-EDGE-011: delete a locked part while locking is enabled (blocked by OQ-EDGE-04)', async () => {});

    test('API-EDGE-012: delete a locked part while locking is disabled', async ({ parts, settings }) => {
      await test.step('Precondition: GET /api/settings/global/PART_ENABLE_LOCKING/ is disabled', async () => {
        const lockingEnabled = await settings.isEnabledOrFail('PART_ENABLE_LOCKING');
        // Tests never change global settings, so this case needs an instance where locking is already off.
        test.skip(lockingEnabled, 'API-EDGE-012 needs part locking (PART_ENABLE_LOCKING) disabled on this instance');
      });

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
