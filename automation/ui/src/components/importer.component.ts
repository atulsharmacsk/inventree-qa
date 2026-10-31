import type { Locator, Page } from '@playwright/test';

// Mapping, row loading, and validation run in the background worker, so rows can take a while to appear.
const ROWS_LOADED_TIMEOUT = 30_000;

/** The "Importing Data" dialog opened after an import session is created: column mapping, then the rows to process. */
export class ImporterComponent {
  readonly dialog: Locator;
  readonly acceptMappingButton: Locator;

  constructor(private page: Page) {
    this.dialog = page.getByRole('dialog').filter({ hasText: 'Importing Data' });
    this.acceptMappingButton = this.dialog.getByRole('button', { name: 'Accept Column Mapping' });
  }

  /** Accepts the suggested column mapping and waits until the row containing `rowText` is listed. */
  async acceptMapping(rowText: string): Promise<void> {
    await this.acceptMappingButton.click();
    await this.row(rowText).waitFor({ timeout: ROWS_LOADED_TIMEOUT });
  }

  row(text: string): Locator {
    return this.dialog.getByRole('row').filter({ hasText: text });
  }

  /** The red status icon of a row with errors. */
  errorIcon(row: Locator): Locator {
    // The icon has no role or accessible name; Tabler's icon class is the only stable hook.
    return row.locator('.tabler-icon-exclamation-circle');
  }

  /** Hovers a row's error icon and returns the hover card listing its errors. */
  async openRowErrors(row: Locator): Promise<Locator> {
    await this.errorIcon(row).hover();
    // The hover card renders in a portal outside the importer dialog.
    return this.page.getByRole('dialog').filter({ hasText: 'Row contains errors' });
  }
}
