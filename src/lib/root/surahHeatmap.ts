import type { RootFile } from "@/lib/data/types";

/**
 * Tallies a root/lemma's occurrences (file.occ) into a fixed 114-length
 * array indexed by surah number - 1, so it can be rendered as a compact
 * strip covering every surah (including the ones with zero occurrences,
 * unlike buildSurahDistribution's sparse bySurah list) -- a quick "where
 * in the Mushaf does this concentrate" shape, distinct from that list's
 * exact per-surah counts.
 */
export function buildSurahOccurrenceCounts(file: RootFile): number[] {
  const counts = new Array(114).fill(0);
  for (const [s] of file.occ) {
    counts[s - 1]++;
  }
  return counts;
}
