import type { APIRequestContext, APIResponse } from '@playwright/test';
import { deleteWithRetry } from '../cleanup';
import { DEFAULT_PAGE_LIMIT, type NewStockItem, type Page, type StockItem, type StockItemFilters } from '../models';

/** Sends requests to /api/stock/ and removes the stock of the parts a test registers. */
export class StockItemService {
  private partIds: number[] = [];

  constructor(private request: APIRequestContext) {}

  /** Creates stock and registers its part, so stock added later through the UI is also removed. */
  async create(item: NewStockItem): Promise<APIResponse> {
    this.trackPart(item.part);
    return this.request.post('/api/stock/', { data: item });
  }

  list(filters: StockItemFilters = {}, limit = DEFAULT_PAGE_LIMIT): Promise<APIResponse> {
    return this.request.get('/api/stock/', { params: { ...filters, limit } });
  }

  delete(id: number): Promise<APIResponse> {
    return this.request.delete(`/api/stock/${id}/`);
  }

  /** Registers a test-owned part whose stock is deleted in teardown. */
  trackPart(partId: number): void {
    if (!this.partIds.includes(partId)) this.partIds.push(partId);
  }

  /** For test setup: creates stock and stops the test if that fails. */
  async createOrFail(item: NewStockItem): Promise<void> {
    const response = await this.create(item);
    if (response.status() !== 201) {
      throw new Error(`Could not create stock: ${response.status()} ${await response.text()}`);
    }
  }

  /** For test checks: lists stock and stops the test if that fails. */
  async listOrFail(filters: StockItemFilters): Promise<Page<StockItem>> {
    const response = await this.list(filters);
    if (response.status() !== 200) {
      throw new Error(`Could not list stock: ${response.status()}`);
    }
    return (await response.json()) as Page<StockItem>;
  }

  /** Deletes all stock of the registered parts (only test-owned parts are registered) and returns any failures. */
  async deleteCreated(): Promise<string[]> {
    const failures: string[] = [];
    for (const part of this.partIds) {
      const response = await this.list({ part });
      if (response.status() !== 200) {
        failures.push(`Listing stock of part ${part} returned ${response.status()}`);
        continue;
      }
      for (const item of ((await response.json()) as Page<StockItem>).results) {
        const deleted = await deleteWithRetry(() => this.delete(item.pk));
        if (deleted.status() !== 204 && deleted.status() !== 404) {
          failures.push(`Deleting stock item ${item.pk} returned ${deleted.status()}`);
        }
      }
    }
    this.partIds = [];
    return failures;
  }
}
