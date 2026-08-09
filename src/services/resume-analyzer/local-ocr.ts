/**
 * Local OCR for scanned / image-based PDFs — no API key, no external calls.
 *
 * Pipeline: pdfjs-dist renders each PDF page to a canvas (@napi-rs/canvas),
 * then Tesseract.js (with the bundled `eng` language data from
 * @tesseract.js-data/eng) recognizes the text. Language data is shipped in
 * node_modules, so nothing is downloaded at runtime.
 *
 * Used as the primary OCR fallback in parseResumeFile; Gemini remains a last
 * resort when configured, but everything here works fully offline.
 */
const OCR_SCALE = 2.5;
const MAX_PAGES = 5;

/** Lazy singleton Tesseract worker — creation is expensive (~1s + WASM load). */
let workerPromise: Promise<import("tesseract.js").Worker> | null = null;

async function getWorker(): Promise<import("tesseract.js").Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import("tesseract.js");
      // @tesseract.js-data/eng ships the eng.traineddata.gz bundle and exports
      // { code, gzip, langPath } (see src/types/tesseract-data-eng.d.ts).
      const engModule = (await import("@tesseract.js-data/eng")) as { default: { code: string; gzip: boolean; langPath: string } };
      const eng = engModule.default;
      const worker = await createWorker(eng.code, 1, {
        gzip: eng.gzip,
        langPath: eng.langPath,
        cachePath: "/tmp/tesseract-cache",
        cacheMethod: "none",
      });
      return worker;
    })();
    // Reset on failure so a later call retries instead of reusing a dead promise.
    workerPromise.catch(() => {
      workerPromise = null;
    });
  }
  return workerPromise;
}

/**
 * OCR a PDF buffer and return the recognized text. Returns "" on any failure
 * (callers fall back to their next strategy). Renders at most MAX_PAGES pages.
 */
export async function ocrPdfLocally(buffer: Buffer): Promise<string> {
  try {
    // 1. Render pages to PNG buffers with pdfjs-dist + @napi-rs/canvas. Both
    //    are imported dynamically so the native canvas module never leaks into
    //    any client bundle — this code only ever runs server-side.
    const { createCanvas } = await import("@napi-rs/canvas");
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const uint8 = new Uint8Array(buffer);
    const doc = await pdfjs.getDocument({ data: uint8 }).promise;

    const pages = Math.min(doc.numPages, MAX_PAGES);
    const images: Buffer[] = [];
    for (let i = 1; i <= pages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale: OCR_SCALE });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      // @napi-rs/canvas implements the canvas 2D API pdfjs needs; its type is a
      // SKRSContext2D which differs from the DOM CanvasRenderingContext2D type
      // pdfjs declares — the cast is safe (runtime-compatible).
      const renderParams = { canvas, canvasContext: canvas.getContext("2d"), viewport } as unknown as Parameters<
        typeof page.render
      >[0];
      await page.render(renderParams).promise;
      images.push(canvas.toBuffer("image/png"));
      page.cleanup();
    }

    // 2. Recognize each page and concatenate.
    const worker = await getWorker();
    const parts: string[] = [];
    for (const image of images) {
      const { data } = await worker.recognize(image);
      if (data.text) parts.push(data.text.trim());
    }
    await doc.destroy();
    return parts.join("\n\n");
  } catch (err) {
    console.error("[local-ocr] OCR failed:", err);
    return "";
  }
}
