import { type Locator, type Page } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Your Resumes" });
  }

  async goto() {
    await this.page.goto("/dashboard");
  }
}
