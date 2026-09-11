import { abjadValueOf } from "../../src/lib/arabic/abjad";
import { stripDiacritics } from "../../src/lib/arabic/normalize";
import { hizbForVerse, HIZB_COUNT } from "../../src/lib/quran/hizb";
import { juzForVerse, JUZ_COUNT } from "../../src/lib/quran/juz";
import type { AbjadTotalsFile } from "../../src/lib/data/types";
import type { RawWord } from "./parse-morphology";

/** Word forms sharing a single, very common value (short, high-frequency
 *  particles cluster heavily) are capped at this many per value -- see
 *  {@link groupSharedValues}. */
export const MAX_FORMS_PER_ABJAD_VALUE = 4;

/**
 * Groups word-value entries by their Abjad value, drops any group with
 * only one member (nothing to be "common" with), and caps a surviving
 * group at `maxPerValue` entries so a handful of huge clusters of common
 * short words (a single value can be shared by 50+ distinct forms) can't
 * dominate the payload -- kept entries are the group's most-frequent forms
 * first, a deterministic tie-break by form so the output is stable across
 * builds. Small groups (the more remarkable coincidences -- a value shared
 * by only 2 or 3 words) are entirely unaffected by the cap.
 */
export function groupSharedValues<T extends { value: number; count: number; form: string }>(
  entries: readonly T[],
  maxPerValue: number,
): T[] {
  const byValue = new Map<number, T[]>();
  for (const entry of entries) {
    const group = byValue.get(entry.value);
    if (group) group.push(entry);
    else byValue.set(entry.value, [entry]);
  }

  const result: T[] = [];
  for (const group of byValue.values()) {
    if (group.length < 2) continue;
    const kept = [...group]
      .sort((a, b) => b.count - a.count || (a.form < b.form ? -1 : a.form > b.form ? 1 : 0))
      .slice(0, maxPerValue);
    result.push(...kept);
  }
  result.sort((a, b) => a.value - b.value || (a.form < b.form ? -1 : a.form > b.form ? 1 : 0));
  return result;
}

/**
 * Sums each word's classical Abjad value (see src/lib/arabic/abjad.ts)
 * into running totals per surah, per Hizb, per Juz', per verse, and for
 * the whole Qur'an -- computed once here since summing 77,429 words
 * client-side to answer "what's the book's total value" would mean
 * fetching every surah file just for one number. `byVerse` (indexed by
 * the same stable global verse id as en-index.json's postings -- see
 * src/lib/data/verseId.ts) is what a value -> verse reverse lookup is
 * built from client-side, without shipping every surah file just to scan
 * their text.
 */
export function buildAbjad(
  words: readonly RawWord[],
  totalSurahs: number,
  globalIdOf: ReadonlyMap<string, number>,
): AbjadTotalsFile {
  const bySurah = new Array<number>(totalSurahs).fill(0);
  const byHizb = new Array<number>(HIZB_COUNT).fill(0);
  const byJuz = new Array<number>(JUZ_COUNT).fill(0);
  const byVerse = new Array<number>(globalIdOf.size).fill(0);
  let bookTotal = 0;
  const wordCounts = new Map<string, number>();

  for (const word of words) {
    const value = abjadValueOf(word.text);
    bookTotal += value;
    bySurah[word.s - 1] += value;
    byHizb[hizbForVerse(word.s, word.a) - 1] += value;
    byJuz[juzForVerse(word.s, word.a) - 1] += value;
    const globalId = globalIdOf.get(`${word.s}:${word.a}`);
    if (globalId !== undefined) byVerse[globalId] += value;
    // Keyed by the diacritics-stripped skeleton, not the exact diacritized
    // text: abjadValueOf() itself ignores diacritics (see abjad.ts), so
    // different tashkeel of the same word are already the same value --
    // keying on the exact text would just multiply entries for no benefit,
    // splitting one word's occurrences across several near-duplicate rows.
    const skeleton = stripDiacritics(word.text);
    wordCounts.set(skeleton, (wordCounts.get(skeleton) ?? 0) + 1);
  }

  const byWordAll = [...wordCounts.entries()].map(([form, count]) => ({ form, value: abjadValueOf(form), count }));
  const byWord = groupSharedValues(byWordAll, MAX_FORMS_PER_ABJAD_VALUE);

  return { bookTotal, bySurah, byHizb, byJuz, byVerse, byWord };
}
