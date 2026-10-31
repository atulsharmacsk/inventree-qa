import type { Response } from '@playwright/test';
import { ModalFormComponent } from './modal-form.component';

export type UploadFile = { name: string; mimeType: string; buffer: Buffer };

/** The Import Parts dialog: upload a data file and create an import session. */
export class ImportSessionFormComponent extends ModalFormComponent {
  async upload(file: UploadFile): Promise<void> {
    // Mantine's FileInput is a button labelled `file-field-data_file` backed by a hidden file input.
    await this.dialog.locator('input[type="file"]').setInputFiles(file);
  }

  submit(): Promise<Response> {
    return this.submitAndWait(/\/api\/importer\/session\/$/, ['POST']);
  }
}
