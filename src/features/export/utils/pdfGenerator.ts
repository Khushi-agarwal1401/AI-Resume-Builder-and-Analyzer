/**
 * Fetches the printable HTML export for a resume from the server.
 * The browser can open this HTML and use File > Print > Save as PDF.
 */
export async function fetchExportHtml(resumeId: string): Promise<Blob | null> {
  try {
    const res = await fetch(`/api/export/${resumeId}`);
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}
