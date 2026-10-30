import type { Locator, Page } from '@playwright/test';

export type MainSection = 'Dashboard' | 'Parts' | 'Stock' | 'Manufacturing' | 'Purchasing' | 'Sales';

/** The main header tabs and the breadcrumb bar. */
export class NavigationComponent {
  readonly mainTabs: Locator;

  // The header tablist has no accessible name; it is the only one with a Dashboard tab.
  constructor(page: Page) {
    this.mainTabs = page.getByRole('tablist').filter({ has: page.getByRole('tab', { name: 'Dashboard', exact: true }) });
  }

  section(name: MainSection): Locator {
    return this.mainTabs.getByRole('tab', { name, exact: true });
  }

  async open(name: MainSection): Promise<void> {
    await this.section(name).getByRole('link').click();
  }
}
