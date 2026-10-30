import fs from 'node:fs/promises';
import path from 'node:path';
import { test as setup } from '@playwright/test';
import { verifyAccountRole } from '../../shared/auth';
import { ROLES, credentialsFor, missingRoleMessage } from '../../shared/roles';
import { storageStatePath } from '../src/models/paths';
import { LoginPage } from '../src/pages/login.page';

for (const role of ROLES) {
  setup(`authenticate as ${role} and save the session`, async ({ page }) => {
    const credentials = credentialsFor(role);
    setup.skip(!credentials, missingRoleMessage(role));
    if (!credentials) return;
    setup.setTimeout(90_000);

    const login = new LoginPage(page);
    await setup.step('Open /web/ and log in', async () => {
      await login.goto();
      await login.login(credentials.username, credentials.password);
    });

    await setup.step(`GET /api/user/me/ confirms the account fits the ${role} role`, async () => {
      await verifyAccountRole(page.request, role);
    });

    await setup.step('Save storage state to the git-ignored auth folder', async () => {
      const statePath = storageStatePath(role);
      await fs.mkdir(path.dirname(statePath), { recursive: true });
      await page.context().storageState({ path: statePath });
    });
  });
}
