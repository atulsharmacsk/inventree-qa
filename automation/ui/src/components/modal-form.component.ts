import type { Locator, Page, Response } from '@playwright/test';

type HttpMethod = 'POST' | 'PATCH' | 'PUT' | 'DELETE';

// Form inputs carry generated aria-labels (`text-field-<field>`, `number-field-<field>`, `boolean-field-<field>`) instead of label associations; they match API field names.
/** A modal API form: dialog, fields by API name, form error, and submit that returns the server response. */
export class ModalFormComponent {
  readonly dialog: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly formError: Locator;

  constructor(protected readonly page: Page, title: string, submitLabel = 'Submit') {
    // The dialog's aria-labelledby is not always resolved, so match on its title text instead of its accessible name.
    this.dialog = page.getByRole('dialog').filter({ hasText: title });
    this.submitButton = this.dialog.getByRole('button', { name: submitLabel });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
    this.formError = this.dialog.getByRole('alert', { name: 'Form Error' });
  }

  textField(field: string): Locator {
    return this.dialog.getByRole('textbox', { name: `text-field-${field}` });
  }

  numberField(field: string): Locator {
    return this.dialog.getByRole('textbox', { name: `number-field-${field}` });
  }

  switchField(field: string): Locator {
    return this.dialog.getByRole('switch', { name: `boolean-field-${field}` });
  }

  async waitUntilReady(): Promise<void> {
    await this.submitButton.waitFor();
  }

  /** Submits and returns the first matching response, so specs can check what the server did. */
  protected async submitAndWait(path: RegExp, methods: HttpMethod[]): Promise<Response> {
    const saved = this.page.waitForResponse(
      (response) =>
        path.test(new URL(response.url()).pathname) && (methods as string[]).includes(response.request().method()),
    );
    // The "First Use Tour" toast can cover Submit; keyboard activation avoids changing the user's tour state.
    await this.submitButton.focus();
    await this.page.keyboard.press('Enter');
    return saved;
  }
}
