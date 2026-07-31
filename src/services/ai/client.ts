import { AiRequest, AiResponse } from "@/types/ai";
import { getPrompt } from "@/services/ai/prompts";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

async function buildPrompt(request: AiRequest): Promise<string> {
  const { action, input, context } = request;
  const template = await getPrompt(action);
  return template.replace(/\{input\}/g, input).replace(/\{context\}/g, context);
}

export async function callGemini(request: AiRequest): Promise<AiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { success: false, output: "", error: "GEMINI_API_KEY not configured" };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: await buildPrompt(request) }] }],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const statusMessages: Record<number, string> = {
          400: "The AI request was malformed. Please try again or contact support.",
          401: "AI service authentication failed. The API key may be invalid or expired.",
          403: "AI service quota exceeded or access denied. The free tier daily limit (1,500 requests) may have been reached.",
          429: "AI service rate limit reached. Please wait a moment and try again.",
          500: "The AI service encountered an internal error. Please try again later.",
          503: "AI service is temporarily unavailable. Please try again in a few minutes.",
        };
        const userMessage =
          statusMessages[response.status] ||
          `AI service responded with status ${response.status}. Please try again.`;
        return { success: false, output: "", error: userMessage };
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      return { success: true, output: text };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        success: false,
        output: "",
        error: "The AI request timed out after 25 seconds. Please try a shorter prompt or try again later.",
      };
    }
    return {
      success: false,
      output: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
