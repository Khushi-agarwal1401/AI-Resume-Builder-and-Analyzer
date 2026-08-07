import { test, expect } from "../fixtures";

/**
 * Middleware protection smoke tests. Every non-public route is guarded by
 * NextAuth middleware (withAuth) — an unauthenticated visitor must be
 * redirected to /login. These tests run without a database: the redirect
 * happens in the middleware (JWT cookie check only), before any page code
 * touches Supabase.
 */
test.describe("protected route redirects", () => {
  const protectedPaths = ["/dashboard", "/settings", "/jobs", "/templates", "/analytics", "/builder/00000000-0000-0000-0000-000000000000", "/admin", "/integrations/github", "/integrations/linkedin", "/tools/job-match", "/tools/cover-letter", "/updates", "/notifications"];

  for (const path of protectedPaths) {
    test(`${path} redirects unauthenticated visitors to /login`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL(/\/login/);
      expect(page.url()).toContain("/login");
    });
  }

  test("pricing stays public for unauthenticated visitors", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { name: /Simple, transparent pricing/i })).toBeVisible();
    expect(page.url()).not.toContain("/login");
  });
});
