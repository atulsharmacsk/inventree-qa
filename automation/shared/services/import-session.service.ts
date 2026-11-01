import type { APIRequestContext, APIResponse } from '@playwright/test';
import { deleteEach } from '../cleanup';

/** Deletes data import sessions a test caused (for example through the UI), via /api/importer/session/. */
export class ImportSessionService {
  private trackedIds: number[] = [];

  constructor(private request: APIRequestContext) {}

  /** Records a session created outside this service so the fixture deletes it. */
  track(id: number): void {
    this.trackedIds.push(id);
  }

  /** Tracks the session from a create response (for example from the UI); does nothing unless it is a 201. */
  async trackFrom(response: { status(): number; json(): Promise<unknown> } | undefined): Promise<void> {
    if (response?.status() === 201) this.track(((await response.json()) as { pk: number }).pk);
  }

  delete(id: number): Promise<APIResponse> {
    return this.request.delete(`/api/importer/session/${id}/`);
  }

  async deleteCreated(): Promise<string[]> {
    const failures = await deleteEach([...this.trackedIds].reverse(), 'import session', (id) => this.delete(id));
    this.trackedIds = [];
    return failures;
  }
}
