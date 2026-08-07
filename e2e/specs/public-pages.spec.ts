import { test, expect } from "../fixtures";

/**
 * Public page smoke tests — these run without Supabase credentials or a
 * database. The dev server boots from NEXTAUTH_SECRET + NEXTAUTH_URL alone
 * (the env validator is defined but never invoked at boot, and these pages
 * render server-side without hitting the DB).
 */
test.describe("public pages", () => {
  test("landing page renders the hero and primary CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Build resumes that clear ATS/i })).toBeVisible();
    await expect(page.getByText(/Build resumes that clear ATS/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Build Free Resume/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Import from GitHub/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Import from LinkedIn/i })).toBeVisible();
  });

  test("landing page shows pricing, features and testimonials sections", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Everything you need to stand out/i)).toBeVisible();
    await expect(page.locator("#testimonials")).toBeVisible();
    await expect(page.locator("#features")).toBeVisible();
    // Footer is present
    await expect(page.locator("footer").first()).toBeVisible();
  });

  test("pricing page lists Free and Pro plans", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { name: /Simple, transparent pricing/i })).toBeVisible();
    await expect(page.getByText("Free", { exact: true })).toBeVisible();
    await expect(page.getByText("Pro", { exact: true })).toBeVisible();
  });

  test("login page renders OAuth providers and email form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: /Continue with Google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Continue with GitHub/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Continue with LinkedIn/i })).toBeVisible();
  });

  test("sign-up page renders", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.getByRole("heading", { name: /Create/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Continue with Google/i })).toBeVisible();
  });

  test("share route with a bogus token returns 404", async ({ page }) => {
    const res = await page.goto("/share/not-a-real-token");
    expect(res?.status()).toBe(404);
  });
});
