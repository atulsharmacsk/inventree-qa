import type { Locator, Page, Response } from '@playwright/test';
import type { PartFormInput } from '../models/part';

// Form inputs carry generated aria-labels (`text-field-<field>`) instead of label associations; they match API field names.
export class PartFormComponent {
  readonly dialog: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly formError: Locator;

  constructor(private page: Page, title: string) {
    // The dialog's aria-labelledby is not always resolved, so match on its title text instead of its accessible name.
    this.dialog = page.getByRole('dialog').filter({ hasText: title });
    this.submitButton = this.dialog.getByRole('button', { name: 'Submit' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
    this.formError = this.dialog.getByRole('alert', { name: 'Form Error' });
  }

  textField(field: keyof PartFormInput): Locator {
    return this.dialog.getByRole('textbox', { name: `text-field-${field}` });
  }

  /** Validation message the form shows for an empty required field. */
  get requiredFieldError(): Locator {
    return this.dialog.getByText('This field is required.');
  }

  async waitUntilReady(): Promise<void> {
    await this.submitButton.waitFor();
  }

  async fill(input: PartFormInput): Promise<void> {
    for (const [field, value] of Object.entries(input) as [keyof PartFormInput, string | undefined][]) {
      if (value !== undefined) await this.textField(field).fill(value);
    }
  }

  get categoryField(): Locator {
    return this.dialog.getByRole('textbox', { name: 'tree-field-category' });
  }

  /** Opens the category tree field, filters it by name, and picks the matching option. */
  async selectCategory(name: string): Promise<void> {
    await this.categoryField.click();
    await this.categoryField.fill(name);
    await this.page.getByRole('listbox').getByRole('option').filter({ hasText: name }).first().click();
  }

  /** Submits and returns the server response to the part POST/PATCH. */
  async submit(): Promise<Response> {
    const saved = this.page.waitForResponse(
      (response) => /\/api\/part\/(\d+\/)?$/.test(new URL(response.url()).pathname) && ['POST', 'PATCH', 'PUT'].includes(response.request().method()),
    );
    // The "First Use Tour" toast can cover Submit; keyboard activation avoids changing the user's tour state.
    await this.submitButton.focus();
    await this.page.keyboard.press('Enter');
    return saved;
  }
}
