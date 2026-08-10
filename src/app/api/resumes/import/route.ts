import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseResumeFile } from "@/services/resume-analyzer/parser";
import { parseResumeText } from "@/services/resume-analyzer/deterministic-import";
import { callGemini } from "@/services/ai/client";
import { createResume, getResumes, updateSections } from "@/services/resume/service";
import { getUserPlanLimits } from "@/lib/subscription";
import { isAdmin } from "@/lib/admin";
import type { AiRequest } from "@/types/ai";

export const dynamic = "force-dynamic";
// OCR + AI extraction can take a while on serverless — allow up to 5 min.
export const maxDuration = 300;

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_TEXT_LENGTH = 12_000;
const TARGET_LEVELS = ["student", "student_internship", "fresher", "experienced"] as const;
type TargetLevel = (typeof TARGET_LEVELS)[number];

/** Structured resume data extracted from an uploaded resume file. */
interface ImportedResume {
  targetLevel: TargetLevel;
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    linkedin: string;
    github: string;
    portfolio: string;
    photo: string;
  };
  summary: string;
  experience: Record<string, unknown>[];
  education: Record<string, unknown>[];
  skills: Record<string, unknown>;
  projects: Record<string, unknown>[];
  certifications: Record<string, unknown>[];
  achievements: Record<string, unknown>[];
  languages: Record<string, unknown>[];
}

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const asString = (v: unknown, fallback = ""): string => (typeof v === "string" ? v.trim() : fallback);
const asBool = (v: unknown): boolean => v === true || v === "true";
const asStringArray = (v: unknown): string[] => asArray(v).map((x) => asString(x)).filter(Boolean);

/**
 * Sanitizes the AI output into client-shaped section records (camelCase keys)
 * so they can be passed straight to updateSections' whitelist mapping.
 */
function sanitizeImportedResume(raw: unknown): ImportedResume | null {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const p = (obj.personalInfo ?? {}) as Record<string, unknown>;
  const s = (obj.skills ?? {}) as Record<string, unknown>;

  const experience = asArray(obj.experience)
    .map((e) => {
      const r = e as Record<string, unknown>;
      return {
        company: asString(r.company),
        role: asString(r.role),
        location: asString(r.location),
        startDate: asString(r.startDate),
        endDate: asString(r.endDate),
        current: asBool(r.current),
        responsibilities: asStringArray(r.responsibilities),
        achievements: [] as string[],
      };
    })
    .filter((e) => e.company || e.role);

  const education = asArray(obj.education)
    .map((e) => {
      const r = e as Record<string, unknown>;
      return {
        institution: asString(r.institution),
        degree: asString(r.degree),
        field: asString(r.field),
        startDate: asString(r.startDate),
        endDate: asString(r.endDate),
        cgpa: asString(r.cgpa),
      };
    })
    .filter((e) => e.institution);

  const projects = asArray(obj.projects)
    .map((e) => {
      const r = e as Record<string, unknown>;
      return {
        name: asString(r.name),
        description: asString(r.description),
        technologies: asStringArray(r.technologies),
        liveUrl: asString(r.liveUrl),
        githubUrl: asString(r.githubUrl),
      };
    })
    .filter((e) => e.name);

  const certifications = asArray(obj.certifications)
    .map((e) => {
      const r = e as Record<string, unknown>;
      return { name: asString(r.name), issuer: asString(r.issuer), date: asString(r.date) };
    })
    .filter((c) => c.name);

  const achievements = asArray(obj.achievements)
    .map((e) => {
      const r = e as Record<string, unknown>;
      return { title: asString(r.title), description: asString(r.description), date: asString(r.date) };
    })
    .filter((a) => a.title || a.description);

  const languages = asArray(obj.languages)
    .map((e) => {
      const r = e as Record<string, unknown>;
      return { name: asString(r.name), proficiency: asString(r.proficiency) };
    })
    .filter((l) => l.name);

  const skills = {
    technical: asStringArray(s.technical),
    soft: asStringArray(s.soft),
    tools: asStringArray(s.tools),
    frameworks: asStringArray(s.frameworks),
  };

  const targetLevel = TARGET_LEVELS.includes(obj.targetLevel as TargetLevel)
    ? (obj.targetLevel as TargetLevel)
    : "fresher";

  const personalInfo = {
    fullName: asString(p.fullName),
    email: asString(p.email),
    phone: asString(p.phone),
    linkedin: asString(p.linkedin),
    github: asString(p.github),
    portfolio: asString(p.portfolio),
    photo: "",
  };

  const summary = asString(obj.summary);

  return { targetLevel, personalInfo, summary, experience, education, skills, projects, certifications, achievements, languages };
}

function countExtracted(resume: ImportedResume): number {
  return (
    resume.experience.length + resume.education.length + resume.projects.length +
    resume.certifications.length + resume.achievements.length + resume.languages.length +
    Object.values(resume.skills).reduce((n: number, list) => n + (list as unknown[]).length, 0) +
    (resume.summary ? 1 : 0) +
    (resume.personalInfo.fullName ? 1 : 0) +
    (resume.personalInfo.email ? 1 : 0) +
    (resume.personalInfo.phone ? 1 : 0) +
    (resume.personalInfo.linkedin || resume.personalInfo.github || resume.personalInfo.portfolio ? 1 : 0)
  );
}

/**
 * Fill empty sections of the primary (AI) result with the deterministic
 * parser's findings, so nothing extractable is dropped. Empty AI sections are
 * replaced; non-empty ones are kept as-is (no duplicate/conflicting entries).
 */
function mergeImported(primary: ImportedResume, supplement: ImportedResume): ImportedResume {
  const merged: ImportedResume = {
    ...primary,
    skills: { ...primary.skills },
    personalInfo: { ...primary.personalInfo },
  };

  for (const key of ["experience", "education", "projects", "certifications", "achievements", "languages"] as const) {
    const p = primary[key] as unknown[];
    const s = supplement[key] as unknown[];
    if (p.length === 0 && s.length > 0) (merged as unknown as Record<string, unknown>)[key] = s;
  }

  const skills = merged.skills as Record<string, unknown[]>;
  const supSkills = supplement.skills as Record<string, unknown[]>;
  for (const bucket of ["technical", "soft", "tools", "frameworks"] as const) {
    if ((skills[bucket] ?? []).length === 0 && (supSkills[bucket] ?? []).length > 0) {
      skills[bucket] = supSkills[bucket];
    }
  }

  for (const field of ["fullName", "email", "phone", "linkedin", "github", "portfolio"] as const) {
    if (!merged.personalInfo[field] && supplement.personalInfo[field]) {
      merged.personalInfo[field] = supplement.personalInfo[field];
    }
  }

  if (!merged.summary && supplement.summary) merged.summary = supplement.summary;
  return merged;
}

/**
 * POST /api/resumes/import
 * Multipart form-data with a `file` field (PDF, DOCX, or TXT).
 *
 * Parses the uploaded resume, uses AI to structure it into resume sections,
 * creates a new resume pre-filled with the extracted content, and returns the
 * created resume id so the client can open the builder.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Usage limit: same max-resume gate as POST /api/resumes — importing a file
  // must not let a user bypass their plan's resume cap.
  const limits = await getUserPlanLimits(session.user.id);
  const existing = await getResumes(session.user.id);
  const adminUser = await isAdmin(session.user.id, session.user.email || "");
  if (!adminUser && existing.length >= limits.maxResumes) {
    return NextResponse.json(
      { success: false, error: `Maximum resume limit (${limits.maxResumes}) reached. Upgrade to Pro for unlimited resumes.` },
      { status: 403 }
    );
  }

  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  // Admins have full access — exempt from the import rate limit.
  const allowed = await checkRateLimit(`resume-import:${ip}`, 10, 60000, { bypass: adminUser });
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded. Please try again shortly." },
      { status: 429 }
    );
  }

  let file: File;
  let templateOverride = "";
  try {
    const formData = await request.formData();
    const uploaded = formData.get("file");
    if (!(uploaded instanceof File)) {
      return NextResponse.json({ success: false, error: "No file provided." }, { status: 400 });
    }
    file = uploaded;
    const t = formData.get("template");
    if (typeof t === "string" && t.trim()) templateOverride = t.trim();
  } catch {
    return NextResponse.json({ success: false, error: "Could not read the uploaded file." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { success: false, error: "File is too large. Please upload a resume under 5 MB." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { text, error } = await parseResumeFile(buffer, file.name);
  if (error || !text) {
    return NextResponse.json(
      { success: false, error: error || "Could not read the file. Upload a PDF, DOCX, or TXT resume." },
      { status: 400 }
    );
  }
  if (text.trim().length < 10) {
    return NextResponse.json(
      { success: false, error: "The file appears to be empty or contain no readable text." },
      { status: 400 }
    );
  }

  try {
    // 1. AI extraction (Gemini) when available — best quality.
    let imported: ImportedResume | null = null;
    const aiRequest: AiRequest = {
      action: "resume-import-upload",
      input: text.slice(0, MAX_TEXT_LENGTH),
      context: "",
    };

    const result = await callGemini(aiRequest);
    if (result.success && result.output) {
      const raw = result.output.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      try {
        const parsed: unknown = JSON.parse(raw);
        imported = sanitizeImportedResume(parsed);
      } catch {
        imported = null;
      }
    }

    // 2. Deterministic parser — no AI required, runs regardless. When Gemini
    //    is missing, quota-limited, or errors out it fully replaces the AI
    //    result; when the AI succeeded but missed sections, its findings fill
    //    those gaps so ALL extractable data is fetched, fully offline.
    const deterministic = sanitizeImportedResume(parseResumeText(text));
    if (!imported || countExtracted(imported) === 0) {
      imported = deterministic;
    } else if (deterministic) {
      imported = mergeImported(imported, deterministic);
    }

    if (!imported || countExtracted(imported) === 0) {
      return NextResponse.json(
        { success: false, error: "No usable resume content could be extracted from the file. Please try a different file." },
        { status: 422 }
      );
    }

    const title = imported.personalInfo.fullName
      ? `${imported.personalInfo.fullName}'s Resume`
      : "Imported Resume";

    // Create the resume with the extracted top-level data (profile pre-fill is
    // skipped so imported content is the single source of truth).
    const resume = await createResume(session.user.id, {
      title,
      template: templateOverride || "modern",
      targetLevel: imported.targetLevel,
      personalInfo: imported.personalInfo as typeof imported.personalInfo,
      summary: imported.summary,
      prefill: false,
    });

    // Best-effort section fill — each section that has content is written
    // through the same whitelist-mapped path used by the builder.
    const sections: [string, unknown][] = [
      ["experience", imported.experience],
      ["education", imported.education],
      ["projects", imported.projects],
      ["certifications", imported.certifications],
      ["achievements", imported.achievements],
      ["languages", imported.languages],
    ];

    for (const [sectionType, data] of sections) {
      if (Array.isArray(data) && data.length === 0) continue;
      try {
        await updateSections(resume.id, session.user.id, sectionType, data);
      } catch (err) {
        // Section fill is best-effort — never fail resume creation over it.
        console.error(`Failed to import section ${sectionType} into resume ${resume.id}`, err);
      }
    }

    if (Object.values(imported.skills).some((list) => (list as unknown[]).length > 0)) {
      try {
        await updateSections(resume.id, session.user.id, "skills", imported.skills);
      } catch (err) {
        console.error(`Failed to import skills into resume ${resume.id}`, err);
      }
    }

    return NextResponse.json({ success: true, data: { id: resume.id, title } }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
