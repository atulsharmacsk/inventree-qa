import type { APIRequestContext, APIResponse } from '@playwright/test';
import { DEFAULT_PAGE_LIMIT, type BomItem, type Page } from '../models';

/** Reads /api/bom/. BOM items are deleted with their assembly or component part, so this service creates nothing to clean up. */
export class BomItemService {
  constructor(private request: APIRequestContext) {}

  list(part: number, limit = DEFAULT_PAGE_LIMIT): Promise<APIResponse> {
    return this.request.get('/api/bom/', { params: { part, limit } });
  }

  /** For test checks: lists the BOM of an assembly and stops the test if that fails. */
  async listOrFail(part: number): Promise<Page<BomItem>> {
    const response = await this.list(part);
    if (response.status() !== 200) {
      throw new Error(`Could not list BOM items: ${response.status()}`);
    }
    return (await response.json()) as Page<BomItem>;
  }
}
