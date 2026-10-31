import type { APIRequestContext, APIResponse } from '@playwright/test';
import { deleteWithRetry } from '../cleanup';
import {
  DEFAULT_PAGE_LIMIT,
  type NewParameter,
  type NewParameterTemplate,
  type Page,
  type Parameter,
  type ParameterFilters,
  type ParameterTemplate,
} from '../models';

/** Sends requests to /api/parameter/template/ and /api/parameter/; remembers the templates a test creates. */
export class ParameterService {
  private createdTemplateIds: number[] = [];

  constructor(private request: APIRequestContext) {}

  async createTemplate(template: NewParameterTemplate): Promise<APIResponse> {
    const response = await this.request.post('/api/parameter/template/', { data: template });
    if (response.status() === 201) {
      const created = (await response.json()) as ParameterTemplate;
      this.createdTemplateIds.push(created.pk);
    }
    return response;
  }

  deleteTemplate(id: number): Promise<APIResponse> {
    return this.request.delete(`/api/parameter/template/${id}/`);
  }

  list(filters: ParameterFilters, limit = DEFAULT_PAGE_LIMIT): Promise<APIResponse> {
    return this.request.get('/api/parameter/', { params: { ...filters, limit } });
  }

  /** For test setup: creates a template and stops the test if that fails. */
  async createTemplateOrFail(template: NewParameterTemplate): Promise<ParameterTemplate> {
    const response = await this.createTemplate(template);
    if (response.status() !== 201) {
      throw new Error(`Could not create parameter template: ${response.status()} ${await response.text()}`);
    }
    return (await response.json()) as ParameterTemplate;
  }

  /** For test setup: adds a parameter value to a record; it is deleted with its template. */
  async createOrFail(parameter: NewParameter): Promise<Parameter> {
    const response = await this.request.post('/api/parameter/', { data: parameter });
    if (response.status() !== 201) {
      throw new Error(`Could not create parameter: ${response.status()} ${await response.text()}`);
    }
    return (await response.json()) as Parameter;
  }

  /** For test checks: lists parameters and stops the test if that fails. */
  async listOrFail(filters: ParameterFilters): Promise<Page<Parameter>> {
    const response = await this.list(filters);
    if (response.status() !== 200) {
      throw new Error(`Could not list parameters: ${response.status()}`);
    }
    return (await response.json()) as Page<Parameter>;
  }

  /** Deletes only the templates this test created (their parameters are deleted with them) and returns any failures. */
  async deleteCreated(): Promise<string[]> {
    const failures: string[] = [];
    for (const id of [...this.createdTemplateIds].reverse()) {
      const response = await deleteWithRetry(() => this.deleteTemplate(id));
      if (response.status() !== 204 && response.status() !== 404) {
        failures.push(`Deleting parameter template ${id} returned ${response.status()}`);
      }
    }
    this.createdTemplateIds = [];
    return failures;
  }
}
