/**
 * Ambient declarations for the pdfjs-dist worker entry point.
 *
 * pdfjs-dist only ships type declarations for `pdf.mjs`, not `pdf.worker.mjs`,
 * but we statically import the worker (see src/services/resume-analyzer/parser.ts)
 * so it is traced into the standalone build and registered on
 * `globalThis.pdfjsWorker` — which lets pdfjs skip its runtime dynamic import
 * that Next.js cannot bundle.
 *
 * Version parity note: the worker module passed via `globalThis.pdfjsWorker`
 * must come from the same pdfjs-dist version as the `pdf.mjs` that pdf-parse
 * loads. Both resolve to the single physical `pdfjs-dist@5.4.296` copy in the
 * pnpm store (pdf-parse's dep range dedupes onto our pinned direct dep). Keep
 * them in sync when bumping either dependency.
 */
declare module "pdfjs-dist/legacy/build/pdf.worker.mjs" {
  export const WorkerMessageHandler: unknown;
}

/**
 * pdfjs's documented main-thread worker registration point (fake worker).
 * parser.ts assigns `globalThis.pdfjsWorker` once at first parse. Ambient
 * globals must use `var` to stay mutable, so no-var is disabled here.
 */
// eslint-disable-next-line no-var
declare var pdfjsWorker: { WorkerMessageHandler: unknown } | undefined;
