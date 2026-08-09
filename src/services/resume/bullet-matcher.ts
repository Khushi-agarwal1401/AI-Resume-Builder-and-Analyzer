/**
 * Pure bullet-matching + rewrite logic shared by the apply-bullets route.
 *
 * Kept free of framework/db imports so it can be unit-tested directly.
 * The route is a thin shell: auth, body validation, persistence.
 */

export interface BulletPair {
  original: string;
  rewrite: string;
}

export interface ApplyResult {
  experience: ExperienceEntry[];
  applied: string[];
  alreadyPresent: string[];
  notFound: string[];
}

export interface ExperienceEntry {
  responsibilities: string[];
  achievements: string[];
  [key: string]: unknown;
}

/**
 * Normalize a bullet for fuzzy matching: lowercase, trim, collapse whitespace,
 * drop trailing punctuation.
 */
export function normalizeBullet(b: string): string {
  return b
    .toLowerCase()
    .replace(/[\s]+/g, " ")
    .trim()
    .replace(/[.,;:!?]+$/, "");
}

/** Strict normalized-equality match (survives casing + punctuation changes). */
export function bulletsEqual(a: string, b: string): boolean {
  const na = normalizeBullet(a);
  const nb = normalizeBullet(b);
  return na !== "" && na === nb;
}

/**
 * Fuzzy match: containment either way, or >=60% of the significant words of the
 * shorter string shared with the longer one. Used as a fallback after exact
 * matching, so AI rewrites of pasted resumes still land without hijacking a
 * different-but-similar bullet that already matches exactly.
 */
export function bulletsSimilar(a: string, b: string): boolean {
  const na = normalizeBullet(a);
  const nb = normalizeBullet(b);
  if (!na || !nb) return false;
  if (na.includes(nb) || nb.includes(na)) return true;

  const words = (s: string) => s.split(" ").filter((w) => w.length > 2);
  const wa = words(na);
  const wb = words(nb);
  if (wa.length === 0 || wb.length === 0) return false;
  const [shorter, longer] = wa.length <= wb.length ? [wa, wb] : [wb, wa];
  const shared = shorter.filter((w) => longer.includes(w)).length;
  return shared / shorter.length >= 0.6;
}

/**
 * Rebuild the experience array, replacing each pair's first fuzzy match at most
 * once (exact matches preferred globally, then fuzzy). Dedupes pairs whose
 * rewrite already exists on the resume.
 *
 * Mutates the caller's array in place for efficiency but returns it (plus the
 * accounting arrays) for convenience in tests.
 */
export function applyBulletRewrites(
  experience: ExperienceEntry[],
  pairs: BulletPair[]
): ApplyResult {
  const applied: string[] = [];
  const alreadyPresent: string[] = [];
  const notFound: string[] = [];
  const usedSlotKeys = new Set<string>();
  const usedRewrites = new Set<string>(
    experience
      .flatMap((e) => [...e.responsibilities, ...(e.achievements || [])])
      .map(normalizeBullet)
  );

  for (const pair of pairs) {
    // Dedupe: skip pairs whose rewrite already exists on the resume.
    if (usedRewrites.has(normalizeBullet(pair.rewrite))) {
      alreadyPresent.push(pair.original);
      continue;
    }

    // Locate the first exact match anywhere, then the first fuzzy match —
    // ignoring slots already claimed by an earlier pair in this request.
    let match: { entryIdx: number; list: "responsibilities" | "achievements"; idx: number; text: string } | undefined;

    outer: for (const entryIdx of experience.keys()) {
      const entry = experience[entryIdx];
      for (const [list, items] of [
        ["responsibilities", entry.responsibilities],
        ["achievements", entry.achievements || []],
      ] as const) {
        for (let idx = 0; idx < items.length; idx++) {
          const key = `${entryIdx}:${list}:${idx}`;
          if (usedSlotKeys.has(key)) continue;
          if (bulletsEqual(items[idx], pair.original)) {
            match = { entryIdx, list, idx, text: items[idx] };
            break outer;
          }
        }
      }
    }

    if (!match) {
      outer: for (const entryIdx of experience.keys()) {
        const entry = experience[entryIdx];
        for (const [list, items] of [
          ["responsibilities", entry.responsibilities],
          ["achievements", entry.achievements || []],
        ] as const) {
          for (let idx = 0; idx < items.length; idx++) {
            const key = `${entryIdx}:${list}:${idx}`;
            if (usedSlotKeys.has(key)) continue;
            if (bulletsSimilar(items[idx], pair.original)) {
              match = { entryIdx, list, idx, text: items[idx] };
              break outer;
            }
          }
        }
      }
    }

    if (!match) {
      notFound.push(pair.original);
      continue;
    }

    const { entryIdx, list, idx } = match;
    experience[entryIdx][list][idx] = pair.rewrite;
    usedSlotKeys.add(`${entryIdx}:${list}:${idx}`);
    usedRewrites.add(normalizeBullet(pair.rewrite));
    applied.push(pair.original);
  }

  return { experience, applied, alreadyPresent, notFound };
}

/** Validate + sanitize a raw JSON body into BulletPairs (mirrors route behavior). */
export function parseBulletPairs(raw: unknown): BulletPair[] {
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[])
    .map((b) => {
      const item = b as Record<string, unknown>;
      if (typeof item?.original !== "string" || !item.original.trim()) return null;
      return {
        original: item.original.trim().slice(0, 500),
        rewrite:
          typeof item.rewrite === "string" ? item.rewrite.trim().slice(0, 500) : "",
      };
    })
    .filter((p): p is BulletPair => p !== null)
    .slice(0, 20);
}
