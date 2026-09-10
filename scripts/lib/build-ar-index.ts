import { normalizeForPhraseSearch } from "../../src/lib/arabic/normalize";
import type { ArIndexFile } from "../../src/lib/data/types";

export interface ArIndexableVerse {
  /** stable global verse id, 0-based, in Quran order */
  globalId: number;
  /** the verse's whitespace-split Uthmani tokens, in word order */
  tokens: readonly string[];
}

/**
 * Builds the per-verse normalized-token index used for literal Arabic
 * phrase/sentence search (contiguous multi-word matching, e.g.
 * "يا أيها الناس"). Unlike verse-roots.json, which only carries rooted
 * segments, this indexes every token verbatim -- particles, pronouns,
 * everything -- since phrase search must match the exact running text a
 * user types, not just root tags. Each token is run through
 * `normalizeForPhraseSearch()` (not the plain `normalize()` used for
 * root/lemma/form keys), so a query typed with a common alternate spelling
 * (a dagger alif spelled as a full alif, a hamza written as ء vs. آ vs.
 * plain ا) still matches this index -- see that function's doc comment.
 */
export function buildArIndex(verses: readonly ArIndexableVerse[]): ArIndexFile {
  const result: ArIndexFile = Array.from({ length: verses.length }, () => []);
  for (const { globalId, tokens } of verses) {
    result[globalId] = tokens.map((t) => normalizeForPhraseSearch(t));
  }
  return result;
}
