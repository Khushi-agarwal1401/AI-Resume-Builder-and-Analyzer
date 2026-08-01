import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callGemini } from "@/services/ai/client";
import { checkRateLimit } from "@/lib/rate-limit";
import type { AiRequest } from "@/types/ai";

export const dynamic = "force-dynamic";

export interface ParsedLinkedInProfile {
  experience: { company: string; role: string; duration: string; description: string }[];
  education: { school: string; degree: string; field: string; graduationYear: string }[];
  skills: string[];
  certifications: { name: string; issuer: string; date: string }[];
  achievements: { title: string; description: string }[];
}

const MAX_TEXT_LENGTH = 20_000;

/**
 * POST /api/linkedin/import-paste
 * Body: { text: string }
 * The user pastes their own LinkedIn profile (text or profile PDF export) and
 * Gemini extracts structured experience/education/skills data from it. No
 * LinkedIn API access is required — the user provides the content, so it is
 * fully legal and works for everyone.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const allowed = await checkRateLimit(`linkedin-import:${ip}`, 10, 60000);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded. Please try again shortly." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const text = typeof body?.text === "string" ? body.text.trim() : "";

  if (text.length < 50) {
    return NextResponse.json(
      { success: false, error: "Paste your LinkedIn profile content first (at least a few lines)." },
      { status: 400 }
    );
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { success: false, error: "Profile text is too long. Paste up to ~20,000 characters." },
      { status: 400 }
    );
  }

  try {
    const aiRequest: AiRequest = {
      action: "linkedin-import-paste",
      input: text.slice(0, MAX_TEXT_LENGTH),
      context: "",
    };

    const result = await callGemini(aiRequest);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "AI extraction failed" },
        { status: 502 }
      );
    }

    const raw = result.output.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    let parsed: Partial<ParsedLinkedInProfile> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { success: false, error: "Could not parse the extracted profile. Please try again." },
        { status: 502 }
      );
    }

    const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
    const asString = (v: unknown, fallback = ""): string =>
      typeof v === "string" ? v.trim() : fallback;

    const profile: ParsedLinkedInProfile = {
      experience: asArray(parsed.experience)
        .map((e) => ({
          company: asString((e as Record<string, unknown>)?.company),
          role: asString((e as Record<string, unknown>)?.role),
          duration: asString((e as Record<string, unknown>)?.duration),
          description: asString((e as Record<string, unknown>)?.description),
        }))
        .filter((e) => e.company || e.role),
      education: asArray(parsed.education)
        .map((e) => ({
          school: asString((e as Record<string, unknown>)?.school),
          degree: asString((e as Record<string, unknown>)?.degree),
          field: asString((e as Record<string, unknown>)?.field),
          graduationYear: asString((e as Record<string, unknown>)?.graduationYear),
        }))
        .filter((e) => e.school),
      skills: asArray(parsed.skills)
        .map((s) => asString(s))
        .filter(Boolean),
      certifications: asArray(parsed.certifications)
        .map((c) => ({
          name: asString((c as Record<string, unknown>)?.name),
          issuer: asString((c as Record<string, unknown>)?.issuer),
          date: asString((c as Record<string, unknown>)?.date),
        }))
        .filter((c) => c.name),
      achievements: asArray(parsed.achievements)
        .map((a) => ({
          title: asString((a as Record<string, unknown>)?.title),
          description: asString((a as Record<string, unknown>)?.description),
        }))
        .filter((a) => a.title || a.description),
    };

    const total = profile.experience.length + profile.education.length + profile.skills.length +
      profile.certifications.length + profile.achievements.length;

    if (total === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No profile details could be extracted. Paste your full profile — e.g. from the 'More… → Save to PDF' export on LinkedIn.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, data: profile });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
