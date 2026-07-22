import { z } from "zod";

// ── Auth ──
export const signUpSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(1).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
  confirmPassword: z.string().optional(),
  userType: z.enum(["student", "experienced"]).optional(),
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
export const createResumeSchema = z.object({
  title: z.string().max(200).optional(),
  template: z.enum(["ats-professional", "modern", "student", "minimal", "executive", "creative"]).optional(),
  personalInfo: z.record(z.string(), z.unknown()).optional(),
  summary: z.string().optional(),
});

export const updateResumeSchema = z.object({
  title: z.string().max(200).optional(),
  template: z.enum(["ats-professional", "modern", "student", "minimal", "executive", "creative"]).optional(),
  personalInfo: z.record(z.string(), z.unknown()).optional(),
  summary: z.string().optional(),
  sectionType: z.string().optional(),
  data: z.unknown().optional(),
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
});

// ── Resume Updates ──
export const updateResumeUpdateSchema = z.object({
  updateId: z.string().uuid("Invalid update ID"),
  status: z.enum(["added", "ignored"]),
});

// ── AI ──
export const aiActionEnum = z.enum([
  "generate-summary", "enhance-bullet", "check-grammar",
  "suggest-achievements", "add-keywords", "rewrite-section",
  "cover-letter", "ats-score", "analyze-jd",
  "company-variant", "role-variant",
]);

export const aiRequestSchema = z.object({
  action: aiActionEnum,
  input: z.string().min(1),
  context: z.string().optional().default(""),
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
export const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  category: z.enum(["ats-professional", "modern", "student", "minimal", "executive", "creative"]),
  description: z.string().max(500).optional().default(""),
  thumbnail_url: z.string().max(500).optional().default(""),
  component_key: z.string().min(1, "Component key is required").max(100),
  is_active: z.boolean().optional().default(true),
  sort_order: z.number().int().optional(),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.enum(["ats-professional", "modern", "student", "minimal", "executive", "creative"]).optional(),
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
