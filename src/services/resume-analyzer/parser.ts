/**
 * Registers pdfjs-dist's worker module on the global object. pdfjs checks
 * `globalThis.pdfjsWorker?.WorkerMessageHandler` before falling back to a
 * dynamic `import(workerSrc)` — and that dynamic import is invisible to both
 * Next.js's bundler and its standalone file tracer, which caused
 * "Setting up fake worker failed: Cannot find module .../pdf.worker.mjs" when
 * uploading PDFs. A literal import here is statically traceable, so the worker
 * is present at runtime in dev and in the standalone production build.
 */
async function ensurePdfWorker(): Promise<void> {
  if (globalThis.pdfjsWorker) return;
  globalThis.pdfjsWorker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
}

import { callAi } from "@/services/ai/client";
import { ocrPdfLocally } from "./local-ocr";

function isUsefulPdfAiOutput(output: string, currentText: string): boolean {
  const normalized = output.trim();
  if (!normalized) return false;
  if (/generated locally from your data/i.test(normalized)) return false;
  if (/^no content provided\.?$/i.test(normalized.split("\n")[0]?.trim() ?? "")) return false;
  return normalized.length > currentText.trim().length;
}

export async function parseResumeFile(
  buffer: Buffer,
  filename: string
): Promise<{ text: string; error?: string }> {
  const ext = filename.split(".").pop()?.toLowerCase();

  try {
    if (ext === "pdf") {
      await ensurePdfWorker();
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      let text = result.text || "";

      // Image-based/scanned PDFs: pdf-parse extracts almost nothing, so run
      // LOCAL OCR (Tesseract) — works without Gemini, no API key, no quota.
      if (text.trim().length < 150) {
        const localText = await ocrPdfLocally(buffer);
        if (localText.trim().length > text.trim().length) {
          text = localText.trim();
        }
      }

      // Gemini OCR remains a last resort when local OCR produced nothing
      // useful (only runs when a key is configured — never required).
      if (text.trim().length < 150 && process.env.GEMINI_API_KEY) {
        try {
          const aiRes = await callAi({
            action: "extract-pdf-text",
            input: "",
            context: "",
            fileData: {
              mimeType: "application/pdf",
              data: buffer.toString("base64"),
            },
          });
          if (aiRes.success && aiRes.output && isUsefulPdfAiOutput(aiRes.output, text)) {
            text = aiRes.output.trim();
          }
        } catch (e) {
          console.error("[parser] Gemini OCR fallback failed:", e);
        }
      }

      return { text };
    }

    if (ext === "docx") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return { text: result.value || "" };
    }

    if (ext === "txt") {
      return { text: buffer.toString("utf-8") };
    }

    return { text: "", error: `Unsupported file type: .${ext}. Please upload PDF, DOCX, or TXT.` };
  } catch (err) {
    return { text: "", error: `Failed to parse file: ${err instanceof Error ? err.message : "Unknown error"}` };
  }
}

const SECTION_HEADERS = [
  { label: "contact", patterns: [/contact/i, /personal information/i, /personal details/i] },
  { label: "summary", patterns: [/summary/i, /objective/i, /professional summary/i, /profile/i, /about me/i] },
  { label: "education", patterns: [/education/i, /academic/i, /qualifications/i, /degrees?/i] },
  { label: "experience", patterns: [/experience/i, /work experience/i, /employment/i, /work history/i, /professional experience/i] },
  { label: "skills", patterns: [/skills/i, /technical skills/i, /core competencies/i, /expertise/i, /technologies/i] },
  { label: "projects", patterns: [/projects/i, /personal projects/i, /academic projects/i, /key projects/i] },
  { label: "certifications", patterns: [/certifications/i, /certificates/i, /licenses/i, /accreditations/i] },
  { label: "achievements", patterns: [/achievements/i, /accomplishments/i, /awards/i, /honors/i, /recognitions/i] },
  { label: "languages", patterns: [/languages/i, /language proficiency/i] },
  { label: "publications", patterns: [/publications/i, /papers/i, /research/i] },
  { label: "volunteering", patterns: [/volunteer/i, /volunteering/i, /community/i] },
  { label: "references", patterns: [/references/i] },
];

/**
 * A line only counts as a section heading when it is a short standalone label.
 * Content lines like "Technologies: React, Node.js, PostgreSQL" match the
 * skills heading regex but are NOT headings — excluding colon-value lines
 * prevents them from swallowing the section they belong to.
 */
function isSectionHeading(line: string): boolean {
  const colonIdx = line.indexOf(":");
  if (colonIdx !== -1 && line.slice(colonIdx + 1).trim().length > 0) return false;
  return line.length < 60;
}

export function extractSections(text: string): Record<string, string> {
  const lines = text.split("\n");
  const sections: Record<string, string> = {};
  const headerPositions: { pos: number; label: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    for (const section of SECTION_HEADERS) {
      if (section.patterns.some((p) => p.test(line)) && isSectionHeading(line)) {
        headerPositions.push({ pos: i, label: section.label });
        break;
      }
    }
  }

  for (let i = 0; i < headerPositions.length; i++) {
    const current = headerPositions[i];
    const next = headerPositions[i + 1];
    const endPos = next ? next.pos : lines.length;
    const content = lines.slice(current.pos + 1, endPos).join("\n").trim();
    sections[current.label] = content;
  }

  return sections;
}

export function detectMissingSections(text: string): { present: string[]; missing: string[] } {
  const sections = extractSections(text);
  const required = ["summary", "experience", "education", "skills"];

  const present = Object.keys(sections).filter((k) => k !== "unknown" && sections[k].length > 0);
  const found = new Set(present);

  const missing = required.filter((s) => !found.has(s));

  return { present, missing };
}

export function extractEmail(text: string): string | null {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : null;
}

export function extractPhone(text: string): string | null {
  const match = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  return match ? match[0] : null;
}

export function extractLinks(text: string): string[] {
  const links: string[] = [];
  const urlPattern = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)/g;
  const matches = text.match(urlPattern);
  if (matches) links.push(...matches);
  return links;
}
