export interface RelatedVerse {
  globalId: number;
  sharedRoots: number;
}

/**
 * Ranks verses that share roots with the target verse. Requires at least
 * `min(2, targetRootIdxs.length)` shared roots -- a single shared root is
 * usually too common a coincidence to be interesting on its own (unless the
 * target verse has only one rooted word to begin with, in which case
 * sharing that one root is the whole signal available).
 */
export function findRelatedVerses(
  targetGlobalId: number,
  targetRootIdxs: readonly number[],
  verseSetsByRoot: ReadonlyMap<number, ReadonlySet<number>>,
  limit = 8,
): RelatedVerse[] {
  const threshold = Math.min(2, targetRootIdxs.length);
  const tally = new Map<number, number>();

  for (const rootIdx of targetRootIdxs) {
    const verses = verseSetsByRoot.get(rootIdx);
    if (!verses) continue;
    for (const globalId of verses) {
      if (globalId === targetGlobalId) continue;
      tally.set(globalId, (tally.get(globalId) ?? 0) + 1);
    }
  }

  return [...tally.entries()]
    .filter(([, count]) => count >= threshold)
    .map(([globalId, sharedRoots]) => ({ globalId, sharedRoots }))
    .sort((a, b) => b.sharedRoots - a.sharedRoots || a.globalId - b.globalId)
    .slice(0, limit);
}
