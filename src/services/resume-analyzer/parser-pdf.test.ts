import { describe, it, expect, afterEach } from "vitest";
import { parseResumeFile } from "./parser";

/**
 * Builds a minimal single-page PDF with selectable text and a correct xref
 * table (byte offsets computed programmatically). pdfjs-dist is strict about
 * malformed xrefs, so offsets must be accurate.
 */
function buildMinimalPdf(text: string): Buffer {
  const esc = text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${42 + esc.length} >>\nstream\nBT /F1 24 Tf 72 700 Td (${esc}) Tj ET\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const off of offsets) {
    pdf += `${off.toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

describe("parseResumeFile (PDF)", () => {
  afterEach(() => {
    // Avoid leaking the pdfjs worker registration across tests.
    delete globalThis.pdfjsWorker;
  });

  it("extracts text from a real PDF via pdf-parse + pdfjs fake worker", async () => {
    const pdf = buildMinimalPdf("Alex Johnson Senior Software Engineer");
    const result = await parseResumeFile(pdf, "resume.pdf");

    expect(result.error).toBeUndefined();
    expect(result.text).toContain("Alex Johnson");
    expect(result.text).toContain("Senior Software Engineer");
  }, 15_000);

  it("registers the pdfjs worker exactly once", async () => {
    const pdf = buildMinimalPdf("Hello Resume");
    const first = await parseResumeFile(pdf, "resume.pdf");
    const firstWorker = globalThis.pdfjsWorker;
    expect(firstWorker).toBeDefined();

    const second = await parseResumeFile(pdf, "resume.pdf");
    const secondWorker = globalThis.pdfjsWorker;
    expect(secondWorker).toBe(firstWorker);
    expect(second.text).toContain("Hello Resume");
    expect(first.error).toBeUndefined();
  }, 15_000);

  it("rejects a non-PDF extension without touching pdfjs", async () => {
    const result = await parseResumeFile(Buffer.from("plain text"), "notes.txt");
    expect(result.text).toBe("plain text");
  });
});
