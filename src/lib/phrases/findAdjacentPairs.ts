import type { VerseRootsFile } from "@/lib/data/types";

export interface AdjacentMatch {
  globalId: number;
  leadW: number;
  followW: number;
}

/**
 * Finds every verse where a rooted occurrence of `leadRootIdx` is
 * immediately followed -- in the verse's own sequence of rooted words,
 * skipping non-rooted tokens like particles and pronouns -- by a rooted
 * occurrence of `followRootIdx`. This is a two-root phrase/formula search:
 * "does root A tend to be followed by root B", not raw token adjacency.
 * `leadRootIdx === followRootIdx` is valid (a root immediately repeating).
 * Results are in ascending (globalId, word position) order.
 */
export function findAdjacentRootPairs(
  verseRoots: VerseRootsFile,
  leadRootIdx: number,
  followRootIdx: number,
): AdjacentMatch[] {
  const matches: AdjacentMatch[] = [];

  for (let globalId = 0; globalId < verseRoots.length; globalId++) {
    const entries = verseRoots[globalId];
    for (let i = 0; i < entries.length - 1; i++) {
      const [rootA, wA] = entries[i];
      const [rootB, wB] = entries[i + 1];
      if (rootA === leadRootIdx && rootB === followRootIdx) {
        matches.push({ globalId, leadW: wA, followW: wB });
      }
    }
  }

  return matches;
}
