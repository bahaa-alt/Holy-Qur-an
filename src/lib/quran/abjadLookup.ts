import { globalIdToRef } from "@/lib/data/verseId";
import type { AbjadTotalsFile, MetaFile } from "@/lib/data/types";

export interface AbjadValueMatches {
  /** verses whose own total equals the target value, in Qur'an order */
  verses: { s: number; a: number }[];
  /** surah numbers whose whole-surah total equals the target value */
  surahs: number[];
}

/**
 * Reverse Abjad lookup: given a target numeral value, finds every verse
 * and every whole surah whose Abjad total equals it exactly -- the
 * classical chronogram tradition's own use case (a date or name's Abjad
 * value matched against a text), run here over the corpus rather than one
 * hand-picked phrase. Both `byVerse` and `bySurah` are already computed at
 * build time (see build-abjad.ts), so this is a plain O(n) scan, no data
 * fetch beyond the already-loaded AbjadTotalsFile.
 */
export function findByAbjadValue(abjad: AbjadTotalsFile, meta: MetaFile, value: number): AbjadValueMatches {
  const verses: { s: number; a: number }[] = [];
  for (let globalId = 0; globalId < abjad.byVerse.length; globalId++) {
    if (abjad.byVerse[globalId] === value) {
      const ref = globalIdToRef(meta, globalId);
      if (ref) verses.push(ref);
    }
  }

  const surahs: number[] = [];
  for (let i = 0; i < abjad.bySurah.length; i++) {
    if (abjad.bySurah[i] === value) surahs.push(i + 1);
  }

  return { verses, surahs };
}
