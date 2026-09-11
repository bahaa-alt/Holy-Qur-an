import type { AbjadTotalsFile } from "@/lib/data/types";

export interface AbjadValueGroup {
  value: number;
  verseCount: number;
  surahCount: number;
  /** distinct word forms sharing this value (already pre-filtered upstream
   *  to shared-value forms only -- see AbjadTotalsFile.byWord's doc comment) */
  wordForms: string[];
}

/**
 * Groups every verse total, surah total, and distinct word form by their
 * shared Abjad value, keeping only values with 2+ members across those
 * three categories combined -- a value nothing else shares isn't "common".
 * Sorted by member count descending (most-shared value first), so a caller
 * can just take the top N for display. Pure and O(n) over data already
 * fetched as AbjadTotalsFile -- no new data file or client fetch.
 */
export function buildAbjadCommonValues(abjad: AbjadTotalsFile): AbjadValueGroup[] {
  const groups = new Map<number, AbjadValueGroup>();

  function groupFor(value: number): AbjadValueGroup {
    let g = groups.get(value);
    if (!g) {
      g = { value, verseCount: 0, surahCount: 0, wordForms: [] };
      groups.set(value, g);
    }
    return g;
  }

  for (const total of abjad.byVerse) groupFor(total).verseCount++;
  for (const total of abjad.bySurah) groupFor(total).surahCount++;
  for (const w of abjad.byWord) groupFor(w.value).wordForms.push(w.form);

  const result = [...groups.values()].filter((g) => g.verseCount + g.surahCount + g.wordForms.length >= 2);
  result.sort((a, b) => {
    const sizeA = a.verseCount + a.surahCount + a.wordForms.length;
    const sizeB = b.verseCount + b.surahCount + b.wordForms.length;
    return sizeB - sizeA || a.value - b.value;
  });
  return result;
}
