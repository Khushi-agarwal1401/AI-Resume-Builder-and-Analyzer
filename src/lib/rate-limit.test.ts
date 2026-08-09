import { describe, it, expect } from "vitest";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("returns true immediately when bypass is set (admin exemption)", async () => {
    // The bypass short-circuits before any Redis call, so this is safe in a
    // test environment with no Redis running.
    await expect(checkRateLimit("test:1", 1, 60000, { bypass: true })).resolves.toBe(true);
  });

  it("returns true immediately when maxRequests is unlimited (>= 9999)", async () => {
    await expect(checkRateLimit("test:1", 9999, 60000)).resolves.toBe(true);
  });

  it("returns true immediately when bypass is set even with an unlimited cap", async () => {
    await expect(checkRateLimit("test:1", 1, 1000, { bypass: true })).resolves.toBe(true);
  });
});

describe("getRateLimitHeaders", () => {
  it("reports full remaining when bypassed (admin)", async () => {
    const headers = await getRateLimitHeaders("test:1", 10, { bypass: true });
    expect(headers["X-RateLimit-Limit"]).toBe("10");
    expect(headers["X-RateLimit-Remaining"]).toBe("10");
  });
});
