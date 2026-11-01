import { rm } from 'node:fs/promises';
import path from 'node:path';
import type { FullConfig } from '@playwright/test';

/** Global setup: empties `allure-results/` so a local report holds only this run; history is kept in `allure-history/`. */
export default async function clearAllureResults(config: FullConfig): Promise<void> {
  if (!config.configFile) return;
  await rm(path.join(path.dirname(config.configFile), 'allure-results'), { recursive: true, force: true });
}
