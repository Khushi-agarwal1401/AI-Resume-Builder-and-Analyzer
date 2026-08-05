import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callGemini } from "@/services/ai/client";
import type { AiRequest } from "@/types/ai";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { aiRequestSchema, validateOrError } from "@/lib/validation";
import { getUserPlanLimits, checkUsageLimit, incrementUsage } from "@/lib/subscription";
import { withErrorHandling } from "@/lib/api";

export const dynamic = "force-dynamic";

export const POST = withErrorHandling(async function POST(request: NextRequest) {
  // Authenticate
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

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

  // Usage limit: check plan's max AI actions per month
  const limits = await getUserPlanLimits(session.user.id);
  const usageCheck = await checkUsageLimit(session.user.id, "ai_actions", limits.maxAiActions);
  if (!usageCheck.allowed) {
    return NextResponse.json(
      { success: false, error: "Monthly AI action limit reached. Upgrade to Pro for unlimited actions." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const validated = validateOrError(aiRequestSchema, body);
  if ("error" in validated) return validated.error;

  const result = await callGemini(validated.data as AiRequest);

  // Increment usage after successful call
  await incrementUsage(session.user.id, "ai_actions");

  return NextResponse.json(result, {
    headers: await getRateLimitHeaders(`ai:${ip}`, 20),
  });
});
