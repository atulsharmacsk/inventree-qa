import { expect, type Locator, type Page } from '@playwright/test';
import { ROUTES } from '../models/paths';

// InvenTree gives the login inputs aria-labels but no associated visible label, so these names are the stable hooks.
export class LoginPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly submit: Locator;

  constructor(private page: Page) {
    this.username = page.getByRole('textbox', { name: 'login-username' });
    this.password = page.getByRole('textbox', { name: 'login-password' });
    this.submit = page.getByRole('button', { name: 'Log In' });
  }

  async goto(): Promise<void> {
    await this.page.goto(ROUTES.home);
  }

  async login(username: string, password: string): Promise<void> {
    // The form can accept input before the app wires its handlers, and the shared demo drops some logins; retry the whole submit.
    await expect(async () => {
      await this.username.fill(username);
      await this.fillWithoutStepTitle(this.password, password);
      await this.submit.click();
      await expect(this.page).not.toHaveURL(/login/, { timeout: 10_000 });
    }).toPass({ timeout: 50_000 });
  }

  // fill() puts the value in the step title (`Fill "..."`), which reports store as plain text; evaluate() does not.
  private async fillWithoutStepTitle(input: Locator, value: string): Promise<void> {
    await input.evaluate((element, text) => {
      const field = element as HTMLInputElement;
      // React tracks the native setter, so assigning `field.value` directly would not reach component state.
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(field, text);
      field.dispatchEvent(new Event('input', { bubbles: true }));
    }, value);
  }
}
