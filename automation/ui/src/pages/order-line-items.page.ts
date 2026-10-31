import type { Locator, Page } from '@playwright/test';
import type { OrderKind } from '../../../shared/models';
import { ModalFormComponent } from '../components/modal-form.component';
import { ROUTES } from '../models/paths';

const LINE_ITEMS_ROUTE: Record<OrderKind, (id: number) => string> = {
  po: ROUTES.purchaseOrderLineItems,
  so: ROUTES.salesOrderLineItems,
};

/** The Line Items tab of a purchase or sales order. */
export class OrderLineItemsPage {
  readonly panel: Locator;

  constructor(private page: Page) {
    this.panel = page.getByRole('tabpanel', { name: 'Line Items' });
  }

  async goto(kind: OrderKind, orderId: number): Promise<void> {
    await this.page.goto(LINE_ITEMS_ROUTE[kind](orderId));
    await this.panel.waitFor();
  }

  /** Add Line Item menu > Add Line Item. */
  async openAddLineItemForm(): Promise<ModalFormComponent> {
    // Icon-only menu; its generated aria-label is the only accessible name.
    await this.panel.getByRole('button', { name: 'action-menu-add-line-item' }).click();
    await this.page.getByRole('menuitem', { name: 'action-menu-add-line-item-add-line-item' }).click();
    const form = new ModalFormComponent(this.page, 'Add Line Item');
    await form.waitUntilReady();
    return form;
  }
}
