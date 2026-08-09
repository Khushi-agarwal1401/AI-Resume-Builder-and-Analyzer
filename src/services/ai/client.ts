import { AiRequest, AiResponse } from "@/types/ai";
import { capContent, validateNumericClaims } from "@/services/ai/guard";
import { getPrompt } from "@/services/ai/prompts";

const MODEL_ORDER = ["gemini-3.5-flash", "gemini-3.5-flash-lite"];

const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 300;
const REQUEST_TIMEOUT_MS = 25_000;

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

async function callModelOnce(
  model: string,
  prompt: string,
  signal: AbortSignal,
  fileData?: { mimeType: string; data: string }
): Promise<{ ok: true; text: string } | { ok: false; status: number }> {
  
  const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [{ text: prompt }];
  
  if (fileData) {
    parts.push({
      inline_data: {
        mime_type: fileData.mimeType,
        data: fileData.data
      }
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

export async function callGemini(request: AiRequest): Promise<AiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { success: false, output: "", error: "GEMINI_API_KEY not configured" };
  }

  const prompt = await buildPrompt(sanitizeRequest(request));

  try {
    let lastStatus = 0;
    for (const model of MODEL_ORDER) {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        try {
          const result = await callModelOnce(model, prompt, controller.signal, request.fileData);

          if (result.ok) {
            const warnings = validateNumericClaims(result.text, [request.input, request.context].join("\n"));
            return {
              success: true,
              output: result.text,
              warnings: warnings.length > 0 ? warnings : undefined,
            };
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

    const statusMessages: Record<number, string> = {
      400: "The AI request was malformed. Please try again or contact support.",
      401: "AI service authentication failed. The API key may be invalid or expired.",
      403: "AI service quota exceeded or access denied. The free tier daily limit (1,500 requests) may have been reached.",
      429: "AI service rate limit reached. Please wait a moment and try again.",
      500: "The AI service encountered an internal error. Please try again later.",
      503: "AI service is temporarily unavailable. Please try again in a few minutes.",
    };
    if (lastStatus) {
      return {
        success: false,
        output: "",
        error: statusMessages[lastStatus] || `AI service responded with status ${lastStatus}. Please try again.`,
      };
    }
    return {
      success: false,
      output: "",
      error: "The AI request timed out after 25 seconds. Please try a shorter prompt or try again later.",
    };
  } catch (error) {
    return {
      success: false,
      output: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}


