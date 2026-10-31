import type { Locator, Page, Response } from '@playwright/test';
import type { PartFormInput } from '../models/part';
import { ModalFormComponent } from './modal-form.component';

const PART_ENDPOINT = /\/api\/part\/(\d+\/)?$/;

/** The Add Part and Edit Part dialogs. */
export class PartFormComponent extends ModalFormComponent {
  constructor(page: Page, title: 'Add Part' | 'Edit Part') {
    super(page, title);
  }

  /** Validation message the form shows for an empty required field. */
  get requiredFieldError(): Locator {
    return this.dialog.getByText('This field is required.');
  }

  get categoryField(): Locator {
    return this.treeField('category');
  }

  get activeSwitch(): Locator {
    return this.switchField('active');
  }

  async fill(input: PartFormInput): Promise<void> {
    for (const [field, value] of Object.entries(input) as [keyof PartFormInput, string | undefined][]) {
      if (value !== undefined) await this.textField(field).fill(value);
    }
  }

  async selectCategory(name: string): Promise<void> {
    await this.selectTreeOption('category', name);
  }

  /** Fills the Initial Stock section, shown only while the Initial Stock Data setting (PART_CREATE_INITIAL) is on. */
  async fillInitialStock(quantity: number, locationName: string): Promise<void> {
    await this.numberField('initial_stock.quantity').fill(String(quantity));
    await this.selectTreeOption('initial_stock.location', locationName);
  }

  /** Sets the Active switch; the edit form loads the part's values first, so this waits for the switch. */
  async setActive(active: boolean): Promise<void> {
    await this.activeSwitch.waitFor({ state: 'attached' });
    // The Mantine switch input is visually hidden behind its track, so it is toggled with force.
    await this.activeSwitch.setChecked(active, { force: true });
  }

  /** Submits and returns the server response to the part POST/PATCH. */
  submit(): Promise<Response> {
    return this.submitAndWait(PART_ENDPOINT, ['POST', 'PATCH', 'PUT']);
  }
}
