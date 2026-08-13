import { AiRequest, AiResponse } from "@/types/ai";
import { capContent, validateNumericClaims } from "@/services/ai/guard";
import { getPrompt } from "@/services/ai/prompts";
import { logAiRequest } from "@/services/ai/log";

const GEMINI_MODEL_ORDER = ["gemini-3.5-flash", "gemini-3.5-flash-lite"];
// Groq hosts open models via an OpenAI-compatible chat completions endpoint.
// These IDs are the text models available on the account's free tier; they are
// checked at runtime via GET /openai/v1/models (verify before assuming others).
const GROQ_MODEL_ORDER = [
  "llama-3.3-70b-versatile",
  "openai/gpt-oss-20b",
  "qwen/qwen3.6-27b",
];

const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 300;
const REQUEST_TIMEOUT_MS = 25_000;

const STATUS_MESSAGES: Record<number, string> = {
  400: "The AI request was malformed. Please try again or contact support.",
  401: "AI service authentication failed. The API key may be invalid or expired.",
  403: "AI service quota exceeded or access denied. The free tier daily limit may have been reached.",
  429: "AI service rate limit reached. Please wait a moment and try again.",
  500: "The AI service encountered an internal error. Please try again later.",
  503: "AI service is temporarily unavailable. Please try again in a few minutes.",
};

interface FileData {
  mimeType: string;
  data: string;
}

type ProviderName = "groq" | "gemini";

type ProviderResult = { ok: true; text: string } | { ok: false; status: number };

type ProviderCall = (
  model: string,
  prompt: string,
  signal: AbortSignal,
  fileData?: FileData
) => Promise<ProviderResult>;

async function buildPrompt(request: AiRequest): Promise<string> {
  const { action, input, context } = request;
  const template = await getPrompt(action);
  return template
    .replace(/\{input\}/g, input)
    .replace(/\{context\}/g, context);
}

function sanitizeRequest(request: AiRequest): AiRequest {
  const input = capContent(request.input ?? "") ?? "";
  const context = capContent(request.context ?? "", true) ?? "";
  return { ...request, input, context };
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Google Gemini — generateContent REST API (primary provider). */
async function callGeminiModel(
  model: string,
  prompt: string,
  signal: AbortSignal,
  fileData?: FileData
): Promise<ProviderResult> {
  const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [{ text: prompt }];

  if (fileData) {
    parts.push({
      inline_data: {
        mime_type: fileData.mimeType,
        data: fileData.data,
      },
    });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
      }),
      signal,
    }
  );

  if (!response.ok) {
    console.error(`AI Model Call Failed [${model}]: ${response.status} ${response.statusText}`);
    const errorBody = await response.text();
    console.error(`Error body: ${errorBody}`);
    return { ok: false, status: response.status };
  }

  const data = await response.json();
  return { ok: true, text: data?.candidates?.[0]?.content?.parts?.[0]?.text || "" };
}

/** Groq — OpenAI-compatible chat completions endpoint (fallback provider). */
async function callGroqModel(
  model: string,
  prompt: string,
  signal: AbortSignal,
  fileData?: FileData
): Promise<ProviderResult> {
  const parts: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [
    { type: "text", text: prompt },
  ];

  if (fileData) {
    parts.push({
      type: "image_url",
      image_url: { url: `data:${fileData.mimeType};base64,${fileData.data}` },
    });
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: parts }],
    }),
    signal,
  });

  if (!response.ok) {
    console.error(`AI Model Call Failed [${model}]: ${response.status} ${response.statusText}`);
    const errorBody = await response.text();
    console.error(`Error body: ${errorBody}`);
    return { ok: false, status: response.status };
  }

  const data = await response.json();
  return { ok: true, text: data?.choices?.[0]?.message?.content || "" };
}

/**
 * Try every model in `modelOrder` with exponential backoff, returning the
 * first successful completion. On failure, maps the last HTTP status (or a
 * timeout) to a user-facing error message. Every result carries the provider
 * name so callers (and the telemetry log) know which service was hit.
 */
async function runProvider(
  provider: ProviderName,
  modelOrder: string[],
  callModel: ProviderCall,
  prompt: string,
  fileData?: FileData
): Promise<AiResponse> {
  let lastStatus = 0;

  for (const model of modelOrder) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const result = await callModel(model, prompt, controller.signal, fileData);

        if (result.ok) {
          return { success: true, output: result.text, provider, model };
        }

        lastStatus = result.status;
        if (!RETRYABLE_STATUSES.has(result.status)) {
          // Non-retryable (4xx hard errors) — do not retry or fall back.
          break;
        }
        if (attempt < MAX_ATTEMPTS) {
          await sleep(BASE_RETRY_DELAY_MS * 2 ** (attempt - 1));
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          // Timeout — retryable; try the next attempt / fallback model.
          lastStatus = 0;
        } else {
          throw error;
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }
  }

  if (lastStatus) {
    return {
      success: false,
      output: "",
      provider,
      error:
        STATUS_MESSAGES[lastStatus] ||
        `AI service responded with status ${lastStatus}. Please try again.`,
    };
  }
  return {
    success: false,
    output: "",
    provider,
    error: "The AI request timed out after 25 seconds. Please try a shorter prompt or try again later.",
  };
}

/**
 * Primary AI entry point — tried by every AI-backed route.
 *
 * Order of preference:
 *   1. Groq (GROQ_API_KEY) — primary provider.
 *   2. Google Gemini (GEMINI_API_KEY) — fallback when Groq is unconfigured,
 *      down, rate-limited, or quota-exhausted. Uses the same prompts and guards.
 */
export async function callAi(request: AiRequest): Promise<AiResponse> {
  const startedAt = Date.now();
  const prompt = await buildPrompt(sanitizeRequest(request));

  const attachWarnings = (output: string) => {
    const warnings = validateNumericClaims(output, [request.input, request.context].join("\n"));
    return warnings.length > 0 ? warnings : undefined;
  };

  /**
   * Record one telemetry row PER PROVIDER ATTEMPT — not just the final result
   * — so the dashboard shows failures that were rescued by the fallback
   * (e.g. Groq 500 → Gemini success yields two rows: groq failed, gemini ok).
   */
  const logAttempt = async (attempt: {
    provider?: string;
    model?: string;
    success: boolean;
    latency_ms: number;
    error?: string;
  }) => {
    try {
      await logAiRequest({ action: request.action, ...attempt });
    } catch {
      // Telemetry must never break an AI call.
    }
  };

  let primaryError = "GROQ_API_KEY not configured";

  if (process.env.GROQ_API_KEY) {
    const providerStart = Date.now();
    try {
      const result = await runProvider("groq", GROQ_MODEL_ORDER, callGroqModel, prompt, request.fileData);
      await logAttempt({
        provider: result.provider,
        model: result.model,
        success: result.success,
        latency_ms: Date.now() - providerStart,
        error: result.error,
      });
      if (result.success) {
        return { ...result, warnings: attachWarnings(result.output) };
      }
      primaryError = result.error ?? primaryError;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await logAttempt({ provider: "groq", success: false, latency_ms: Date.now() - providerStart, error: message });
      primaryError = message;
    }
  }

  if (process.env.GEMINI_API_KEY) {
    const providerStart = Date.now();
    try {
      const result = await runProvider("gemini", GEMINI_MODEL_ORDER, callGeminiModel, prompt, request.fileData);
      await logAttempt({
        provider: result.provider,
        model: result.model,
        success: result.success,
        latency_ms: Date.now() - providerStart,
        error: result.error,
      });
      if (result.success) {
        return { ...result, warnings: attachWarnings(result.output) };
      }
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await logAttempt({ provider: "gemini", success: false, latency_ms: Date.now() - providerStart, error: message });
      return { success: false, output: "", provider: "gemini", error: message };
    }
  }

  await logAttempt({ success: false, latency_ms: Date.now() - startedAt, error: primaryError });
  return { success: false, output: "", error: primaryError };
}
