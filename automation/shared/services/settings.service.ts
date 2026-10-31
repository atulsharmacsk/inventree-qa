import type { APIRequestContext } from '@playwright/test';
import type { GlobalSetting } from '../models';

/** Reads global settings for preconditions; only the `settings` projects change them, through `overrideGlobalSettings`. */
export class SettingsService {
  constructor(private request: APIRequestContext) {}

  /** For test preconditions: reads a boolean global setting and stops the test if that fails. */
  async isEnabledOrFail(key: string): Promise<boolean> {
    return (await this.valueOrFail(key)).toLowerCase() === 'true';
  }

  async valueOrFail(key: string): Promise<string> {
    const response = await this.request.get(`/api/settings/global/${key}/`);
    if (response.status() !== 200) {
      throw new Error(`Could not read setting ${key}: ${response.status()}`);
    }
    return String(((await response.json()) as GlobalSetting).value);
  }

  async setOrFail(key: string, value: string): Promise<void> {
    const response = await this.request.patch(`/api/settings/global/${key}/`, { data: { value } });
    if (response.status() !== 200) {
      throw new Error(`Could not set setting ${key}: ${response.status()} ${await response.text()}`);
    }
  }
}

/** Sets global settings for one test and restores every original value afterwards; throws if any restore fails. */
export async function overrideGlobalSettings(
  settings: SettingsService,
  use: (set: (key: string, value: string) => Promise<void>) => Promise<void>,
): Promise<void> {
  const originals = new Map<string, string>();
  try {
    await use(async (key, value) => {
      if (!originals.has(key)) originals.set(key, await settings.valueOrFail(key));
      await settings.setOrFail(key, value);
    });
  } finally {
    const failures: string[] = [];
    for (const [key, value] of originals) {
      await settings.setOrFail(key, value).catch((error: Error) => failures.push(error.message));
      const restored = await settings.valueOrFail(key).catch(() => '<unreadable>');
      if (restored.toLowerCase() !== value.toLowerCase()) failures.push(`${key} is ${restored}, expected the original ${value}`);
    }
    if (failures.length) throw new Error(`Global settings were not restored: ${failures.join('; ')}`);
  }
}
