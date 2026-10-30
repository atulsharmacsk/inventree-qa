import type { Page, Response } from '@playwright/test';
import { ModalFormComponent } from './modal-form.component';

const STOCK_LIST_ENDPOINT = /\/api\/stock\/$/;

export type StockItemFormInput = {
  quantity: number;
  serialNumbers?: string;
};

/** The Add Stock Item dialog opened from a part's Stock tab. */
export class StockItemFormComponent extends ModalFormComponent {
  constructor(page: Page) {
    super(page, 'Add Stock Item');
  }

  async fill(input: StockItemFormInput): Promise<void> {
    await this.numberField('quantity').fill(String(input.quantity));
    if (input.serialNumbers !== undefined) await this.textField('serial_numbers').fill(input.serialNumbers);
  }

  /** Submits and returns the server response to `POST /api/stock/`. */
  submit(): Promise<Response> {
    return this.submitAndWait(STOCK_LIST_ENDPOINT, ['POST']);
  }
}
