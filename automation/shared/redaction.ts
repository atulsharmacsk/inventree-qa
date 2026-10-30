import fs from 'node:fs/promises';
import path from 'node:path';
import { configuredPasswords } from './roles';

const SECRET_COOKIES = 'sessionid|csrftoken';
const SECRET_HEADERS = 'authorization|cookie|set-cookie|x-csrftoken';

/** Replaces tokens, auth and CSRF headers, session cookies, token bodies, and every configured role password. */
export function hideSecrets(text: string): string {
  let result = text
    .replace(new RegExp(`((?:${SECRET_COOKIES})=)[^;"\\s\\\\]+`, 'gi'), '$1<redacted>')
    .replace(new RegExp(`("name"\\s*:\\s*"(?:${SECRET_COOKIES})"\\s*,\\s*"value"\\s*:\\s*")[^"]*`, 'gi'), '$1<redacted>')
    .replace(new RegExp(`("name"\\s*:\\s*"(?:${SECRET_HEADERS})"\\s*,\\s*"value"\\s*:\\s*")[^"]*`, 'gi'), '$1<redacted>')
    .replace(/(Token\s+)[A-Za-z0-9._-]+/g, '$1<redacted>')
    .replace(/(Basic\s+)[A-Za-z0-9+/=]+/g, '$1<redacted>')
    .replace(/("token"\s*:\s*")[^"]*"/g, '$1<redacted>"');

  for (const password of configuredPasswords()) {
    result = result.split(password).join('<redacted>');
  }
  return result;
}

/** All `trace.zip` files below the given output folders. */
export async function findTraceFiles(folders: Iterable<string>): Promise<string[]> {
  const found: string[] = [];
  for (const folder of new Set(folders)) {
    const entries = await fs.readdir(folder, { recursive: true }).catch(() => []);
    found.push(...entries.filter((entry) => path.basename(entry) === 'trace.zip').map((entry) => path.join(folder, entry)));
  }
  return found;
}
