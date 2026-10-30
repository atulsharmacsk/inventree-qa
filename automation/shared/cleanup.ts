import type { APIResponse, TestInfo } from '@playwright/test';

const CLEANUP_ATTEMPTS = 3;

/** Sends a cleanup delete, retrying server errors: the local instance returns intermittent 500s on deletes under parallel load. */
export async function deleteWithRetry(send: () => Promise<APIResponse>): Promise<APIResponse> {
  let response = await send();
  for (let attempt = 1; attempt < CLEANUP_ATTEMPTS && response.status() >= 500; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    response = await send();
  }
  return response;
}

/** Records failed deletes as `cleanup` annotations so they show in the report. */
export function reportCleanup(testInfo: TestInfo, failures: string[]): void {
  for (const description of failures) {
    testInfo.annotations.push({ type: 'cleanup', description });
  }
}
