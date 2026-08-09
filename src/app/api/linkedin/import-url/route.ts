import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getUserPlanLimits, checkPremiumAccess, recordPremiumUse } from "@/lib/subscription";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export interface LinkedInUrlImportResult {
  personalInfo: {
    fullName: string;
    headline: string;
    linkedin: string;
  };
  /** Headline biography pulled from the profile's "About" section. */
  summary: string;
  education: { institution: string; degree: string; field: string; startDate: string; endDate: string }[];
  experience: {
    company: string;
    role: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    responsibilities: string[];
  }[];
  certifications: { name: string; issuer: string; date: string }[];
  languages: { name: string; proficiency: string }[];
  skills: { technical: string[]; soft: string[]; tools: string[]; frameworks: string[] };
}

const PROXYCURL_ENDPOINT = "https://api.proxycurl.com/v2/linkedin";
// Proxycurl cold-scrapes public profiles and can take a while on first fetch.
// 60s keeps us well under Vercel's h1 idle limit while covering slow scrapes.
const PROXYCURL_TIMEOUT_MS = 60_000;

// ── Helpers ────────────────────────────────────────────────────────────────

const str = (v: unknown): string => (typeof v === "string" ? v : "");

/** Proxycurl date objects look like `{ day, month, year, raw }`; `raw` is the readable form. */
function mapDate(d: unknown): string {
  if (!d || typeof d !== "object") return "";
  const date = d as { day?: number; month?: number; year?: number; raw?: string };
  if (typeof date.raw === "string" && date.raw.trim()) return date.raw.trim();
  if (date.year) return String(date.year);
  if (date.month && date.year) return `${date.month}/${date.year}`;
  return "";
}

/** Extract a display name from a string or `{ name }` object (Proxycurl occasionally returns objects). */
function nameOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "name" in value) {
    return str((value as { name?: unknown }).name);
  }
  return "";
}

/**
 * Extract the username from any LinkedIn URL form and rebuild a canonical
 * profile URL. Returns null for anything that isn't a genuine linkedin.com
 * profile URL (rejects query-string smuggling like `evil.com/?u=linkedin.com/...`).
 */
function normalizeLinkedInUrl(raw: string): string | null {
  const match = raw.match(/(?:^|\/)(?:www\.)?linkedin\.com\/in\/([^/?#]+)/i);
  if (!match) return null;
  const username = match[1].replace(/^@/, "");
  if (!/^[A-Za-z0-9._-]{1,100}$/.test(username)) return null;
  return `https://www.linkedin.com/in/${username}`;
}

/** Split a Proxycurl experience description into resume bullet points. */
function toResponsibilities(description: unknown): string[] {
  if (typeof description !== "string") return [];
  return description
    .split(/\n+|•|\u2022/)
    .map((s) => s.trim().replace(/^[-–—•·]\s*/, ""))
    .filter(Boolean);
}

/** Proxycurl returns skills/languages as strings or `{ name }` objects — normalize both. */
function toNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const names: string[] = [];
  for (const item of value) {
    if (typeof item === "string") {
      if (item.trim()) names.push(item.trim());
    } else if (item && typeof item === "object" && "name" in item) {
      const name = (item as { name?: unknown }).name;
      if (typeof name === "string" && name.trim()) names.push(name.trim());
    }
  }
  return names;
}

/** Map a raw Proxycurl Person Profile response onto the resume import contract. */
export function mapProxycurlProfile(raw: unknown, fallbackUrl = ""): LinkedInUrlImportResult {
  const profile = (raw ?? {}) as Record<string, unknown>;
  const arr = (key: string): Array<Record<string, unknown>> =>
    Array.isArray(profile[key]) ? (profile[key] as Array<Record<string, unknown>>) : [];

  const education = arr("education")
    .map((e) => ({
      institution: nameOf(e.school),
      degree: str(e.degree_name),
      field: str(e.field_of_study),
      startDate: mapDate(e.starts_at),
      endDate: mapDate(e.ends_at),
    }))
    .filter((e) => e.institution || e.degree || e.field);

  const experience = arr("experiences")
    .map((x) => ({
      company: nameOf(x.company),
      role: str(x.title),
      location: str(x.location),
      startDate: mapDate(x.starts_at),
      endDate: mapDate(x.ends_at),
      current: !x.ends_at,
      responsibilities: toResponsibilities(x.description),
    }))
    .filter((x) => x.company || x.role);

  const certifications = arr("certifications")
    .map((c) => ({
      name: str(c.name),
      issuer: str(c.authority),
      date: mapDate(c.starts_at) || mapDate(c.ends_at),
    }))
    .filter((c) => c.name);

  const rawLanguages = Array.isArray(profile.languages) ? (profile.languages as unknown[]) : [];
  const languages = rawLanguages
    .map((l) =>
      typeof l === "string"
        ? { name: l, proficiency: "" }
        : {
            name: str((l as { name?: unknown })?.name),
            proficiency: str((l as { proficiency?: unknown })?.proficiency),
          }
    )
    .filter((l) => l.name);

  const skills = toNames(profile.skills);

  return {
    personalInfo: {
      fullName: str(profile.full_name) || "LinkedIn User",
      headline: str(profile.headline),
      // Proxycurl returns the canonical URL as linkedin_profile_url; the
      // caller's input URL is a safe fallback.
      linkedin: str(profile.linkedin_profile_url) || fallbackUrl,
    },
    summary: str(profile.summary),
    education,
    experience,
    certifications,
    languages,
    // All profile skills land in "technical" — the wizard merges GitHub-derived
    // languages into it too, so splitting soft/tools/frameworks client-side
    // would be guesswork on strings Proxycurl does not categorize.
    skills: { technical: skills, soft: [], tools: [], frameworks: [] },
  };
}

/**
 * POST /api/linkedin/import-url
 * Body: { url: string }
 * Fetches a public LinkedIn profile via the Proxycurl Person Profile API and
 * returns structured resume data (name, headline, summary, education,
 * experience, skills, certifications, languages).
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Admins have full access: exempt from the Pro gate and the rate limit
  // (checked once, reused for both).
  const adminUser = await isAdmin(session.user.id, session.user.email || "");

  // K-14: LinkedIn profile import is a Pro feature, but free users get
  // PREMIUM_TRIAL_USES free imports per month before the paywall (admins
  // exempt). Runs before the rate limit and any Proxycurl call so gated users
  // consume no credits.
  let burnsLinkedinTrial = false;
  if (!adminUser) {
    const limits = await getUserPlanLimits(session.user.id);
    const trial = await checkPremiumAccess(
      session.user.id,
      "linkedin_imports",
      limits.hasLinkedinImport,
      adminUser
    );
    if (!trial) {
      return NextResponse.json(
        {
          success: false,
          error: "LinkedIn profile import is a Pro feature. Upgrade to Pro to import your profile.",
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }
    burnsLinkedinTrial = !limits.hasLinkedinImport;
  }

  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const allowed = await checkRateLimit(`linkedin-url-import:${ip}`, 10, 60000, { bypass: adminUser });
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded. Please try again shortly." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";
  const url = normalizeLinkedInUrl(rawUrl);

  if (!url) {
    return NextResponse.json(
      { success: false, error: "Please enter a valid LinkedIn profile URL." },
      { status: 400 }
    );
  }

  const apiKey = process.env.PROXYCURL_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        error: "LinkedIn import is not configured on this server yet (missing PROXYCURL_API_KEY).",
      },
      { status: 503 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROXYCURL_TIMEOUT_MS);

  try {
    const params = new URLSearchParams({
      url,
      // Full profile data (education, experience, skills, certifications…)
      extra: "include",
      // Reuse a cached scrape when available — saves Proxycurl credits.
      use_cache: "if-present",
      // If a live scrape fails, fall back to whatever was cached before.
      fallback_to_cache: "on-error",
    });

    const res = await fetch(`${PROXYCURL_ENDPOINT}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      const message =
        res.status === 401 || res.status === 403
          ? "LinkedIn import is not authorized. Please check the Proxycurl API key."
          : res.status === 404
            ? "Could not find a LinkedIn profile at that URL."
            : res.status === 429
              ? "LinkedIn import service is rate-limited. Please try again shortly."
              : "LinkedIn import service returned an error. Please try again shortly.";
      return NextResponse.json({ success: false, error: message }, { status: 502 });
    }

    const profile = mapProxycurlProfile(await res.json(), url);
    // Burn one free LinkedIn import use on a successful fetch (free users only).
    if (burnsLinkedinTrial) {
      await recordPremiumUse(session.user.id, "linkedin_imports", false, false);
    }
    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { success: false, error: "LinkedIn import timed out. Please try again shortly." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while fetching LinkedIn data." },
      { status: 500 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
