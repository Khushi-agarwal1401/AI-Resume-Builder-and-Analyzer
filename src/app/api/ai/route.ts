import { NextRequest, NextResponse } from "next/server";
import { callGemini } from "@/services/ai/client";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import type { AiRequest } from "@/types/ai";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  if (!checkRateLimit(`ai:${ip}`, 20, 60000)) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded" },
      {
        status: 429,
        headers: getRateLimitHeaders(`ai:${ip}`, 20),
      }
    );
  }

  const body: AiRequest = await request.json();
  const result = await callGemini(body);

  return NextResponse.json(result, {
    headers: getRateLimitHeaders(`ai:${ip}`, 20),
  });
}
