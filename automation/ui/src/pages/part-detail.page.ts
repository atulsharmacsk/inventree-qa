import type { Locator, Page } from '@playwright/test';
import { BomItemFormComponent } from '../components/bom-item-form.component';
import { DeleteDialogComponent } from '../components/delete-dialog.component';
import { ParameterFormComponent } from '../components/parameter-form.component';
import { PartFormComponent } from '../components/part-form.component';
import { StockItemFormComponent } from '../components/stock-item-form.component';
import { ROUTES } from '../models/paths';

export type PartAction = 'duplicate' | 'edit' | 'delete';

export type PartTab =
  | 'Part Details'
  | 'Stock'
  | 'Allocations'
  | 'Bill of Materials'
  | 'Build Orders'
  | 'Used In'
  | 'Variants'
  | 'Parameters'
  | 'Attachments'
  | 'Related Parts'
  | 'Test Templates'
  | 'Notes';

/** The part detail page: header, Part Details table, tabs, and the part actions menu. */
export class PartDetailPage {
  readonly tabs: Locator;
  readonly partActionsMenu: Locator;
  readonly addStockItemButton: Locator;

  constructor(private page: Page) {
    this.tabs = page.getByRole('tablist', { name: 'panel-tabs-part' });
    this.partActionsMenu = page.getByRole('button', { name: 'action-menu-part-actions' });
    // Icon-only button; its generated aria-label is the only accessible name.
    this.addStockItemButton = page.getByRole('button', { name: 'action-button-add-stock-item' });
  }

  async goto(partId: number): Promise<void> {
    await this.page.goto(ROUTES.part(partId));
    await this.tabs.waitFor();
  }

  async reload(): Promise<void> {
    await this.page.reload();
    await this.tabs.waitFor();
  }

  /** An item of the part actions menu; the menu must be open. */
  partAction(action: PartAction): Locator {
    return this.page.getByRole('menuitem', { name: `action-menu-part-actions-${action}` });
  }

  async openPartActions(): Promise<void> {
    await this.partActionsMenu.click();
  }

  async openEditForm(): Promise<PartFormComponent> {
    await this.openPartActions();
    await this.partAction('edit').click();
    const form = new PartFormComponent(this.page, 'Edit Part');
    await form.waitUntilReady();
    return form;
  }

  async openDeleteDialog(partId: number): Promise<DeleteDialogComponent> {
    await this.openPartActions();
    await this.partAction('delete').click();
    const dialog = new DeleteDialogComponent(this.page, 'Delete Part', new RegExp(`/api/part/${partId}/$`));
    await dialog.waitUntilReady();
    return dialog;
  }

  async openAddStockItemForm(): Promise<StockItemFormComponent> {
    await this.openTab('Stock');
    await this.addStockItemButton.click();
    const form = new StockItemFormComponent(this.page);
    await form.waitUntilReady();
    return form;
  }

  /** Opens the Stock tab, waits for its table, and reports whether Add Stock Item is shown and enabled. */
  async canAddStockItem(): Promise<boolean> {
    await this.openTab('Stock');
    await this.waitForTable('Stock');
    return (await this.addStockItemButton.isVisible()) && (await this.addStockItemButton.isEnabled());
  }

  /** BOM tab > Edit BOM > Add BOM Items > Add BOM Item. */
  async openAddBomItemForm(): Promise<BomItemFormComponent> {
    await this.openTab('Bill of Materials');
    const panel = this.tabPanel('Bill of Materials');
    // Icon-only toolbar controls expose only their generated aria-labels.
    await panel.getByRole('button', { name: 'action-button-edit-bom' }).click();
    await panel.getByRole('button', { name: 'action-menu-add-bom-items' }).click();
    await this.page.getByRole('menuitem', { name: 'action-menu-add-bom-items-add-bom-item' }).click();
    const form = new BomItemFormComponent(this.page);
    await form.waitUntilReady();
    return form;
  }

  /** Parameters tab > Add Parameters > Create Parameter. */
  async openAddParameterForm(): Promise<ParameterFormComponent> {
    await this.openTab('Parameters');
    await this.tabPanel('Parameters').getByRole('button', { name: 'action-menu-add-parameters' }).click();
    await this.page.getByRole('menuitem', { name: 'action-menu-add-parameters-create-parameter' }).click();
    const form = new ParameterFormComponent(this.page);
    await form.waitUntilReady();
    return form;
  }

  /** Variants tab > Add Parts > Create Part; the form is pre-filled as a variant of this part. */
  async openCreateVariantForm(): Promise<PartFormComponent> {
    await this.openTab('Variants');
    await this.tabPanel('Variants').getByRole('button', { name: 'action-menu-add-parts' }).click();
    await this.page.getByRole('menuitem', { name: 'action-menu-add-parts-create-part' }).click();
    const form = new PartFormComponent(this.page, 'Add Part');
    await form.waitUntilReady();
    return form;
  }

  tabPanel(name: PartTab): Locator {
    return this.page.getByRole('tabpanel', { name });
  }

  /** Table rows in a tab panel that contain `text`, for example a location or part name. */
  tableRows(tab: PartTab, text: string): Locator {
    return this.tabPanel(tab).getByRole('row').filter({ hasText: text });
  }

  /** Waits until the tab's table has finished fetching, so row checks do not run against the loading state. */
  async waitForTable(tab: PartTab): Promise<void> {
    // The Mantine DataTable spinner has no role or label; this class is present only while a fetch is running.
    await this.tabPanel(tab).locator('.mantine-datatable-loader-fetching').waitFor({ state: 'hidden' });
  }

  /** The page title paragraph, for example "Part: Widget". */
  title(partName: string): Locator {
    return this.page.getByText(`Part: ${partName}`, { exact: true });
  }

  /** The value cell for a row of the Part Details tables, for example `detail('Description')`. */
  detail(label: string): Locator {
    return this.page
      .getByRole('tabpanel', { name: 'Part Details' })
      .getByRole('row')
      .filter({ has: this.page.getByRole('cell', { name: label, exact: true }) })
      .getByRole('cell')
      .nth(1);
  }

  tab(name: PartTab): Locator {
    return this.tabs.getByRole('tab', { name, exact: true });
  }

  async openTab(name: PartTab): Promise<void> {
    await this.tab(name).click();
  }

  /** Reads the part id from the current `/web/part/<id>/` URL. */
  currentPartId(): number {
    const match = /\/web\/part\/(\d+)/.exec(new URL(this.page.url()).pathname);
    if (!match) throw new Error(`Not on a part detail page: ${this.page.url()}`);
    return Number(match[1]);
  }
}
