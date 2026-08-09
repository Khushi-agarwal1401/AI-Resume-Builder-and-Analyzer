import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export interface LinkedInUrlImportResult {
  personalInfo: {
    fullName: string;
    headline: string;
    linkedin: string;
  };
  education: { institution: string; degree: string; field: string; startDate: string; endDate: string }[];
  skills: { technical: string[]; soft: string[]; tools: string[]; frameworks: string[] };
}

/**
 * POST /api/linkedin/import-url
 * Body: { url: string }
 * Fetches basic profile data (Name, Education, Skills) from a LinkedIn URL.
 * NOTE: This is currently a mock implementation. Real implementation requires
 * a 3rd party API (e.g. Proxycurl) to scrape LinkedIn reliably.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const allowed = await checkRateLimit(`linkedin-url-import:${ip}`, 10, 60000);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded. Please try again shortly." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const url = typeof body?.url === "string" ? body.url.trim() : "";

  if (!url || !url.includes("linkedin.com/in/")) {
    return NextResponse.json(
      { success: false, error: "Please enter a valid LinkedIn profile URL." },
      { status: 400 }
    );
  }

  try {
    // TODO: Replace with real scraping API (Proxycurl, etc.)
    // For now, return mock data based on the URL username
    const usernameMatch = url.match(/linkedin\.com\/in\/([^/]+)/i);
    const username = usernameMatch ? usernameMatch[1] : "user";
    
    // Convert username to a capitalized name (e.g., john-doe -> John Doe)
    const mockName = username.split("-").map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");

    const profile: LinkedInUrlImportResult = {
      personalInfo: {
        fullName: mockName || "LinkedIn User",
        headline: "Software Engineer",
        linkedin: url,
      },
      education: [
        {
          institution: "University of Technology",
          degree: "Bachelor of Science",
          field: "Computer Science",
          startDate: "2018",
          endDate: "2022",
        },
      ],
      skills: {
        technical: ["JavaScript", "TypeScript", "React", "Node.js"],
        soft: ["Leadership", "Communication", "Problem Solving"],
        tools: ["Git", "Docker"],
        frameworks: ["Next.js", "Express"],
      },
    };

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while fetching LinkedIn data." },
      { status: 500 }
    );
  }
}
