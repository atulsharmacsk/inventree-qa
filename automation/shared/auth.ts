import { randomUUID } from 'node:crypto';
import type { APIRequest, APIRequestContext } from '@playwright/test';
import { credentialsFor, missingRoleMessage, type Role } from './roles';
import { baseUrl } from './environments';

type ApiToken = { id: number; name: string };

/** Asks InvenTree for a new API token. `login` must use username and password. */
export async function requestToken(login: APIRequestContext, name: string): Promise<string> {
  const response = await login.get('/api/user/me/token/', { params: { name } });
  if (!response.ok()) {
    throw new Error(`Token request failed with status ${response.status()}`);
  }
  const body = (await response.json()) as { token: string };
  return body.token;
}

/** Revokes the token with this name so a leaked copy (for example in a trace) is useless. */
export async function revokeToken(login: APIRequestContext, name: string): Promise<void> {
  const response = await login.get('/api/user/tokens/', { params: { revoked: false } });
  if (!response.ok()) return;
  const body = (await response.json()) as ApiToken[] | { results: ApiToken[] };
  const tokens = Array.isArray(body) ? body : body.results;
  for (const token of tokens.filter((t) => t.name === name)) {
    await login.delete(`/api/user/tokens/${token.id}/`);
  }
}

type MeUser = { is_staff: boolean; is_superuser: boolean };

/**
 * Stops the run when the logged-in account does not match its role, for example a reader
 * configured with a superuser account, which would make permission tests pass wrongly.
 */
export async function verifyAccountRole(request: APIRequestContext, role: Role): Promise<void> {
  const response = await request.get('/api/user/me/');
  if (!response.ok()) throw new Error(`Could not read /api/user/me/ for role "${role}": ${response.status()}`);
  const me = (await response.json()) as MeUser;
  if (role === 'SUPERUSER' && !me.is_superuser) {
    throw new Error('The superuser role is configured with an account that is not a superuser');
  }
  if (role !== 'SUPERUSER' && (me.is_superuser || me.is_staff)) {
    throw new Error(`The ${role} role is configured with a staff or superuser account; use a separate non-staff user`);
  }
}

/** Returns a role's API token; each role's token is requested once per worker. */
export type TokenForRole = (role: Role) => Promise<string>;

/**
 * Body of a worker-scoped `apiTokens` fixture: requests a uniquely named token for each role the
 * worker's tests use, and revokes them all when the worker finishes.
 */
export async function withApiTokens(
  request: APIRequest,
  tokenPrefix: string,
  use: (tokenFor: TokenForRole) => Promise<void>,
): Promise<void> {
  const issued = new Map<Role, Promise<{ login: APIRequestContext; name: string; token: string }>>();

  const issue = async (role: Role) => {
    const credentials = credentialsFor(role);
    if (!credentials) throw new Error(missingRoleMessage(role));
    const login = await request.newContext({
      baseURL: baseUrl(),
      httpCredentials: { ...credentials, send: 'always' },
    });
    await verifyAccountRole(login, role);
    // A unique name stops InvenTree from revoking a token another run is still using.
    const name = `${tokenPrefix}-${role.toLowerCase()}-${randomUUID().slice(0, 8)}`;
    return { login, name, token: await requestToken(login, name) };
  };

  await use(async (role) => {
    if (!issued.has(role)) issued.set(role, issue(role));
    const entry = issued.get(role);
    if (!entry) throw new Error(`No token for role ${role}`);
    return (await entry).token;
  });

  for (const entry of issued.values()) {
    const { login, name } = await entry.catch(() => ({ login: undefined, name: '' }));
    if (!login) continue;
    await revokeToken(login, name);
    await login.dispose();
  }
}
