import type { Page, Response } from '@playwright/test';
import { ModalFormComponent } from './modal-form.component';

/** A delete confirmation dialog, for example "Delete Part". */
export class DeleteDialogComponent extends ModalFormComponent {
  constructor(page: Page, title: string, private readonly endpoint: RegExp) {
    super(page, title, 'Delete');
  }

  /** Confirms and returns the server response to the DELETE request. */
  confirm(): Promise<Response> {
    return this.submitAndWait(this.endpoint, ['DELETE']);
  }
}
