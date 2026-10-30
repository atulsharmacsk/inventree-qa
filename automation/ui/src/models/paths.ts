import path from 'node:path';
import type { Role } from '../../../shared/roles';

/** Logged-in browser state per role, written by `tests/auth.setup.ts`; git-ignored because it holds the session cookie. */
export const storageStatePath = (role: Role): string =>
  path.resolve(__dirname, '..', '..', 'playwright', '.auth', `${role.toLowerCase()}.json`);

/** Front-end routes used by page objects. */
export const ROUTES = {
  home: '/web/',
  partsIndex: '/web/part/category/index/parts',
  categoryParts: (id: number) => `/web/part/category/${id}/parts`,
  part: (id: number) => `/web/part/${id}/`,
} as const;
