import { describe, it, expect, vi, afterEach } from "vitest";
import { callAi } from "./client";
import type { AiRequest } from "@/types/ai";

vi.mock("@/services/ai/prompts", () => ({
  getPrompt: vi.fn().mockResolvedValue("Template {input} {context}"),
}));

vi.mock("@/services/ai/log", () => ({
  logAiRequest: vi.fn().mockResolvedValue(undefined),
}));

const GEMINI_URL_PREFIX = "https://generativelanguage.googleapis.com/v1beta/models/";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const BASE_REQUEST: AiRequest = {
  action: "generate-summary",
  input: "Built a dashboard in React",
  context: "Senior frontend engineer",
};

function mockFetch(
  responder: (url: string, init: RequestInit) => { ok: boolean; status?: number; json?: unknown; text?: string }
) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      const r = responder(url, init);
      return {
        ok: r.ok,
        status: r.status ?? 200,
        statusText: r.ok ? "OK" : "Error",
        json: async () => r.json,
        text: async () => r.text ?? "",
      } as unknown as Response;
    })
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

/** Ensure no provider key leaks in from the shell/test environment. */
function clearKeys() {
  vi.stubEnv("GEMINI_API_KEY", "");
  vi.stubEnv("GROQ_API_KEY", "");
}

describe("callAi (Groq primary + Gemini fallback)", () => {
  it("returns a config error when neither API key is set", async () => {
    clearKeys();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await callAi(BASE_REQUEST);

    expect(result).toEqual({ success: false, output: "", error: "GROQ_API_KEY not configured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls Groq first when its key is configured and returns the output", async () => {
    clearKeys();
    vi.stubEnv("GROQ_API_KEY", "groq-key");
    mockFetch((url) =>
      url === GROQ_URL
        ? { ok: true, json: { choices: [{ message: { content: "Built a dashboard for tracking" } }] } }
        : { ok: false, status: 404 }
    );

    const result = await callAi(BASE_REQUEST);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output).toBe("Built a dashboard for tracking");
      expect(result.warnings).toBeUndefined();
      expect(result.provider).toBe("groq");
      expect(result.model).toBe("llama-3.3-70b-versatile");
    }
    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe(GROQ_URL);
  });

  it("flags fabricated numeric claims in Groq output", async () => {
    clearKeys();
    vi.stubEnv("GROQ_API_KEY", "groq-key");
    mockFetch((url) =>
      url === GROQ_URL
        ? { ok: true, json: { choices: [{ message: { content: "Improved performance by 40%" } }] } }
        : { ok: false, status: 404 }
    );

    const result = await callAi(BASE_REQUEST);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings![0]).toContain("40%");
    }
  });

  it("falls back to Gemini when Groq fails (500)", async () => {
    clearKeys();
    vi.stubEnv("GROQ_API_KEY", "groq-key");
    vi.stubEnv("GEMINI_API_KEY", "gemini-key");
    mockFetch((url) =>
      url === GROQ_URL
        ? { ok: false, status: 500, text: "boom" }
        : url.startsWith(GEMINI_URL_PREFIX)
          ? { ok: true, json: { candidates: [{ content: { parts: [{ text: "Gemini saved the day" }] } }] } }
          : { ok: false, status: 404 }
    );

    const result = await callAi(BASE_REQUEST);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output).toBe("Gemini saved the day");
      expect(result.provider).toBe("gemini");
      expect(result.model).toBe("gemini-3.5-flash");
    }
    const fetchMock = vi.mocked(fetch);
    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(urls[0]).toBe(GROQ_URL);
    expect(urls.some((u) => u.startsWith(GEMINI_URL_PREFIX))).toBe(true);
  });

  it("uses Gemini as fallback when Groq is not configured", async () => {
    clearKeys();
    vi.stubEnv("GEMINI_API_KEY", "gemini-key");
    mockFetch((url) =>
      url.startsWith(GEMINI_URL_PREFIX)
        ? { ok: true, json: { candidates: [{ content: { parts: [{ text: "Only Gemini" }] } }] } }
        : { ok: false, status: 404 }
    );

    const result = await callAi(BASE_REQUEST);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output).toBe("Only Gemini");
      expect(result.provider).toBe("gemini");
    }
  });

  it("falls back to Gemini even on a non-retryable Groq error (400)", async () => {
    clearKeys();
    vi.stubEnv("GROQ_API_KEY", "groq-key");
    vi.stubEnv("GEMINI_API_KEY", "gemini-key");
    mockFetch((url) =>
      url === GROQ_URL
        ? { ok: false, status: 400, text: "bad request" }
        : url.startsWith(GEMINI_URL_PREFIX)
          ? { ok: true, json: { candidates: [{ content: { parts: [{ text: "Recovered" }] } }] } }
          : { ok: false, status: 404 }
    );

    const result = await callAi(BASE_REQUEST);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output).toBe("Recovered");
      expect(result.provider).toBe("gemini");
    }
  });

  it("sends fileData to Groq as a base64 data-URL image when present", async () => {
    clearKeys();
    vi.stubEnv("GROQ_API_KEY", "groq-key");
    let groqBody: unknown;
    mockFetch((url, init) => {
      if (url === GROQ_URL) {
        groqBody = JSON.parse(String(init.body));
        return { ok: true, json: { choices: [{ message: { content: "OCR text" } }] } };
      }
      return { ok: false, status: 404 };
    });

    const result = await callAi({
      ...BASE_REQUEST,
      fileData: { mimeType: "image/png", data: "aGVsbG8=" },
    });

    expect(result.success).toBe(true);
    const content = (groqBody as { messages: Array<{ content: Array<Record<string, unknown>> }> }).messages[0].content;
    expect(content).toContainEqual({
      type: "image_url",
      image_url: { url: "data:image/png;base64,aGVsbG8=" },
    });
  });

  it("returns the Gemini error when both providers fail", async () => {
    clearKeys();
    vi.stubEnv("GROQ_API_KEY", "groq-key");
    vi.stubEnv("GEMINI_API_KEY", "gemini-key");
    const { logAiRequest } = await import("@/services/ai/log");
    vi.mocked(logAiRequest).mockClear();
    mockFetch((url) =>
      url === GROQ_URL
        ? { ok: false, status: 500, text: "boom" }
        : url.startsWith(GEMINI_URL_PREFIX)
          ? { ok: false, status: 429, text: "slow down" }
          : { ok: false, status: 404 }
    );

    const result = await callAi(BASE_REQUEST);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("rate limit");
      expect(result.provider).toBe("gemini");
    }
    // Both provider attempts are logged (groq fail + gemini fail).
    expect(vi.mocked(logAiRequest)).toHaveBeenCalledTimes(2);
  });

  it("logs both attempts when Groq fails and Gemini rescues", async () => {
    clearKeys();
    vi.stubEnv("GROQ_API_KEY", "groq-key");
    vi.stubEnv("GEMINI_API_KEY", "gemini-key");
    const { logAiRequest } = await import("@/services/ai/log");
    vi.mocked(logAiRequest).mockClear();
    mockFetch((url) =>
      url === GROQ_URL
        ? { ok: false, status: 500, text: "boom" }
        : url.startsWith(GEMINI_URL_PREFIX)
          ? { ok: true, json: { candidates: [{ content: { parts: [{ text: "Rescued" }] } }] } }
          : { ok: false, status: 404 }
    );

    const result = await callAi(BASE_REQUEST);

    expect(result.success).toBe(true);
    expect(result.provider).toBe("gemini");
    const calls = vi.mocked(logAiRequest).mock.calls.map((c) => c[0]);
    expect(calls).toHaveLength(2);
    expect(calls[0]).toMatchObject({ provider: "groq", success: false, error: expect.stringContaining("internal error") });
    expect(calls[1]).toMatchObject({ provider: "gemini", success: true, model: "gemini-3.5-flash" });
  });

  it("records telemetry for every request (success and failure)", async () => {
    clearKeys();
    vi.stubEnv("GROQ_API_KEY", "groq-key");
    const { logAiRequest } = await import("@/services/ai/log");
    vi.mocked(logAiRequest).mockClear();
    mockFetch((url) =>
      url === GROQ_URL
        ? { ok: true, json: { choices: [{ message: { content: "All good" } }] } }
        : { ok: false, status: 404 }
    );

    await callAi(BASE_REQUEST);

    expect(vi.mocked(logAiRequest)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(logAiRequest).mock.calls[0][0]).toMatchObject({
      action: "generate-summary",
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      success: true,
    });
  });
});
