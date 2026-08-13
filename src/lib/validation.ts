import { z } from "zod";

// ── Auth ──
export const passwordPolicy = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number");

export const signUpSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: passwordPolicy,
  fullName: z.string().min(1, "Full name is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Valid email is required"),
});

export const resetPasswordSchema = z
  .object({
    password: passwordPolicy,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email("Valid email is required").optional(),
  currentPassword: z.string().optional(),
  newPassword: passwordPolicy.optional(),
  confirmPassword: z.string().optional(),
  userType: z.enum(["student", "experienced"]).optional(),
  current_position: z.string().optional(),
  experience_years: z.number().int().min(0).optional(),
  industry: z.string().optional(),
  current_company: z.string().optional(),
  college_name: z.string().optional(),
  degree: z.string().optional(),
  graduation_year: z.string().optional(),
  skills: z.array(z.string()).optional(),
  desired_role: z.string().optional(),
  desired_company: z.string().optional(),
  desired_industry: z.string().optional(),
  salary_range: z.string().optional(),
  work_type: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, { message: "Passwords must match", path: ["confirmPassword"] });

// ── Resumes ──
export const TEMPLATE_ENUM_VALUES = [
  "ats-professional",
  "modern",
  "student",
  "minimal",
  "executive",
  "creative",
  "executive-sidebar",
  "modern-card",
] as const;

export const templateEnum = z.enum(TEMPLATE_ENUM_VALUES);

export const ACCENT_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
export const resumeFontEnum = z.enum(["sans", "serif", "mono"]);
export const accentColorSchema = z.string().regex(ACCENT_COLOR_REGEX, "Accent color must be a hex color like #2563eb");

export const createResumeSchema = z.object({
  title: z.string().max(200).optional(),
  template: templateEnum.optional(),
  targetLevel: z.enum(["student", "fresher", "student_internship", "experienced"]).optional(),
  personalInfo: z.record(z.string(), z.unknown()).optional(),
  summary: z.string().optional(),
  accentColor: accentColorSchema.optional().nullable(),
  fontFamily: resumeFontEnum.optional(),
  // Pre-fill the new resume from the user's profile/onboarding data (default true).
  // "Start with Empty" sends false to get a blank resume.
  prefill: z.boolean().optional(),
  // Target role — refines the auto-filled section structure (template preset).
  role: z.string().max(200).optional(),
  // Explicit section order; overrides the template's recommended preset.
  sectionOrder: z.array(z.string().max(64)).optional(),
});

export const updateResumeSchema = z.object({
  title: z.string().max(200).optional(),
  template: templateEnum.optional(),
  targetLevel: z.enum(["student", "fresher", "student_internship", "experienced"]).optional(),
  personalInfo: z.record(z.string(), z.unknown()).optional(),
  summary: z.string().optional(),
  accentColor: accentColorSchema.optional().nullable(),
  fontFamily: resumeFontEnum.optional(),
  sectionOrder: z.array(z.string().max(64)).optional(),
  coursework: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  // User-created custom sections (JSONB passthrough, K-04)
  customSections: z.record(z.string(), z.unknown()).optional(),
  // Pinned to the top of the dashboard (Epic 3, Task 3.1)
  isPinned: z.boolean().optional(),
  sectionType: z.string().optional(),
  data: z.unknown().optional(),
  sections: z.record(z.string(), z.unknown()).optional(),
});

// ── Applications ──
const applicationStatusEnum = z.enum(["applied", "interview", "rejected", "offer"]);

export const createApplicationSchema = z.object({
  company: z.string().min(1, "Company is required").max(200),
  role: z.string().min(1, "Role is required").max(200),
  status: applicationStatusEnum.optional().default("applied"),
  notes: z.string().max(2000).optional().default(""),
  resume_id: z.string().uuid().optional().nullable(),
  date_applied: z.string().optional(),
});

export const updateApplicationSchema = z.object({
  company: z.string().min(1).max(200).optional(),
  role: z.string().min(1).max(200).optional(),
  status: applicationStatusEnum.optional(),
  notes: z.string().max(2000).optional(),
  resume_id: z.string().uuid().optional().nullable(),
  date_applied: z.string().optional(),
  outcome_type: z.enum(["round_reached", "offer", "rejected"]).optional().nullable(),
  outcome_notes: z.string().max(2000).optional(),
  interview_round: z.number().int().min(1).max(20).optional().nullable(),
});

// ── Resume Updates ──
export const updateResumeUpdateSchema = z
  .object({
    updateId: z.string().uuid("Invalid update ID"),
    status: z.enum(["added", "ignored"]),
    resumeId: z.string().uuid("Resume ID is required").optional(),
  })
  .refine((data) => data.status !== "added" || Boolean(data.resumeId), {
    message: "A resume must be selected when adding an update",
    path: ["resumeId"],
  });

// ── AI ──
export const aiActionEnum = z.enum([
  "generate-summary", "enhance-bullet", "check-grammar",
  "suggest-achievements", "add-keywords", "rewrite-section",
  "cover-letter", "ats-score", "analyze-jd",
  "company-variant", "role-variant",
  "profile-improvement", "github-repo-suggest",
  "recruiter-email", "linkedin-message", "interview-questions",
  "optimize-resume", "targeted-skills", "ats-keyword-optimization",
]);

export const aiRequestSchema = z.object({
  action: aiActionEnum,
  input: z.string().min(1),
  context: z.string().optional().default(""),
});

// ── Admin ──
export const adminUserUpdateSchema = z.object({
  id: z.string().uuid("Invalid user id"),
  role: z.enum(["user", "admin"]).optional(),
  is_active: z.boolean().optional(),
});

// ── Stripe ──
export const checkoutSchema = z.object({
  priceId: z.string().min(1, "Price ID is required"),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

// ── GitHub ──
export const githubTokenSchema = z.object({
  code: z.string().min(1, "Authorization code is required"),
});

// ── LinkedIn ──
export const linkedinTokenSchema = z.object({
  code: z.string().min(1, "Authorization code is required"),
});

export const linkedinManualAddSchema = z.object({
  resumeId: z.string().uuid("Resume ID is required"),
  type: z.enum(["certificate", "achievement", "post_reference"]),
  title: z.string().min(1, "Title is required").max(200),
  issuer: z.string().max(200).optional().default(""),
  description: z.string().max(2000).optional().default(""),
  date: z.string().optional(),
  url: z.string().url().optional().or(z.literal("")),
});

// ── Duplicate Resume ──
export const duplicateResumeSchema = z.object({
  title: z.string().max(200).optional(),
});

// ── Templates (admin) ──
// The catalog is data-driven and open-ended, so admin categories accept the
// built-in buckets plus 'imported' (the data-driven designs).
export const templateCategoryEnum = z.enum([...TEMPLATE_ENUM_VALUES, "imported"] as const);

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  category: templateCategoryEnum,
  description: z.string().max(500).optional().default(""),
  thumbnail_url: z.string().max(500).optional().default(""),
  component_key: z.string().min(1, "Component key is required").max(100),
  is_active: z.boolean().optional().default(true),
  sort_order: z.number().int().optional(),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: templateCategoryEnum.optional(),
  description: z.string().max(500).optional(),
  thumbnail_url: z.string().max(500).optional(),
  component_key: z.string().min(1).max(100).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

// ── ATS Score ──
export const atsScoreRequestSchema = z.object({
  resumeId: z.string().uuid("Resume ID is required"),
  jobDescription: z.string().optional(),
  category: z.enum(["student", "fresher", "internship", "experienced"]).optional(),
});

// Helper: validate and return structured error response
import { NextResponse } from "next/server";

export function validateOrError<T>(schema: z.ZodSchema<T>, data: unknown): { data: T } | { error: NextResponse } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: result.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 }
      ),
    };
  }
  return { data: result.data };
}
