import type { APIRequestContext, APIResponse } from '@playwright/test';
import { deleteWithRetry } from '../../../shared/cleanup';
import { DEFAULT_PAGE_LIMIT, type Page } from '../../../shared/models';
import type { ManufacturerPart, ManufacturerPartFilters, NewManufacturerPart } from '../models';

/** Sends requests to /api/company/part/manufacturer/ and removes the manufacturer parts of the parts a test registers. */
export class ManufacturerPartService {
  private partIds: number[] = [];

  constructor(private request: APIRequestContext) {}

  async create(manufacturerPart: NewManufacturerPart): Promise<APIResponse> {
    this.trackPart(manufacturerPart.part);
    return this.request.post('/api/company/part/manufacturer/', { data: manufacturerPart });
  }

  // The schema marks `limit` as required on list endpoints.
  list(filters: ManufacturerPartFilters = {}, limit = DEFAULT_PAGE_LIMIT): Promise<APIResponse> {
    return this.request.get('/api/company/part/manufacturer/', { params: { ...filters, limit } });
  }

  delete(id: number): Promise<APIResponse> {
    return this.request.delete(`/api/company/part/manufacturer/${id}/`);
  }

  trackPart(partId: number): void {
    if (!this.partIds.includes(partId)) this.partIds.push(partId);
  }

  /** For test setup: creates a manufacturer part and stops the test if that fails. */
  async createOrFail(manufacturerPart: NewManufacturerPart): Promise<ManufacturerPart> {
    const response = await this.create(manufacturerPart);
    if (response.status() !== 201) {
      throw new Error(`Could not create manufacturer part: ${response.status()} ${await response.text()}`);
    }
    return (await response.json()) as ManufacturerPart;
  }

  /** Deletes all manufacturer parts of the registered parts and returns any failures. */
  async deleteCreated(): Promise<string[]> {
    const failures: string[] = [];
    for (const part of this.partIds) {
      const response = await this.list({ part });
      if (response.status() !== 200) {
        failures.push(`Listing manufacturer parts of part ${part} returned ${response.status()}`);
        continue;
      }
      for (const item of ((await response.json()) as Page<ManufacturerPart>).results) {
        const deleted = await deleteWithRetry(() => this.delete(item.pk));
        if (deleted.status() !== 204 && deleted.status() !== 404) {
          failures.push(`Deleting manufacturer part ${item.pk} returned ${deleted.status()}`);
        }
      }
    }
    this.partIds = [];
    return failures;
  }
}
