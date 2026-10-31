import type { APIRequestContext, APIResponse } from '@playwright/test';
import { deleteWithRetry } from '../cleanup';

/** Deletes data import sessions a test caused (for example through the UI), via /api/importer/session/. */
export class ImportSessionService {
  private trackedIds: number[] = [];

  constructor(private request: APIRequestContext) {}

  /** Records a session created outside this service so the fixture deletes it. */
  track(id: number): void {
    this.trackedIds.push(id);
  }

  delete(id: number): Promise<APIResponse> {
    return this.request.delete(`/api/importer/session/${id}/`);
  }

  async deleteCreated(): Promise<string[]> {
    const failures: string[] = [];
    for (const id of [...this.trackedIds].reverse()) {
      const response = await deleteWithRetry(() => this.delete(id));
      if (response.status() !== 204 && response.status() !== 404) {
        failures.push(`Deleting import session ${id} returned ${response.status()}`);
      }
    }
    this.trackedIds = [];
    return failures;
  }
}
