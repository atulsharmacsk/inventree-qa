import type { Locator, Page } from '@playwright/test';
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
    await this.username.fill(username);
    await this.password.fill(password);
    await this.submit.click();
    await this.page.waitForURL((url) => !url.pathname.includes('login'));
  }
}
