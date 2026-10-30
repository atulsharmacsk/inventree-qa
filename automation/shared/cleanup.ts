import type { TestInfo } from '@playwright/test';

/** Records failed deletes as `cleanup` annotations so they show in the report. */
export function reportCleanup(testInfo: TestInfo, failures: string[]): void {
  for (const description of failures) {
    testInfo.annotations.push({ type: 'cleanup', description });
  }
}
