import { describe, it, expect, afterEach } from "vitest";
import { resolveAppUrl, appRedirectUrl, needsAuthUrlWarning } from "./redirect-url";

const ORIGINAL_NEXTAUTH_URL = process.env.NEXTAUTH_URL;

afterEach(() => {
  if (ORIGINAL_NEXTAUTH_URL === undefined) delete process.env.NEXTAUTH_URL;
  else process.env.NEXTAUTH_URL = ORIGINAL_NEXTAUTH_URL;
});

describe("resolveAppUrl", () => {
  it("prefers the request origin over NEXTAUTH_URL", () => {
    process.env.NEXTAUTH_URL = "https://stale.example.com";
    const request = { nextUrl: { origin: "https://live.example.com" } };
    expect(resolveAppUrl(request)).toBe("https://live.example.com");
  });

  it("falls back to NEXTAUTH_URL when there is no request context", () => {
    process.env.NEXTAUTH_URL = "https://app.example.com";
    expect(resolveAppUrl()).toBe("https://app.example.com");
  });

  it("strips trailing slashes from the NEXTAUTH_URL fallback", () => {
    process.env.NEXTAUTH_URL = "https://app.example.com///";
    expect(resolveAppUrl()).toBe("https://app.example.com");
  });

  it("returns an empty string when neither source is available", () => {
    delete process.env.NEXTAUTH_URL;
    expect(resolveAppUrl()).toBe("");
  });
});

describe("appRedirectUrl", () => {
  it("builds an absolute path on the request origin", () => {
    const request = { nextUrl: { origin: "https://live.example.com" } };
    expect(appRedirectUrl("/settings?checkout=success", request)).toBe(
      "https://live.example.com/settings?checkout=success"
    );
  });

  it("uses NEXTAUTH_URL as the fallback base", () => {
    process.env.NEXTAUTH_URL = "https://app.example.com";
    expect(appRedirectUrl("/pricing")).toBe("https://app.example.com/pricing");
  });
});

describe("needsAuthUrlWarning", () => {
  it("flags a NEXTAUTH_URL that mismatches the production domain", () => {
    expect(
      needsAuthUrlWarning(
        "app.example.com",
        "app.example.com",
        "https://stale.example.com"
      )
    ).toBe(true);
  });

  it("passes when NEXTAUTH_URL matches the production domain", () => {
    expect(
      needsAuthUrlWarning(
        "app.example.com",
        "app.example.com",
        "https://app.example.com"
      )
    ).toBe(false);
  });

  it("ignores preview/branch deployments", () => {
    expect(
      needsAuthUrlWarning(
        "preview-abc.vercel.app",
        "app.example.com",
        "https://app.example.com"
      )
    ).toBe(false);
  });

  it("returns false when the production URL env is missing (local dev)", () => {
    expect(needsAuthUrlWarning("app.example.com", undefined, "https://x.example.com")).toBe(false);
  });

  it("returns false for a malformed NEXTAUTH_URL instead of throwing", () => {
    expect(needsAuthUrlWarning("app.example.com", "app.example.com", "not-a-url")).toBe(false);
  });
});
