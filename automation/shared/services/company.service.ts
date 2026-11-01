import type { APIRequestContext, APIResponse } from '@playwright/test';
import { deleteEach } from '../cleanup';
import type { Company, NewCompany } from '../models';

/** Sends requests to /api/company/ and remembers the companies a test creates. */
export class CompanyService {
  private createdIds: number[] = [];

  constructor(private request: APIRequestContext) {}

  async create(company: NewCompany): Promise<APIResponse> {
    const response = await this.request.post('/api/company/', { data: company });
    if (response.status() === 201) {
      const created = (await response.json()) as Company;
      this.createdIds.push(created.pk);
    }
    return response;
  }

  get(id: number): Promise<APIResponse> {
    return this.request.get(`/api/company/${id}/`);
  }

  delete(id: number): Promise<APIResponse> {
    return this.request.delete(`/api/company/${id}/`);
  }

  /** For test setup: creates a company and stops the test if that fails. */
  async createOrFail(company: NewCompany): Promise<Company> {
    const response = await this.create(company);
    if (response.status() !== 201) {
      throw new Error(`Could not create company: ${response.status()} ${await response.text()}`);
    }
    return (await response.json()) as Company;
  }

  /** Deletes only the companies this test created (newest first) and returns any failures. */
  async deleteCreated(): Promise<string[]> {
    const failures = await deleteEach([...this.createdIds].reverse(), 'company', (id) => this.delete(id));
    this.createdIds = [];
    return failures;
  }
}
