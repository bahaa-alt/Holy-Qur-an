import { pickDistinctIndices } from "./rng";
import type { IndexRootRow } from "@/lib/data/types";

export interface RootFrequencyRound {
  a: IndexRootRow;
  b: IndexRootRow;
  /** true if `a` occurs more often than `b` in the corpus */
  higherIsA: boolean;
}

/**
 * Builds a "which root occurs more often?" round: two distinct roots with
 * different counts (retried a bounded number of times to avoid a tie,
 * which would make the question unanswerable).
 */
export function buildRootFrequencyRound(roots: readonly IndexRootRow[], seed: number): RootFrequencyRound {
  let s = seed;
  const maxAttempts = 20;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { indices, nextSeed } = pickDistinctIndices(roots.length, 2, s);
    s = nextSeed;
    const [a, b] = [roots[indices[0]], roots[indices[1]]];
    if (a.count !== b.count) {
      return { a, b, higherIsA: a.count > b.count };
    }
  }
  // Corpus-wide, this practically never happens within 20 attempts, but if
  // every draw tied, fall back to the first two distinct roots.
  const a = roots[0];
  const b = roots.find((r) => r.count !== a.count) ?? roots[1];
  return { a, b, higherIsA: a.count > b.count };
}
