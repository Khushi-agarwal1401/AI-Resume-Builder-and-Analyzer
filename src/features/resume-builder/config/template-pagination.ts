/**
 * Epic 10.2 — Infinite-scroll pagination helpers for the template catalog.
 *
 * The catalog is fetched in full; the grid reveals a page of cards at a time
 * as the user scrolls, so the DOM (and the heavy per-card previews) stays
 * small even as more templates are added over time.
 */

/** Cards revealed per "load more" step (two desktop rows of three). */
export const TEMPLATE_PAGE_SIZE = 6;

/** The next number of revealed cards after one load-more step (clamped to total). */
export function nextVisibleCount(
  current: number,
  total: number,
  pageSize: number = TEMPLATE_PAGE_SIZE
): number {
  return Math.min(current + pageSize, Math.max(total, 0));
}

/** Whether more cards remain to be revealed. */
export function hasMoreTemplates(loaded: number, total: number): boolean {
  return loaded < total;
}
