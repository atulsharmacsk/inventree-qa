import { expectPartsListed } from '../src/checks';
import { newPart, uniqueName } from '../src/test-data';
import { SETTINGS_TESTS_ALLOWED, SETTINGS_TESTS_SKIP_REASON, expect, test } from './fixtures';

// Manual cases: test-cases/api/edge-cases.md
// Each test switches a global setting through the `globalSetting` fixture, which restores it afterwards. The `settings`
// project runs after all `api` tests, and these tests skip on REMOTE so the shared demo is never changed.

test.describe('Global setting variants', () => {
  test.skip(!SETTINGS_TESTS_ALLOWED, SETTINGS_TESTS_SKIP_REASON);
  test.use({ role: 'SUPERUSER' });

  // Confirmed by the user (2026-10-31, local 1.6.3): with locking off, a locked part is deleted like any other.
  // `globalSetting` comes first so its restore runs after `parts` cleanup.
  test('API-EDGE-012: delete a locked part while locking is disabled', async ({ globalSetting, parts }) => {
    await test.step('Setup: PART_ENABLE_LOCKING=false', async () => {
      await globalSetting('PART_ENABLE_LOCKING', 'false');
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

  // OQ-CREATE-08, API side (confirmed by the user, 2026-10-31): with duplicates off, the IPN check ignores letter case.
  for (const { label, toDuplicate } of [
    { label: 'the same IPN', toDuplicate: (ipn: string) => ipn },
    { label: 'the same IPN in lower case', toDuplicate: (ipn: string) => ipn.toLowerCase() },
  ]) {
    test(`API-EDGE-014: create a part with ${label}, duplicates not allowed`, async ({ globalSetting, parts }) => {
      await test.step('Setup: PART_ALLOW_DUPLICATE_IPN=false', async () => {
        await globalSetting('PART_ALLOW_DUPLICATE_IPN', 'false');
      });
      const ipn = uniqueName('PW-IPN');
      const original = await test.step('Setup: part A with a unique IPN', async () => {
        return await parts.createOrFail(newPart({ IPN: ipn }));
      });

      const response = await test.step(`POST /api/part/ with a new name and ${label}`, async () => {
        return await parts.create(newPart({ IPN: toDuplicate(ipn) }));
      });

      await test.step('Check 400 with an IPN error, only A has the IPN, and A is unchanged', async () => {
        expect(response.status()).toBe(400);
        expect(await response.json()).toHaveProperty('IPN');
        await expectPartsListed(await parts.listFiltered({ IPN: ipn }), [original]);
        expect((await parts.getOrFail(original.pk)).name).toBe(original.name);
      });
    });
  }
});
