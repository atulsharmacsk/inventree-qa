import type { APIRequestContext, APIResponse } from '@playwright/test';

/** Sends requests to /api/system/. */
export class SystemService {
  constructor(private request: APIRequestContext) {}

  health(): Promise<APIResponse> {
    return this.request.get('/api/system/health/');
  }
}
