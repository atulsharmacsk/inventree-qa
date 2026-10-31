import type { Locator, Page } from '@playwright/test';
import { ImportSessionFormComponent } from '../components/import-session-form.component';
import { PartFormComponent } from '../components/part-form.component';
import { ROUTES } from '../models/paths';

/** The Parts table of the category index or of one category. */
export class PartsListPage {
  // Icon-only menu buttons expose only an aria-label, so that label is the stable hook.
  readonly addPartsMenu: Locator;
  readonly createPartItem: Locator;
  readonly importFromFileItem: Locator;
  readonly searchInput: Locator;
  readonly panelTabs: Locator;

  constructor(private page: Page) {
    this.addPartsMenu = page.getByRole('button', { name: 'action-menu-add-parts' });
    this.createPartItem = page.getByRole('menuitem', { name: 'action-menu-add-parts-create-part' });
    this.importFromFileItem = page.getByRole('menuitem', { name: 'action-menu-add-parts-import-from-file' });
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

  /** Whether Add Parts > Import from File is offered; leaves the menu open when it is. */
  async canImportFromFile(): Promise<boolean> {
    // The table toolbar, including Add Parts, is complete once the first fetch finishes.
    await this.waitForTable();
    if (!(await this.addPartsMenu.isVisible())) return false;
    await this.addPartsMenu.click();
    return (await this.importFromFileItem.isVisible()) && (await this.importFromFileItem.isEnabled());
  }

  /** Clicks Import from File in the open Add Parts menu. */
  async openImportForm(): Promise<ImportSessionFormComponent> {
    await this.importFromFileItem.click();
    const form = new ImportSessionFormComponent(this.page, 'Import Parts');
    await form.waitUntilReady();
    return form;
  }

  async search(text: string): Promise<void> {
    await this.searchInput.fill(text);
    await this.waitForTable();
  }

  /** Waits until the parts table has finished fetching. */
  async waitForTable(): Promise<void> {
    // The Mantine DataTable spinner has no role or label; this class is present only while a fetch is running.
    await this.page.locator('.mantine-datatable-loader-fetching').waitFor({ state: 'hidden' });
  }

  row(partName: string): Locator {
    return this.page.getByRole('row').filter({ hasText: partName });
  }
}
