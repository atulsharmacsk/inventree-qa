import type { Locator, Page, Response } from '@playwright/test';

type HttpMethod = 'POST' | 'PATCH' | 'PUT' | 'DELETE';

// Form inputs carry generated aria-labels (`text-field-<field>`, `number-field-<field>`, `boolean-field-<field>`) instead of label associations; they match API field names.
/** A modal API form: dialog, fields by API name, form error, and submit that returns the server response. */
export class ModalFormComponent {
  readonly dialog: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly formError: Locator;

  constructor(
    protected readonly page: Page,
    title: string,
    submitLabel = 'Submit',
  ) {
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

  relatedField(field: string): Locator {
    return this.dialog.getByRole('combobox', { name: `related-field-${field}` });
  }

  treeField(field: string): Locator {
    return this.dialog.getByRole('textbox', { name: `tree-field-${field}` });
  }

  /** Opens a tree field (category, location), filters it by name, and picks the matching option. */
  async selectTreeOption(field: string, name: string): Promise<void> {
    await this.treeField(field).click();
    await this.treeField(field).fill(name);
    await this.page.getByRole('listbox').getByRole('option').filter({ hasText: name }).first().click();
  }

  /** Searches a related-record field and picks the option containing `text`. */
  async selectRelated(field: string, text: string): Promise<void> {
    await this.searchRelated(field, text);
    await this.relatedOption(text).first().click();
  }

  /** Types into a related-record field so it lists the matching records, without picking one. */
  async searchRelated(field: string, text: string): Promise<void> {
    await this.relatedField(field).fill(text);
  }

  /** Options of an open related-record field that contain `text`. */
  relatedOption(text: string): Locator {
    // The options menu is rendered in a portal on the page body, outside the dialog.
    return this.page.getByRole('option').filter({ hasText: text });
  }

  async waitUntilReady(): Promise<void> {
    await this.submitButton.waitFor();
  }

  /** Submits and returns the first matching response, so specs can check what the server did. */
  protected async submitAndWait(path: RegExp, methods: HttpMethod[]): Promise<Response> {
    const matches = (url: string, method: string): boolean => path.test(new URL(url).pathname) && (methods as string[]).includes(method);
    const saved = this.page.waitForResponse((response) => matches(response.url(), response.request().method()));
    // A dispatched click is not blocked by the "First Use Tour" toast covering Submit.
    // Just after a related-field option is chosen, a click can be ignored; click again until the request starts.
    for (let attempt = 1; ; attempt++) {
      const sent = this.page.waitForRequest((request) => matches(request.url(), request.method()), {
        timeout: SUBMIT_REQUEST_TIMEOUT,
      });
      await this.submitButton.dispatchEvent('click');
      try {
        await sent;
        return await saved;
      } catch (error) {
        if (attempt >= SUBMIT_ATTEMPTS) throw error;
      }
    }
  }
}

const SUBMIT_REQUEST_TIMEOUT = 5_000;
const SUBMIT_ATTEMPTS = 3;
