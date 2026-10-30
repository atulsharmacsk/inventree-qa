import type { Locator, Page } from '@playwright/test';
import { ROUTES } from '../models/paths';

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

  constructor(private page: Page) {
    this.tabs = page.getByRole('tablist', { name: 'panel-tabs-part' });
    this.partActionsMenu = page.getByRole('button', { name: 'action-menu-part-actions' });
  }

  async goto(partId: number): Promise<void> {
    await this.page.goto(ROUTES.part(partId));
    await this.tabs.waitFor();
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
