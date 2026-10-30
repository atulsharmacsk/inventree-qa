import type { APIRequestContext, APIResponse } from '@playwright/test';
import { deleteWithRetry } from '../cleanup';
import { DEFAULT_PAGE_LIMIT, type NewPart, type Part } from '../models';

/** Sends requests to /api/part/ and remembers the parts a test creates or adopts. */
export class PartService {
  private createdIds: number[] = [];

  constructor(private request: APIRequestContext) {}

  async create(part: NewPart): Promise<APIResponse> {
    const response = await this.request.post('/api/part/', { data: part });
    if (response.status() === 201) {
      const created = (await response.json()) as Part;
      this.createdIds.push(created.pk);
    }
    return response;
  }

  // The schema marks `limit` as required; without it the server returns an unpaginated array.
  list(limit = DEFAULT_PAGE_LIMIT): Promise<APIResponse> {
    return this.request.get('/api/part/', { params: { limit } });
  }

  get(id: number): Promise<APIResponse> {
    return this.request.get(`/api/part/${id}/`);
  }

  update(id: number, changes: Partial<NewPart>): Promise<APIResponse> {
    return this.request.patch(`/api/part/${id}/`, { data: changes });
  }

  replace(id: number, part: NewPart): Promise<APIResponse> {
    return this.request.put(`/api/part/${id}/`, { data: part });
  }

  delete(id: number): Promise<APIResponse> {
    return this.request.delete(`/api/part/${id}/`);
  }

  /** Registers a part created outside this service (for example through the UI) for cleanup. */
  track(id: number): void {
    this.createdIds.push(id);
  }

  /** For test setup: creates a part and stops the test if that fails. */
  async createOrFail(part: NewPart): Promise<Part> {
    const response = await this.create(part);
    if (response.status() !== 201) {
      throw new Error(`Could not create part: ${response.status()} ${await response.text()}`);
    }
    return (await response.json()) as Part;
  }

  /** For test checks: reads a part and stops the test if that fails. */
  async getOrFail(id: number): Promise<Part> {
    const response = await this.get(id);
    if (response.status() !== 200) {
      throw new Error(`Could not read part ${id}: ${response.status()}`);
    }
    return (await response.json()) as Part;
  }

  /** Finds parts by exact name. */
  async findByName(name: string): Promise<Part[]> {
    const response = await this.request.get('/api/part/', { params: { name, limit: DEFAULT_PAGE_LIMIT } });
    const body = (await response.json()) as { results: Part[] };
    return body.results.filter((part) => part.name === name);
  }

  /** Deletes only the parts this test created and returns any failures. */
  async deleteCreated(): Promise<string[]> {
    const failures: string[] = [];
    for (const id of this.createdIds) {
      // Local 1.6.3 rejects deleting an active part with 400 (OQ-PART-02), so deactivate first.
      await this.update(id, { active: false });
      const response = await deleteWithRetry(() => this.delete(id));
      if (response.status() !== 204 && response.status() !== 404) {
        failures.push(`Deleting part ${id} returned ${response.status()}`);
      }
    }
    this.createdIds = [];
    return failures;
  }
}
