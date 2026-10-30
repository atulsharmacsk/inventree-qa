import type { Locator, Page } from '@playwright/test';
import { ROUTES } from '../models/paths';

export type MainSection = 'Dashboard' | 'Parts' | 'Stock' | 'Manufacturing' | 'Purchasing' | 'Sales';

/** The main header tabs and the breadcrumb bar. */
export class NavigationComponent {
  readonly mainTabs: Locator;

  // The header tablist has no accessible name; it is the only one with a Dashboard tab.
  constructor(private readonly page: Page) {
    this.mainTabs = page.getByRole('tablist').filter({ has: page.getByRole('tab', { name: 'Dashboard', exact: true }) });
  }

  async goHome(): Promise<void> {
    await this.page.goto(ROUTES.home);
  }

  section(name: MainSection): Locator {
    return this.mainTabs.getByRole('tab', { name, exact: true });
  }

  // 1.6.x wraps a link inside each tab; 1.7.0 dev renders the tab alone, so click the tab.
  async open(name: MainSection): Promise<void> {
    await this.section(name).click();
  }
}
