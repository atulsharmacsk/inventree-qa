import type { Locator, Page } from '@playwright/test';
import { StockItemFormComponent } from '../components/stock-item-form.component';
import { ROUTES } from '../models/paths';

/** The Stock Items tab of a stock location. */
export class StockLocationPage {
  readonly tabs: Locator;
  readonly addStockItemButton: Locator;

  constructor(private page: Page) {
    this.tabs = page.getByRole('tablist', { name: 'panel-tabs-stocklocation' });
    // Icon-only button; its generated aria-label is the only accessible name.
    this.addStockItemButton = page.getByRole('tabpanel').getByRole('button', { name: 'action-button-add-stock-item' });
  }

  async gotoStockItems(locationId: number): Promise<void> {
    await this.page.goto(ROUTES.stockLocationItems(locationId));
    await this.tabs.waitFor();
  }

  async openAddStockItemForm(): Promise<StockItemFormComponent> {
    await this.addStockItemButton.click();
    const form = new StockItemFormComponent(this.page);
    await form.waitUntilReady();
    return form;
  }
}
