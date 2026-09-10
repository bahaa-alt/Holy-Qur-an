import type { SurahFile, SurahVerse } from "@/lib/data/types";

/**
 * Juz' (Para) boundaries: the standard 30-part division of the Qur'an used
 * for daily/monthly reading plans, identical across every Uthmani-script
 * Mushaf edition (a structural division of the text, not a translation or
 * interpretive choice). Each entry is the (surah, ayah) where that Juz'
 * begins. Cross-checked against the community-maintained quranjson dataset
 * (github.com/semarketir/quranjson) rather than typed from memory alone.
 */
export interface JuzStart {
  juz: number;
  s: number;
  a: number;
}

export const JUZ_STARTS: readonly JuzStart[] = [
  { juz: 1, s: 1, a: 1 },
  { juz: 2, s: 2, a: 142 },
  { juz: 3, s: 2, a: 253 },
  { juz: 4, s: 3, a: 93 },
  { juz: 5, s: 4, a: 24 },
  { juz: 6, s: 4, a: 148 },
  { juz: 7, s: 5, a: 82 },
  { juz: 8, s: 6, a: 111 },
  { juz: 9, s: 7, a: 88 },
  { juz: 10, s: 8, a: 41 },
  { juz: 11, s: 9, a: 93 },
  { juz: 12, s: 11, a: 6 },
  { juz: 13, s: 12, a: 53 },
  { juz: 14, s: 15, a: 1 },
  { juz: 15, s: 17, a: 1 },
  { juz: 16, s: 18, a: 75 },
  { juz: 17, s: 21, a: 1 },
  { juz: 18, s: 23, a: 1 },
  { juz: 19, s: 25, a: 21 },
  { juz: 20, s: 27, a: 56 },
  { juz: 21, s: 29, a: 46 },
  { juz: 22, s: 33, a: 31 },
  { juz: 23, s: 36, a: 28 },
  { juz: 24, s: 39, a: 32 },
  { juz: 25, s: 41, a: 47 },
  { juz: 26, s: 46, a: 1 },
  { juz: 27, s: 51, a: 31 },
  { juz: 28, s: 58, a: 1 },
  { juz: 29, s: 67, a: 1 },
  { juz: 30, s: 78, a: 1 },
];

export const JUZ_COUNT = JUZ_STARTS.length;

/**
 * Which Juz' (1-30) a given verse belongs to. Compares (s, a) as a tuple
 * against each boundary in order -- valid because every ayah of surah N
 * precedes every ayah of surah N+1 in Qur'an order, so lexicographic
 * (surah, ayah) comparison is exactly Qur'an order.
 */
export function juzForVerse(s: number, a: number): number {
  let result = JUZ_STARTS[0].juz;
  for (const start of JUZ_STARTS) {
    if (start.s < s || (start.s === s && start.a <= a)) {
      result = start.juz;
    } else {
      break;
    }
  }
  return result;
}

/**
 * The inclusive (surah, ayah) range covered by one Juz'. `end` is `null`
 * for Juz' 30, which runs to the end of the Qur'an rather than to another
 * Juz's start.
 */
export function juzRange(juz: number): { start: { s: number; a: number }; end: { s: number; a: number } | null } {
  const start = JUZ_STARTS.find((j) => j.juz === juz);
  if (!start) throw new Error(`Invalid Juz' number: ${juz} (expected 1-${JUZ_COUNT})`);
  const next = JUZ_STARTS.find((j) => j.juz === juz + 1);
  return { start: { s: start.s, a: start.a }, end: next ? { s: next.s, a: next.a } : null };
}

/** Every surah number touched (even partially) by a given Juz'. */
export function juzSurahNumbers(juz: number): number[] {
  const { start, end } = juzRange(juz);
  const endSurah = end ? end.s : 114;
  return Array.from({ length: endSurah - start.s + 1 }, (_, i) => start.s + i);
}

/**
 * Every verse belonging to a Juz', given the already-fetched surah files it
 * touches (a caller only needs to fetch {@link juzSurahNumbers}, not all
 * 114). A boundary surah is filtered to just the ayahs inside the Juz';
 * a surah entirely inside it is taken in full.
 */
export function filterVersesInJuz(juz: number, surahsByNum: ReadonlyMap<number, SurahFile>): SurahVerse[] {
  const { start, end } = juzRange(juz);
  const result: SurahVerse[] = [];

  for (const n of juzSurahNumbers(juz)) {
    const surah = surahsByNum.get(n);
    if (!surah) continue;

    for (const verse of surah.verses) {
      const afterStart = n > start.s || (n === start.s && verse.a >= start.a);
      const beforeEnd = !end || n < end.s || (n === end.s && verse.a < end.a);
      if (afterStart && beforeEnd) result.push(verse);
    }
  }

  return result;
}
