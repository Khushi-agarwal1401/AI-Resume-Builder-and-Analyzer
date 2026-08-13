import { describe, it, expect, vi, beforeEach } from "vitest";
import { logAiRequest } from "./log";

const insertMock = vi.fn();

vi.mock("@/lib/db/server", () => ({
  createServerClient: vi.fn().mockResolvedValue({
    from: vi.fn(() => ({ insert: insertMock })),
  }),
}));

beforeEach(() => {
  insertMock.mockReset();
  insertMock.mockResolvedValue({ data: null, error: null });
});

describe("logAiRequest", () => {
  it("inserts a row with provider, model, latency and outcome", async () => {
    await logAiRequest({
      action: "generate-summary",
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      success: true,
      latency_ms: 812,
    });

    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertMock.mock.calls[0][0]).toMatchObject({
      action: "generate-summary",
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      success: true,
      latency_ms: 812,
      error: "",
    });
  });

  it("defaults empty provider/model and truncates long errors", async () => {
    await logAiRequest({
      action: "analyze-jd",
      success: false,
      latency_ms: 1200,
      error: "x".repeat(2000),
    });

    const payload = insertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.provider).toBe("");
    expect(payload.model).toBe("");
    expect(String(payload.error).length).toBe(500);
  });

  it("never throws when the database write fails", async () => {
    insertMock.mockRejectedValue(new Error("db down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      logAiRequest({ action: "generate-summary", success: true, latency_ms: 10 })
    ).resolves.toBeUndefined();

    spy.mockRestore();
  });
});
