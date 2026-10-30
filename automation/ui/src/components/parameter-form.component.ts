import type { Page, Response } from '@playwright/test';
import { ModalFormComponent } from './modal-form.component';

const PARAMETER_LIST_ENDPOINT = /\/api\/parameter\/$/;

export type ParameterFormInput = {
  /** Name of the parameter template to pick. */
  template: string;
  data: string;
};

/** The Add Parameter dialog opened from a part's Parameters tab. */
export class ParameterFormComponent extends ModalFormComponent {
  constructor(page: Page) {
    super(page, 'Add Parameter');
  }

  async fill(input: ParameterFormInput): Promise<void> {
    await this.selectRelated('template', input.template);
    await this.textField('data').fill(input.data);
  }

  /** Submits and returns the server response to `POST /api/parameter/`. */
  submit(): Promise<Response> {
    return this.submitAndWait(PARAMETER_LIST_ENDPOINT, ['POST']);
  }
}
