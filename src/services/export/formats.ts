/**
 * Shared export format types + metadata used by the export API route and
 * the export UI (ExportDialog / ExportButton). Kept in one place so adding
 * a new format only touches this module.
 */

export type ExportFormat = "pdf" | "docx" | "txt" | "html" | "latex";

export const EXPORT_FORMATS: ExportFormat[] = ["pdf", "docx", "txt", "html", "latex"];

export const EXPORT_META: Record<
  ExportFormat,
  { contentType: string; extension: string; label: string; description: string }
> = {
  pdf: {
    contentType: "application/pdf",
    extension: "pdf",
    label: "PDF",
    description: "Pixel-perfect, print-ready",
  },
  docx: {
    contentType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extension: "docx",
    label: "Word",
    description: "Editable .docx for Word/Google Docs",
  },
  txt: {
    contentType: "text/plain; charset=utf-8",
    extension: "txt",
    label: "Plain Text",
    description: "ATS-optimized plain text",
  },
  html: {
    contentType: "text/html; charset=utf-8",
    extension: "html",
    label: "HTML",
    description: "Web-ready HTML page",
  },
  latex: {
    contentType: "application/x-tex; charset=utf-8",
    extension: "tex",
    label: "LaTeX",
    description: "Professional .tex source for XeLaTeX",
  },
};

export function isExportFormat(value: string | null | undefined): value is ExportFormat {
  return !!value && value in EXPORT_META;
}

/**
 * Sanitizes a raw filename so it can be safely interpolated into a
 * Content-Disposition header (no quotes, CR/LF, or backslashes).
 */
export function sanitizeFilename(name: string): string {
  return name.replace(/["\r\n\\]/g, "").trim();
}
