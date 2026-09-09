import { tokenizeEnglish } from "../../src/lib/search/stem";
import type { EnIndexFile } from "../../src/lib/data/types";

export interface IndexableVerse {
  /** stable global verse id, 0-based, in Quran order */
  globalId: number;
  translation: string;
}

/**
 * Builds a prebuilt inverted index over verse translations: for each stemmed
 * term, the sorted list of distinct global verse ids whose translation
 * contains it. Term frequency within a verse is not tracked (a term either
 * matches a verse or doesn't); ranking at query time uses the number of
 * matched query terms, not raw tf.
 */
export function buildEnIndex(verses: readonly IndexableVerse[]): EnIndexFile {
  const postingsByTerm = new Map<string, Set<number>>();

  for (const { globalId, translation } of verses) {
    const terms = new Set(tokenizeEnglish(translation));
    for (const term of terms) {
      let set = postingsByTerm.get(term);
      if (!set) {
        set = new Set();
        postingsByTerm.set(term, set);
      }
      set.add(globalId);
    }
  }

  const terms = [...postingsByTerm.keys()].sort();
  const postings = terms.map((term) => [...postingsByTerm.get(term)!].sort((a, b) => a - b));

  return { terms, postings };
}
