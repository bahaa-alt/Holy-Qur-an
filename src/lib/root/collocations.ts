import type { IndexFile, MetaFile, RootFile, VerseRootsFile } from "@/lib/data/types";
import { refToGlobalId } from "@/lib/data/verseId";

export interface Collocation {
  rootIdx: number;
  /** number of distinct verses (containing the current root) that also contain this root */
  count: number;
  /** pointwise mutual information: log2( P(both) / (P(this root) * P(other root)) ),
   *  estimated from verse-level probabilities over the whole corpus */
  pmi: number;
}

/**
 * Ranks the roots that most closely associate with `file`'s root, using
 * pointwise mutual information (PMI) rather than a raw co-occurrence count.
 * A raw count alone is dominated by whichever roots are simply the most
 * frequent in the whole corpus (أله, قول, كون...), regardless of whether
 * they say anything distinctive about *this* root; PMI instead asks "how
 * much more often do these two share a verse than their individual
 * frequencies alone would predict" -- surfacing genuinely distinctive
 * pairings over merely-common ones. Pairs below `minCount` are dropped
 * (a single shared verse produces an unreliably extreme PMI).
 */
export function buildCollocations(
  file: RootFile,
  currentRootIdx: number,
  verseRoots: VerseRootsFile,
  meta: MetaFile,
  index: IndexFile,
  limit = 12,
  minCount = 2,
): Collocation[] {
  const tally = new Map<number, number>();
  const seenVerses = new Set<number>();

  for (const [s, a] of file.occ) {
    const globalId = refToGlobalId(meta, s, a);
    if (globalId === null || seenVerses.has(globalId)) continue;
    seenVerses.add(globalId);

    const rootsInVerse = new Set((verseRoots[globalId] ?? []).map(([rootIdx]) => rootIdx));
    for (const rootIdx of rootsInVerse) {
      if (rootIdx === currentRootIdx) continue;
      tally.set(rootIdx, (tally.get(rootIdx) ?? 0) + 1);
    }
  }

  const totalVerses = verseRoots.length;
  const verseCountA = seenVerses.size;

  return [...tally.entries()]
    .filter(([, count]) => count >= minCount)
    .map(([rootIdx, count]) => {
      const verseCountB = index.roots[rootIdx]?.verseCount ?? 0;
      const pmi =
        verseCountA > 0 && verseCountB > 0 ? Math.log2((count * totalVerses) / (verseCountA * verseCountB)) : 0;
      return { rootIdx, count, pmi };
    })
    .sort((a, b) => b.pmi - a.pmi || b.count - a.count || a.rootIdx - b.rootIdx)
    .slice(0, limit);
}
