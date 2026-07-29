import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { ResumeData } from "@/types/resume";
import { ResumePDF } from "./pdf-templates";

// ── Public API ──────────────────────────────────────────────────────────

export async function generatePdfBuffer(resume: ResumeData): Promise<Buffer> {
  return await renderToBuffer(<ResumePDF resume={resume} />);
}
