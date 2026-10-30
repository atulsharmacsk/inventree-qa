import type { APIRequestContext, APIResponse } from '@playwright/test';
import { deleteWithRetry } from '../cleanup';
import type { NewStockLocation, StockLocation } from '../models';

/** False keeps a delete from cascading to stock or sub-locations the test did not create. */
const KEEP_STOCK_AND_CHILDREN = { delete_stock_items: false, delete_sub_locations: false };

/** Sends requests to /api/stock/location/ and remembers the locations a test creates. */
export class StockLocationService {
  private createdIds: number[] = [];

  constructor(private request: APIRequestContext) {}

  async create(location: NewStockLocation): Promise<APIResponse> {
    const response = await this.request.post('/api/stock/location/', { data: location });
    if (response.status() === 201) {
      const created = (await response.json()) as StockLocation;
      this.createdIds.push(created.pk);
    }
    return response;
  }

  delete(id: number): Promise<APIResponse> {
    return this.request.delete(`/api/stock/location/${id}/`, { data: KEEP_STOCK_AND_CHILDREN });
  }

  /** For test setup: creates a location and stops the test if that fails. */
  async createOrFail(location: NewStockLocation): Promise<StockLocation> {
    const response = await this.create(location);
    if (response.status() !== 201) {
      throw new Error(`Could not create stock location: ${response.status()} ${await response.text()}`);
    }
    return (await response.json()) as StockLocation;
  }

  /** Deletes only the locations this test created and returns any failures. */
  async deleteCreated(): Promise<string[]> {
    const failures: string[] = [];
    for (const id of [...this.createdIds].reverse()) {
      const response = await deleteWithRetry(() => this.delete(id));
      if (response.status() !== 204 && response.status() !== 404) {
        failures.push(`Deleting stock location ${id} returned ${response.status()}`);
      }
    }
    this.createdIds = [];
    return failures;
  }
}
