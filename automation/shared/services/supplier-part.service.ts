import type { APIRequestContext, APIResponse } from '@playwright/test';
import { deleteWithRetry } from '../cleanup';
import { DEFAULT_PAGE_LIMIT, type NewSupplierPart, type Page, type SupplierPart, type SupplierPartFilters } from '../models';

/** Sends requests to /api/company/part/ and removes the supplier parts of the parts a test registers. */
export class SupplierPartService {
  private partIds: number[] = [];

  constructor(private request: APIRequestContext) {}

  /** Creates a supplier part and, if that succeeds, registers its part, so supplier parts added another way are also removed. */
  async create(supplierPart: NewSupplierPart): Promise<APIResponse> {
    const response = await this.request.post('/api/company/part/', { data: supplierPart });
    if (response.status() === 201) this.trackPart(supplierPart.part);
    return response;
  }

  // The schema marks `limit` as required on list endpoints.
  list(filters: SupplierPartFilters = {}, limit = DEFAULT_PAGE_LIMIT): Promise<APIResponse> {
    return this.request.get('/api/company/part/', { params: { ...filters, limit } });
  }

  get(id: number): Promise<APIResponse> {
    return this.request.get(`/api/company/part/${id}/`);
  }

  delete(id: number): Promise<APIResponse> {
    return this.request.delete(`/api/company/part/${id}/`);
  }

  /** Registers a test-owned part whose supplier parts are deleted in teardown. */
  trackPart(partId: number): void {
    if (!this.partIds.includes(partId)) this.partIds.push(partId);
  }

  /** For test setup: creates a supplier part and stops the test if that fails. */
  async createOrFail(supplierPart: NewSupplierPart): Promise<SupplierPart> {
    const response = await this.create(supplierPart);
    if (response.status() !== 201) {
      throw new Error(`Could not create supplier part: ${response.status()} ${await response.text()}`);
    }
    return (await response.json()) as SupplierPart;
  }

  /** For test checks: lists supplier parts and stops the test if that fails. */
  async listOrFail(filters: SupplierPartFilters): Promise<Page<SupplierPart>> {
    const response = await this.list(filters);
    if (response.status() !== 200) {
      throw new Error(`Could not list supplier parts: ${response.status()}`);
    }
    return (await response.json()) as Page<SupplierPart>;
  }

  /** Deletes all supplier parts of the registered parts (only test-owned parts are registered) and returns any failures. */
  async deleteCreated(): Promise<string[]> {
    const failures: string[] = [];
    for (const part of this.partIds) {
      const response = await this.list({ part });
      if (response.status() !== 200) {
        // `?part=` returns 400 for a deleted part; its supplier parts were deleted with it (OQ-REL-05).
        if ((await this.request.get(`/api/part/${part}/`)).status() === 404) continue;
        failures.push(`Listing supplier parts of part ${part} returned ${response.status()}`);
        continue;
      }
      for (const item of ((await response.json()) as Page<SupplierPart>).results) {
        const deleted = await deleteWithRetry(() => this.delete(item.pk));
        if (deleted.status() !== 204 && deleted.status() !== 404) {
          failures.push(`Deleting supplier part ${item.pk} returned ${deleted.status()}`);
        }
      }
    }
    this.partIds = [];
    return failures;
  }
}
