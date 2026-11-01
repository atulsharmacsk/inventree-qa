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

/** Deletes each ID in order (with retry) and returns a message for every delete that is neither 204 nor 404. */
export async function deleteEach(ids: number[], label: string, remove: (id: number) => Promise<APIResponse>): Promise<string[]> {
  const failures: string[] = [];
  for (const id of ids) {
    const response = await deleteWithRetry(() => remove(id));
    if (response.status() !== 204 && response.status() !== 404) {
      failures.push(`Deleting ${label} ${id} returned ${response.status()}`);
    }
  }
  return failures;
}

/** Records failed deletes as `cleanup` annotations so they show in the report. */
export function reportCleanup(testInfo: TestInfo, failures: string[]): void {
  for (const description of failures) {
    testInfo.annotations.push({ type: 'cleanup', description });
  }
}

/** Fixture body: hands the service to the test, then deletes what the test created and reports any failures. */
export async function useAndCleanUp<T extends { deleteCreated(): Promise<string[]> }>(
  service: T,
  use: (service: T) => Promise<void>,
  testInfo: TestInfo,
): Promise<void> {
  await use(service);
  reportCleanup(testInfo, await service.deleteCreated());
}
