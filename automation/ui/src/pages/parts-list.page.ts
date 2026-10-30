import type { Locator, Page } from '@playwright/test';
import { PartFormComponent } from '../components/part-form.component';
import { ROUTES } from '../models/paths';

/** The Parts table of the category index or of one category. */
export class PartsListPage {
  // Icon-only menu buttons expose only an aria-label, so that label is the stable hook.
  readonly addPartsMenu: Locator;
  readonly createPartItem: Locator;
  readonly searchInput: Locator;
  readonly panelTabs: Locator;

  constructor(private page: Page) {
    this.addPartsMenu = page.getByRole('button', { name: 'action-menu-add-parts' });
    this.createPartItem = page.getByRole('menuitem', { name: 'action-menu-add-parts-create-part' });
    this.searchInput = page.getByRole('textbox', { name: 'table-search-input' });
    this.panelTabs = page.getByRole('tablist', { name: 'panel-tabs-partcategory' });
  }

  panelTab(name: 'Part Categories' | 'Parts'): Locator {
    return this.panelTabs.getByRole('tab', { name, exact: true });
  }

  /** The Parts view opens on the Part Categories panel; this switches to the parts table. */
  async openPartsPanel(): Promise<void> {
    await this.panelTab('Parts').click();
    await this.addPartsMenu.waitFor();
  }

  async goto(categoryId?: number): Promise<void> {
    await this.page.goto(categoryId === undefined ? ROUTES.partsIndex : ROUTES.categoryParts(categoryId));
    // The table search is shown to every user; Add Parts is hidden without create permission.
    await this.searchInput.waitFor();
  }

  async openCreatePartForm(): Promise<PartFormComponent> {
    await this.addPartsMenu.click();
    await this.createPartItem.click();
    const form = new PartFormComponent(this.page, 'Add Part');
    await form.waitUntilReady();
    return form;
  }

  async search(text: string): Promise<void> {
    await this.searchInput.fill(text);
  }

  row(partName: string): Locator {
    return this.page.getByRole('row').filter({ hasText: partName });
  }
}
