import type { Locator, Page } from '@playwright/test';

/** Waits until the Mantine DataTable inside `scope` (a page or a panel) has finished fetching. */
export async function waitForTableLoaded(scope: Page | Locator): Promise<void> {
  // The spinner has no role or label; this class is present only while a fetch is running.
  await scope.locator('.mantine-datatable-loader-fetching').waitFor({ state: 'hidden' });
}
