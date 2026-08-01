import { AiRequest, AiResponse } from "@/types/ai";
import { getPrompt } from "@/services/ai/prompts";
import { capContent } from "@/services/ai/guard";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const TIMEOUT_MS = 25_000;
const MAX_RETRIES = 2;

async function buildPrompt(request: AiRequest): Promise<string> {
  const { action, input, context } = request;
  const template = await getPrompt(action);
  return template
    .replace(/\{input\}/g, input)
    .replace(/\{context\}/g, context);
}

/** Retryable transient statuses: rate limit and server hiccups. */
function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503;
}

async function fetchWithTimeout(init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function callGemini(request: AiRequest): Promise<AiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { success: false, output: "", error: "GEMINI_API_KEY not configured" };
  }

  // A-14: enforce input size budget (sanitized content embedded in the prompt)
  const input = capContent(request.input);
  const context = capContent(request.context, true);
  if (input === null || context === null) {
    return {
      success: false,
      output: "",
      error:
        "Input is too large. Please trim your resume or job description to 12,000 characters and try again.",
    };
  }

  const body = JSON.stringify({
    contents: [{ parts: [{ text: await buildPrompt({ ...request, input, context }) }] }],
  });

  let lastError = "Unknown error";
  let attempts = 0;

  while (attempts <= MAX_RETRIES) {
    attempts += 1;
    try {
      const response = await fetchWithTimeout(
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        },
        TIMEOUT_MS
      );

      if (!response.ok) {
        const statusMessages: Record<number, string> = {
          400: "The AI request was malformed. Please try again or contact support.",
          401: "AI service authentication failed. The API key may be invalid or expired.",
          403: "AI service quota exceeded or access denied. The free tier daily limit (1,500 requests) may have been reached.",
          429: "AI service rate limit reached. Please wait a moment and try again.",
          500: "The AI service encountered an internal error. Please try again later.",
          503: "AI service is temporarily unavailable. Please try again in a few minutes.",
        };

        // Transient failures: retry with backoff, then surface the mapped message
        if (isRetryableStatus(response.status) && attempts <= MAX_RETRIES) {
          lastError = statusMessages[response.status] || `AI service responded with status ${response.status}.`;
          await new Promise((r) => setTimeout(r, 500 * attempts));
          continue;
        }

        return {
          success: false,
          output: "",
          error:
            statusMessages[response.status] ||
            `AI service responded with status ${response.status}. Please try again.`,
        };
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      return { success: true, output: text };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        lastError = `The AI request timed out after ${TIMEOUT_MS / 1000} seconds. Please try a shorter prompt or try again later.`;
      } else {
        lastError = error instanceof Error ? error.message : "Unknown error";
      }
      if (attempts <= MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 500 * attempts));
        continue;
      }
    }
  }

  return { success: false, output: "", error: lastError };
}
