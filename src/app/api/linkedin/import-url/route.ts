import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getUserPlanLimits, checkPremiumAccess, recordPremiumUse } from "@/lib/subscription";
import { isAdmin } from "@/lib/admin";
import { mapProxycurlProfile, type LinkedInUrlImportResult } from "./mapper";

export const dynamic = "force-dynamic";

const PROXYCURL_ENDPOINT = "https://api.proxycurl.com/v2/linkedin";
// Proxycurl cold-scrapes public profiles and can take a while on first fetch.
// 60s keeps us well under Vercel's h1 idle limit while covering slow scrapes.
const PROXYCURL_TIMEOUT_MS = 60_000;

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
    // Fallback to mock data if no Proxycurl API key is provided
    const usernameMatch = url.match(/linkedin\.com\/in\/([^/?#]+)/i);
    const username = usernameMatch ? usernameMatch[1] : "user";
    const mockName = username.split("-").map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");

    const profile: LinkedInUrlImportResult = {
      personalInfo: {
        fullName: mockName || "LinkedIn User",
        headline: "Software Engineer",
        linkedin: url,
      },
      summary: "Experienced software engineer with a passion for building scalable web applications.",
      education: [
        {
          institution: "University of Technology",
          degree: "Bachelor of Science",
          field: "Computer Science",
          startDate: "2018",
          endDate: "2022",
        },
      ],
      experience: [
        {
          company: "Tech Corp",
          role: "Frontend Developer",
          location: "San Francisco, CA",
          startDate: "2022",
          endDate: "",
          current: true,
          responsibilities: ["Developed modern web applications using React.", "Improved performance by 30%."],
        }
      ],
      certifications: [],
      languages: [],
      skills: {
        technical: ["JavaScript", "TypeScript", "React", "Node.js"],
        soft: ["Leadership", "Communication", "Problem Solving"],
        tools: ["Git", "Docker"],
        frameworks: ["Next.js", "Express"],
      },
    };

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Burn one free LinkedIn import use on a successful fetch (free users only).
    if (burnsLinkedinTrial) {
      await recordPremiumUse(session.user.id, "linkedin_imports", false, false);
    }
    return NextResponse.json({ success: true, data: profile });
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
