import { abjadValueOf } from "../../src/lib/arabic/abjad";
import { hizbForVerse, HIZB_COUNT } from "../../src/lib/quran/hizb";
import { juzForVerse, JUZ_COUNT } from "../../src/lib/quran/juz";
import type { AbjadTotalsFile } from "../../src/lib/data/types";
import type { RawWord } from "./parse-morphology";

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

  for (const word of words) {
    const value = abjadValueOf(word.text);
    bookTotal += value;
    bySurah[word.s - 1] += value;
    byHizb[hizbForVerse(word.s, word.a) - 1] += value;
    byJuz[juzForVerse(word.s, word.a) - 1] += value;
    const globalId = globalIdOf.get(`${word.s}:${word.a}`);
    if (globalId !== undefined) byVerse[globalId] += value;
  }

  return { bookTotal, bySurah, byHizb, byJuz, byVerse };
}
