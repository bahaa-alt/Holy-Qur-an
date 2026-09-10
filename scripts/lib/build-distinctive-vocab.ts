import type { DistinctiveRootRow, DistinctiveVocabFile, IndexRootRow, RootFile } from "../../src/lib/data/types";
import type { RawWord } from "./parse-morphology";

const MIN_LOCAL_COUNT = 3;
const TOP_N = 8;

/**
 * For every surah, ranks roots by how over-represented they are there
 * relative to their corpus-wide average rate: (local rate within this
 * surah) ÷ (global rate across the whole Qur'an). A ratio of 3 means the
 * root is 3x as common in this surah's own vocabulary as in the Qur'an
 * overall -- a much more informative "what's distinctive about this
 * surah's word choice" signal than raw frequency, which just re-surfaces
 * whatever's common everywhere (اللّٰه, قال, etc.).
 *
 * Requires at least MIN_LOCAL_COUNT occurrences within the surah to
 * qualify, so a root appearing once in a short surah (trivially "3x the
 * average" by sheer luck of small numbers) doesn't crowd out genuinely
 * repeated, characteristic vocabulary.
 */
export function buildDistinctiveVocab(
  words: readonly RawWord[],
  rootFiles: ReadonlyMap<string, RootFile>,
  indexRoots: readonly IndexRootRow[],
  totalSurahs: number,
): DistinctiveVocabFile {
  const totalWords = words.length;

  const wordsPerSurah = new Map<number, number>();
  for (const word of words) {
    wordsPerSurah.set(word.s, (wordsPerSurah.get(word.s) ?? 0) + 1);
  }

  const bySurah: DistinctiveRootRow[][] = Array.from({ length: totalSurahs }, () => []);

  for (const row of indexRoots) {
    const file = rootFiles.get(row.ar);
    if (!file) continue;
    const globalRate = row.count / totalWords;

    const localCounts = new Map<number, number>();
    for (const [s] of file.occ) {
      localCounts.set(s, (localCounts.get(s) ?? 0) + 1);
    }

    for (const [s, localCount] of localCounts) {
      if (localCount < MIN_LOCAL_COUNT) continue;
      const surahWordCount = wordsPerSurah.get(s) ?? 0;
      if (surahWordCount === 0) continue;
      const localRate = localCount / surahWordCount;
      const ratio = localRate / globalRate;
      bySurah[s - 1].push({ ar: row.ar, glossShort: row.glossShort, localCount, ratio });
    }
  }

  for (const rows of bySurah) {
    rows.sort((a, b) => b.ratio - a.ratio || b.localCount - a.localCount || a.ar.localeCompare(b.ar));
    rows.splice(TOP_N);
  }

  return { bySurah };
}
