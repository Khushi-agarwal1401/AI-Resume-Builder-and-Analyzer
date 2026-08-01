import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callGemini } from "@/services/ai/client";
import { validateNumericClaims } from "@/services/ai/guard";
import type { AiRequest } from "@/types/ai";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { aiRequestSchema, validateOrError } from "@/lib/validation";
import { getUserPlanLimits, checkUsageLimit, incrementUsage } from "@/lib/subscription";
import { createNotification, hasRecentUnreadNotification } from "@/services/notifications/service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
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

  // A-04: programmatic anti-fabrication guard — flag numeric claims in the AI
  // output that cannot be traced back to the user's input/context
  if (result.success) {
    const warnings = validateNumericClaims(
      result.output,
      `${validated.data.input} ${validated.data.context}`
    );
    if (warnings.length > 0) {
      result.warnings = warnings;
    }
  }

  // Increment usage after successful call
  await incrementUsage(session.user.id, "ai_actions");

  // Notification Center: AI generation finished (best-effort, deduped to avoid spam)
  if (result.success && !(await hasRecentUnreadNotification(session.user.id, "ai", 5))) {
    await createNotification(session.user.id, {
      type: "ai",
      title: "AI generation finished",
      message: `Your ${validated.data.action.replace(/-/g, " ")} request is ready.`,
      link: "/dashboard",
    });
  }

  return NextResponse.json(result, {
    headers: await getRateLimitHeaders(`ai:${ip}`, 20),
  });
}
