import type { APIRequestContext } from '@playwright/test';
import type { GlobalSetting } from '../models';

/** Reads global settings; tests check preconditions with it and never change shared settings. */
export class SettingsService {
  constructor(private request: APIRequestContext) {}

  /** For test preconditions: reads a boolean global setting and stops the test if that fails. */
  async isEnabledOrFail(key: string): Promise<boolean> {
    const response = await this.request.get(`/api/settings/global/${key}/`);
    if (response.status() !== 200) {
      throw new Error(`Could not read setting ${key}: ${response.status()}`);
    }
    const setting = (await response.json()) as GlobalSetting;
    return String(setting.value).toLowerCase() === 'true';
  }
}
