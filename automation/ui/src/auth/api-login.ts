import type { APIRequestContext } from '@playwright/test';
import { baseUrl } from '../../../shared/environments';

// The web login form gives up after about 5 s, which the shared demo sometimes exceeds; a direct request waits longer.
const REQUEST_TIMEOUT_MS = 45_000;

async function csrfToken(request: APIRequestContext): Promise<string> {
  for (const path of ['/api/auth/v1/config', '/api/auth/v1/auth/session']) {
    await request.get(path, { timeout: REQUEST_TIMEOUT_MS, failOnStatusCode: false, maxRetries: 3 });
    const { cookies } = await request.storageState();
    const cookie = cookies.find((c) => c.name === 'csrftoken');
    if (cookie) return cookie.value;
  }
  throw new Error('InvenTree did not set a CSRF cookie');
}

/** Logs in through InvenTree's login endpoint so the session cookie lands in the context's storage state. */
export async function loginThroughApi(request: APIRequestContext, username: string, password: string): Promise<void> {
  const response = await request.post('/api/auth/v1/auth/login', {
    data: { username, password },
    headers: { 'X-CSRFToken': await csrfToken(request), Referer: `${baseUrl()}/` },
    timeout: REQUEST_TIMEOUT_MS,
    failOnStatusCode: false,
    maxRetries: 3,
  });
  if (!response.ok()) throw new Error(`Login request failed with status ${response.status()}`);
}
