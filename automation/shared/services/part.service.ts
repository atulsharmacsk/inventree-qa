import type { APIRequestContext, APIResponse } from '@playwright/test';
import { deleteWithRetry } from '../cleanup';
import { DEFAULT_PAGE_LIMIT, type NewPart, type Part, type PartFilters } from '../models';

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

  listFiltered(filters: PartFilters): Promise<APIResponse> {
    return this.request.get('/api/part/', { params: { limit: DEFAULT_PAGE_LIMIT, ...filters } });
  }

  /** Lists without the `limit` parameter that the schema marks as required. */
  listWithoutLimit(filters: PartFilters): Promise<APIResponse> {
    return this.request.get('/api/part/', { params: filters });
  }

  get(id: number): Promise<APIResponse> {
    return this.request.get(`/api/part/${id}/`);
  }

  update(id: number, changes: Partial<NewPart>): Promise<APIResponse> {
    return this.request.patch(`/api/part/${id}/`, { data: changes });
  }

  /** For test setup: applies changes (for example `locked: true`) and stops the test if that fails. */
  async updateOrFail(id: number, changes: Partial<NewPart>): Promise<Part> {
    const response = await this.update(id, changes);
    if (response.status() !== 200) {
      throw new Error(`Could not update part ${id}: ${response.status()} ${await response.text()}`);
    }
    return (await response.json()) as Part;
  }

  replace(id: number, part: NewPart): Promise<APIResponse> {
    return this.request.put(`/api/part/${id}/`, { data: part });
  }

  /** For rejection checks: sends a body `NewPart` cannot express (wrong type, `null`, missing field). */
  createInvalid(body: Record<string, unknown>): Promise<APIResponse> {
    return this.create(body as NewPart);
  }

  updateInvalid(id: number, body: Record<string, unknown>): Promise<APIResponse> {
    return this.request.patch(`/api/part/${id}/`, { data: body });
  }

  replaceInvalid(id: number, body: Record<string, unknown>): Promise<APIResponse> {
    return this.request.put(`/api/part/${id}/`, { data: body });
  }

  /** Sends a raw string as a JSON body, for example malformed JSON that a typed body cannot express. */
  createRawJson(rawBody: string): Promise<APIResponse> {
    return this.request.post('/api/part/', { data: rawBody, headers: { 'Content-Type': 'application/json' } });
  }

  /** Sends `DELETE` to the list endpoint, which the schema does not list. */
  deleteList(): Promise<APIResponse> {
    return this.request.delete('/api/part/');
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

  /** Deletes only the parts this test created (newest, so variants, first) and returns any failures. */
  async deleteCreated(): Promise<string[]> {
    let pending = [...this.createdIds].reverse();
    let lastStatus = new Map<number, number>();
    // A part still used in another test part's BOM returns 400 until that assembly is deleted, so retry in passes.
    for (let pass = 0; pass < 3 && pending.length > 0; pass++) {
      const retry: number[] = [];
      lastStatus = new Map();
      for (const id of pending) {
        // Locked parts cannot be deleted while locking is enabled, so unlock before deactivating.
        await this.update(id, { locked: false });
        // Local 1.6.3 rejects deleting an active part with 400 (OQ-PART-02), so deactivate first.
        await this.update(id, { active: false });
        const response = await deleteWithRetry(() => this.delete(id));
        if (response.status() !== 204 && response.status() !== 404) {
          retry.push(id);
          lastStatus.set(id, response.status());
        }
      }
      pending = retry;
    }
    this.createdIds = [];
    return pending.map((id) => `Deleting part ${id} returned ${lastStatus.get(id)}`);
  }
}
