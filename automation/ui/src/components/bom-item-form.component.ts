import type { Page, Response } from '@playwright/test';
import { ModalFormComponent } from './modal-form.component';

const BOM_LIST_ENDPOINT = /\/api\/bom\/$/;

export type BomItemFormInput = {
  /** Name of the component part to pick. */
  component: string;
  quantity: number;
};

/** The Add BOM Item dialog opened from an assembly's BOM tab in editing mode. */
export class BomItemFormComponent extends ModalFormComponent {
  constructor(page: Page) {
    super(page, 'Add BOM Item');
  }

  async fill(input: BomItemFormInput): Promise<void> {
    await this.selectRelated('sub_part', input.component);
    // Local 1.6.3 labels the quantity input with its form field name `raw_amount`, not `quantity`.
    await this.textField('raw_amount').fill(String(input.quantity));
  }

  /** Submits and returns the server response to `POST /api/bom/`. */
  submit(): Promise<Response> {
    return this.submitAndWait(BOM_LIST_ENDPOINT, ['POST']);
  }
}
