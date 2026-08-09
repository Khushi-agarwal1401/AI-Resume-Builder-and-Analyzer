import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// isAdmin reads process.env.ADMIN_EMAILS at module-eval time, so the test sets
// the env var and re-imports the module fresh (vi.resetModules + dynamic import).
// The DB branch is exercised via a mocked query client.

// Chainable db stub resolving a single profiles row (or null).
const mockDbFrom = vi.fn();
vi.mock("@/lib/db/server", () => ({
  createServerClient: vi.fn(async () => ({ from: mockDbFrom })),
}));

function dbChain(role: string | null) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const self: Record<string, any> = {
    select: vi.fn(() => self),
    eq: vi.fn(() => self),
    single: vi.fn(() => self),
    then: (resolve: (v: unknown) => void) =>
      resolve(role == null ? { data: null, error: null } : { data: { role }, error: null }),
  };
  return self;
}

const ORIGINAL_ADMIN_EMAILS = process.env.ADMIN_EMAILS;

async function loadIsAdmin() {
  vi.resetModules();
  const mod = await import("./admin");
  return mod.isAdmin;
}

describe("isAdmin (ADMIN_EMAILS env detection)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default DB row: a regular user. Tests that need the DB-admin branch override.
    mockDbFrom.mockReturnValue(dbChain("user"));
  });

  afterEach(() => {
    if (ORIGINAL_ADMIN_EMAILS === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = ORIGINAL_ADMIN_EMAILS;
  });

  it("returns true for both emails listed in ADMIN_EMAILS without a DB lookup", async () => {
    process.env.ADMIN_EMAILS = "radheshyambhatiig@gmail.com,khushiagarwalg1@gmail.com";
    const isAdmin = await loadIsAdmin();

    await expect(isAdmin("u-1", "radheshyambhatiig@gmail.com")).resolves.toBe(true);
    await expect(isAdmin("u-2", "khushiagarwalg1@gmail.com")).resolves.toBe(true);
    // The env match short-circuits before any profiles query runs.
    expect(mockDbFrom).not.toHaveBeenCalled();
  });

  it("matches case-insensitively and trims whitespace in the ADMIN_EMAILS list", async () => {
    process.env.ADMIN_EMAILS = "  Radheshyambhatiig@gmail.com , khushiagarwalg1@gmail.com  ";
    const isAdmin = await loadIsAdmin();

    // Incoming session emails are already normalized, so only the env-list side
    // is trimmed; both sides are compared case-insensitively.
    await expect(isAdmin("u-1", "RADHESHYAMBHATIIG@GMAIL.COM")).resolves.toBe(true);
    await expect(isAdmin("u-1", "Khushiagarwalg1@gmail.com")).resolves.toBe(true);
  });

  it("falls back to the DB role for emails not listed in ADMIN_EMAILS", async () => {
    process.env.ADMIN_EMAILS = "radheshyambhatiig@gmail.com";
    const isAdmin = await loadIsAdmin();

    mockDbFrom.mockReturnValue(dbChain("admin"));
    await expect(isAdmin("u-1", "someone-else@gmail.com")).resolves.toBe(true);

    mockDbFrom.mockReturnValue(dbChain("user"));
    await expect(isAdmin("u-1", "someone-else@gmail.com")).resolves.toBe(false);
    // The unlisted email hit the DB path (once per call above).
    expect(mockDbFrom).toHaveBeenCalledWith("profiles");
  });

  it("returns false for unlisted emails when ADMIN_EMAILS is empty", async () => {
    process.env.ADMIN_EMAILS = "";
    const isAdmin = await loadIsAdmin();

    await expect(isAdmin("u-1", "random@other.com")).resolves.toBe(false);
  });

  it("treats a missing ADMIN_EMAILS as empty and consults the DB only", async () => {
    delete process.env.ADMIN_EMAILS;
    const isAdmin = await loadIsAdmin();

    mockDbFrom.mockReturnValue(dbChain("admin"));
    await expect(isAdmin("u-1", "db-admin@example.com")).resolves.toBe(true);
  });

  it("keeps .env.example's documented admin list in sync with the tested addresses", () => {
    const example = readFileSync(resolve(process.cwd(), ".env.example"), "utf8");
    const line = example.split("\n").find((l) => l.startsWith("ADMIN_EMAILS="));
    expect(line).toBeTruthy();
    expect(line).toContain("radheshyambhatiig@gmail.com");
    expect(line).toContain("khushiagarwalg1@gmail.com");
  });
});
