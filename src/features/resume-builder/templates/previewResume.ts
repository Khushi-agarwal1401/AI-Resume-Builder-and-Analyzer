/**
 * Shared, safe demo resume for every template preview.
 *
 * The single source of truth lives at `config/sample-resume.ts` (SAMPLE_RESUME)
 * so the landing gallery, catalog page, and all template pickers render the
 * SAME fictional profile. This module is the documented entry point used by
 * preview components and tests:
 *
 *   import { previewResume } from "@/features/resume-builder/templates/previewResume";
 *
 * Never use real user resume data for template previews.
 */
export { SAMPLE_RESUME as previewResume } from "../config/sample-resume";
