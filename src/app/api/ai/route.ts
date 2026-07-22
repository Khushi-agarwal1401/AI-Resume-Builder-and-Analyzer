import { NextRequest, NextResponse } from "next/server";
import { callGemini } from "@/services/ai/client";
import type { AiRequest } from "@/types/ai";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { aiRequestSchema, validateOrError } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";

  // Rate limit: 20 requests per minute per IP (Redis-backed)
  const allowed = await checkRateLimit(`ai:${ip}`, 20, 60000);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded" },
      {
        status: 429,
        headers: await getRateLimitHeaders(`ai:${ip}`, 20),
      }
    );
  }

  const body = await request.json().catch(() => ({}));
  const validated = validateOrError(aiRequestSchema, body);
  if ("error" in validated) return validated.error;

  const result = await callGemini(validated.data as AiRequest);

  return NextResponse.json(result, {
    headers: await getRateLimitHeaders(`ai:${ip}`, 20),
  });
}
