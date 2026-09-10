import type { MetaFile, RootFile, VerseRootsFile } from "@/lib/data/types";
import { refToGlobalId } from "@/lib/data/verseId";

export interface Collocation {
  rootIdx: number;
  /** number of distinct verses (containing the current root) that also contain this root */
  count: number;
}

/**
 * Ranks the roots that most frequently share a verse with `file`'s root.
 * Counts at the verse level (a co-occurring root appearing twice in one
 * verse still counts once for that verse, and a verse where the current
 * root itself repeats is only visited once), so this answers "how many of
 * this root's verses also contain root Y", not a raw segment tally.
 */
export function buildCollocations(
  file: RootFile,
  currentRootIdx: number,
  verseRoots: VerseRootsFile,
  meta: MetaFile,
  limit = 12,
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

  return [...tally.entries()]
    .map(([rootIdx, count]) => ({ rootIdx, count }))
    .sort((a, b) => b.count - a.count || a.rootIdx - b.rootIdx)
    .slice(0, limit);
}
