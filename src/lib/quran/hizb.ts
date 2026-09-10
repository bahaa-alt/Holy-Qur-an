/**
 * Hizb boundaries: the 60-part division of the Qur'an (each Juz' split
 * into exactly two Hizb), identical across every Uthmani-script Mushaf
 * edition. Each entry is the (surah, ayah) where that Hizb begins.
 *
 * Source: the per-ayah hizbid field in the community-maintained
 * azvox/quran.json dataset, cross-checked against this file's own
 * independently-sourced JUZ_STARTS (see juz.ts) -- by definition every
 * odd-numbered Hizb (2n-1) must start exactly where Juz' n starts. That
 * check found the dataset's hizbid disagreed with the verified Juz' start
 * at exactly two points (Hizb 45 and Hizb 53); both are corrected below to
 * match the Juz' data rather than trusting the single conflicting source.
 * The even-numbered (true Hizb-only) midpoints are taken from the dataset
 * as-is.
 */
export interface HizbStart {
  hizb: number;
  s: number;
  a: number;
}

export const HIZB_STARTS: readonly HizbStart[] = [
  { hizb: 1, s: 1, a: 1 },
  { hizb: 2, s: 2, a: 75 },
  { hizb: 3, s: 2, a: 142 },
  { hizb: 4, s: 2, a: 203 },
  { hizb: 5, s: 2, a: 253 },
  { hizb: 6, s: 3, a: 15 },
  { hizb: 7, s: 3, a: 93 },
  { hizb: 8, s: 3, a: 171 },
  { hizb: 9, s: 4, a: 24 },
  { hizb: 10, s: 4, a: 74 },
  { hizb: 11, s: 4, a: 148 },
  { hizb: 12, s: 5, a: 27 },
  { hizb: 13, s: 5, a: 82 },
  { hizb: 14, s: 6, a: 36 },
  { hizb: 15, s: 6, a: 111 },
  { hizb: 16, s: 7, a: 1 },
  { hizb: 17, s: 7, a: 88 },
  { hizb: 18, s: 7, a: 171 },
  { hizb: 19, s: 8, a: 41 },
  { hizb: 20, s: 9, a: 34 },
  { hizb: 21, s: 9, a: 93 },
  { hizb: 22, s: 10, a: 26 },
  { hizb: 23, s: 11, a: 6 },
  { hizb: 24, s: 11, a: 84 },
  { hizb: 25, s: 12, a: 53 },
  { hizb: 26, s: 13, a: 19 },
  { hizb: 27, s: 15, a: 1 },
  { hizb: 28, s: 16, a: 51 },
  { hizb: 29, s: 17, a: 1 },
  { hizb: 30, s: 18, a: 1 },
  { hizb: 31, s: 18, a: 75 },
  { hizb: 32, s: 20, a: 1 },
  { hizb: 33, s: 21, a: 1 },
  { hizb: 34, s: 22, a: 1 },
  { hizb: 35, s: 23, a: 1 },
  { hizb: 36, s: 24, a: 21 },
  { hizb: 37, s: 25, a: 21 },
  { hizb: 38, s: 26, a: 111 },
  { hizb: 39, s: 27, a: 56 },
  { hizb: 40, s: 28, a: 51 },
  { hizb: 41, s: 29, a: 46 },
  { hizb: 42, s: 31, a: 22 },
  { hizb: 43, s: 33, a: 31 },
  { hizb: 44, s: 34, a: 24 },
  { hizb: 45, s: 36, a: 28 }, // corrected to match Juz' 23's start (see file doc comment)
  { hizb: 46, s: 37, a: 145 },
  { hizb: 47, s: 39, a: 32 },
  { hizb: 48, s: 40, a: 41 },
  { hizb: 49, s: 41, a: 47 },
  { hizb: 50, s: 43, a: 24 },
  { hizb: 51, s: 46, a: 1 },
  { hizb: 52, s: 48, a: 18 },
  { hizb: 53, s: 51, a: 31 }, // corrected to match Juz' 27's start (see file doc comment)
  { hizb: 54, s: 55, a: 1 },
  { hizb: 55, s: 58, a: 1 },
  { hizb: 56, s: 61, a: 1 },
  { hizb: 57, s: 67, a: 1 },
  { hizb: 58, s: 72, a: 1 },
  { hizb: 59, s: 78, a: 1 },
  { hizb: 60, s: 87, a: 1 },
];

export const HIZB_COUNT = HIZB_STARTS.length;

/** Which Hizb (1-60) a given verse belongs to. Same tuple-comparison logic as juzForVerse. */
export function hizbForVerse(s: number, a: number): number {
  let result = HIZB_STARTS[0].hizb;
  for (const start of HIZB_STARTS) {
    if (start.s < s || (start.s === s && start.a <= a)) {
      result = start.hizb;
    } else {
      break;
    }
  }
  return result;
}

/** The inclusive (surah, ayah) range covered by one Hizb. `end` is `null` for Hizb 60. */
export function hizbRange(hizb: number): { start: { s: number; a: number }; end: { s: number; a: number } | null } {
  const start = HIZB_STARTS.find((h) => h.hizb === hizb);
  if (!start) throw new Error(`Invalid Hizb number: ${hizb} (expected 1-${HIZB_COUNT})`);
  const next = HIZB_STARTS.find((h) => h.hizb === hizb + 1);
  return { start: { s: start.s, a: start.a }, end: next ? { s: next.s, a: next.a } : null };
}
