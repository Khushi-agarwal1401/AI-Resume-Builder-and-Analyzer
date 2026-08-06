import { type Locator, type Page } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorText: Locator;
  readonly createAccountLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel("Email address");
    this.passwordInput = page.getByLabel("Password");
    this.submitButton = page.getByRole("button", { name: /Sign in/ });
    this.errorText = page.getByText("Invalid email or password");
    this.createAccountLink = page.getByRole("link", { name: "Create an account" });
  }

  async goto() {
    await this.page.goto("/login");
  }

  async fillCredentials(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async login(email: string, password: string) {
    await this.goto();
    await this.fillCredentials(email, password);
    await this.submit();
  }
}
