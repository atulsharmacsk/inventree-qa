import fs from 'node:fs/promises';
import path from 'node:path';
import { request, type FullConfig } from '@playwright/test';
import { verifyAccountRole } from '../../shared/auth';
import clearAllureResults from '../../shared/clear-allure-results';
import { baseUrl } from '../../shared/environments';
import { ROLES, credentialsFor } from '../../shared/roles';
import { loginThroughApi } from './auth/api-login';
import { storageStatePath } from './models/paths';

// Logs in once per role and saves the session. A global setup, not a setup project, so a sharded run does not list the logins once per shard.
export default async function globalSetup(config: FullConfig): Promise<void> {
  await clearAllureResults(config);

  for (const role of ROLES) {
    const statePath = storageStatePath(role);
    // A role without credentials is skipped with a reason by the `skipWithoutRole` fixture; remove any stale session from an earlier run.
    const credentials = credentialsFor(role);
    if (!credentials) {
      await fs.rm(statePath, { force: true });
      continue;
    }

    const context = await request.newContext({ baseURL: baseUrl() });
    try {
      await loginThroughApi(context, credentials.username, credentials.password);
      await verifyAccountRole(context, role);
      await fs.mkdir(path.dirname(statePath), { recursive: true });
      await context.storageState({ path: statePath });
    } finally {
      await context.dispose();
    }
  }
}
