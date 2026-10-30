import type { APIRequestContext, APIResponse } from '@playwright/test';
import { deleteWithRetry } from '../cleanup';
import { DEFAULT_PAGE_LIMIT, type Category, type CategoryFilters, type NewCategory, type Page } from '../models';

/** Body flags the local server requires on category delete (OQ-ACAT-03); not in the published schema. */
export type CategoryDeleteOptions = {
  delete_parts: boolean;
  delete_child_categories: boolean;
};

const KEEP_PARTS_AND_CHILDREN: CategoryDeleteOptions = { delete_parts: false, delete_child_categories: false };

/** Sends requests to /api/part/category/ and remembers the categories a test creates. */
export class CategoryService {
  private createdIds: number[] = [];

  constructor(private request: APIRequestContext) {}

  async create(category: NewCategory): Promise<APIResponse> {
    const response = await this.request.post('/api/part/category/', { data: category });
    if (response.status() === 201) {
      const created = (await response.json()) as Category;
      this.createdIds.push(created.pk);
    }
    return response;
  }

  // The schema marks `limit` as required on both list endpoints.
  list(filters: CategoryFilters = {}, limit = DEFAULT_PAGE_LIMIT): Promise<APIResponse> {
    return this.request.get('/api/part/category/', { params: { ...filters, limit } });
  }

  tree(search: string, limit = DEFAULT_PAGE_LIMIT): Promise<APIResponse> {
    return this.request.get('/api/part/category/tree/', { params: { search, limit } });
  }

  get(id: number): Promise<APIResponse> {
    return this.request.get(`/api/part/category/${id}/`);
  }

  update(id: number, changes: Partial<NewCategory>): Promise<APIResponse> {
    return this.request.patch(`/api/part/category/${id}/`, { data: changes });
  }

  replace(id: number, category: NewCategory): Promise<APIResponse> {
    return this.request.put(`/api/part/category/${id}/`, { data: category });
  }

  delete(id: number, options: CategoryDeleteOptions = KEEP_PARTS_AND_CHILDREN): Promise<APIResponse> {
    return this.request.delete(`/api/part/category/${id}/`, { data: options });
  }

  /** For test setup: creates a category and stops the test if that fails. */
  async createOrFail(category: NewCategory): Promise<Category> {
    const response = await this.create(category);
    if (response.status() !== 201) {
      throw new Error(`Could not create category: ${response.status()} ${await response.text()}`);
    }
    return (await response.json()) as Category;
  }

  /** For test checks: reads a category and stops the test if that fails. */
  async getOrFail(id: number): Promise<Category> {
    const response = await this.get(id);
    if (response.status() !== 200) {
      throw new Error(`Could not read category ${id}: ${response.status()}`);
    }
    return (await response.json()) as Category;
  }

  /** For test checks: lists categories and stops the test if that fails. */
  async listOrFail(filters: CategoryFilters): Promise<Page<Category>> {
    const response = await this.list(filters);
    if (response.status() !== 200) {
      throw new Error(`Could not list categories: ${response.status()}`);
    }
    return (await response.json()) as Page<Category>;
  }

  /** Deletes only the categories this test created (newest, so children, first) and returns any failures. */
  async deleteCreated(): Promise<string[]> {
    const failures: string[] = [];
    for (const id of [...this.createdIds].reverse()) {
      // False keeps the delete from cascading to records the test did not create.
      const response = await deleteWithRetry(() => this.delete(id));
      if (response.status() !== 204 && response.status() !== 404) {
        failures.push(`Deleting category ${id} returned ${response.status()}`);
      }
    }
    this.createdIds = [];
    return failures;
  }
}
