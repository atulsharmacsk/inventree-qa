import { newPart } from '../src/data/factories';
import { expect, test } from './fixtures';

// Framework smoke checks; they have no manual case ID and only prove auth, page objects, and services work.
test.describe('Smoke', { tag: '@smoke' }, () => {
  test.use({ role: 'SUPERUSER' });

  test('SMOKE-001: logged-in user opens the Parts view from the main navigation', async ({ navigation, partsList }) => {
    await test.step('Open /web/ with the saved session', async () => {
      await navigation.goHome();
    });

    await test.step('Click the Parts tab, then the Parts panel', async () => {
      await navigation.open('Parts');
      await partsList.openPartsPanel();
    });

    await test.step('Check the Parts tab and panel are selected and Add Parts is offered', async () => {
      await expect(navigation.section('Parts')).toHaveAttribute('aria-selected', 'true');
      await expect(partsList.panelTab('Parts')).toHaveAttribute('aria-selected', 'true');
      await expect(partsList.addPartsMenu).toBeVisible();
    });
  });

  test('SMOKE-002: part created through the API opens on its detail page', async ({ parts, partDetail }) => {
    const part = await test.step('Setup: POST /api/part/', async () => {
      return await parts.createOrFail(newPart({ description: 'Created by SMOKE-002' }));
    });

    await test.step('Open /web/part/{id}/', async () => {
      await partDetail.goto(part.pk);
    });

    await test.step('Check the title and Part Details values', async () => {
      await expect(partDetail.title(part.name)).toBeVisible();
      await expect(partDetail.detail('Description')).toHaveText(part.description);
      await expect(partDetail.tab('Part Details')).toHaveAttribute('aria-selected', 'true');
    });
  });
});
