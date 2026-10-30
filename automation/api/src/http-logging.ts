import type { APIRequestContext, APIResponse, TestInfo } from '@playwright/test';
import { hideSecrets } from '../../shared/redaction';

type RequestOptions = Parameters<APIRequestContext['fetch']>[1];

const LOGGED_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'fetch']);

/** Wraps a request context so every call attaches its request and response to the report, with secrets hidden. */
export function withHttpLogging(request: APIRequestContext, testInfo: TestInfo): APIRequestContext {
  return new Proxy(request, {
    get(target, property, receiver) {
      const original: unknown = Reflect.get(target, property, receiver);
      if (typeof property !== 'string' || !LOGGED_METHODS.has(property) || typeof original !== 'function') return original;
      return async (urlOrRequest: unknown, options?: RequestOptions): Promise<APIResponse> => {
        const response = (await original.call(target, urlOrRequest, options)) as APIResponse;
        const method = (property === 'fetch' ? (options?.method ?? 'GET') : property).toUpperCase();
        await attachExchange(testInfo, method, options, response);
        return response;
      };
    },
  });
}

async function attachExchange(testInfo: TestInfo, method: string, options: RequestOptions, response: APIResponse): Promise<void> {
  const url = new URL(response.url());
  // Authorization and cookie headers are left out on purpose; hideSecrets covers anything in bodies.
  const exchange = {
    request: { method, url: response.url(), params: options?.params, data: options?.data },
    response: { status: response.status(), statusText: response.statusText(), body: await readBody(response) },
  };
  await testInfo.attach(`${method} ${url.pathname}${url.search} → ${response.status()}`, {
    body: hideSecrets(JSON.stringify(exchange, null, 2)),
    contentType: 'application/json',
  });
}

async function readBody(response: APIResponse): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
