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

// allure-playwright copies each trace into its results folder as `<uuid>-attachment.zip`.
const isTraceArchive = (entry: string): boolean => /^(trace|.+-attachment)\.zip$/.test(path.basename(entry));

/** All Playwright trace archives (including Allure copies) below the given folders. */
export async function findTraceFiles(folders: Iterable<string>): Promise<string[]> {
  const found: string[] = [];
  for (const folder of new Set(folders)) {
    const entries = await fs.readdir(folder, { recursive: true }).catch(() => []);
    found.push(...entries.filter(isTraceArchive).map((entry) => path.join(folder, entry)));
  }
  return found;
}

// Failure page snapshots (error-context.md) show typed field values; Allure stores steps and attachments as files.
const TEXT_ARTIFACT = /\.(md|json|txt)$/i;

/** Rewrites text artifacts below the given folders with secrets hidden. */
export async function redactTextFiles(folders: Iterable<string>): Promise<void> {
  for (const folder of new Set(folders)) {
    const entries = await fs.readdir(folder, { recursive: true }).catch(() => []);
    for (const file of entries.filter((entry) => TEXT_ARTIFACT.test(entry)).map((entry) => path.join(folder, entry))) {
      const original = await fs.readFile(file, 'utf8');
      const cleaned = hideSecrets(original);
      if (cleaned !== original) await fs.writeFile(file, cleaned);
    }
  }
}
