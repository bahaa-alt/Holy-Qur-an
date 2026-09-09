import type { MetaFile } from "./types";

/**
 * Converts between a stable global verse id (0-based, Quran order -- the
 * same numbering used by en-index.json's postings) and a (surah, ayah)
 * reference, using each surah's ayah count from meta.json. Both directions
 * are pure arithmetic over `meta.surahs`, so no extra data needs to be
 * shipped just to support this lookup.
 */

export function globalIdToRef(meta: MetaFile, globalId: number): { s: number; a: number } | null {
  if (globalId < 0) return null;
  let remaining = globalId;
  for (const surah of meta.surahs) {
    if (remaining < surah.ayahs) {
      return { s: surah.n, a: remaining + 1 };
    }
    remaining -= surah.ayahs;
  }
  return null;
}

export function refToGlobalId(meta: MetaFile, s: number, a: number): number | null {
  let globalId = 0;
  for (const surah of meta.surahs) {
    if (surah.n === s) {
      if (a < 1 || a > surah.ayahs) return null;
      return globalId + (a - 1);
    }
    globalId += surah.ayahs;
  }
  return null;
}
