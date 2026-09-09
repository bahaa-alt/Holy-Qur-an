/**
 * Token-index based verse highlighting.
 *
 * Occurrences are recorded as a 1-based word index into a verse's token
 * array (see `RootFile.occ` / `Occurrence` in src/lib/data/types.ts), never
 * by string matching. This works uniformly for both canonical (quran-json)
 * and morphology-fallback verses, since both are whitespace-tokenized the
 * same way and the word index is assigned during the same build pass.
 */

export type HighlightLevel = "none" | "highlight" | "emphasis";

export interface HighlightedToken {
  text: string;
  level: HighlightLevel;
}

/**
 * Builds a per-token highlight plan for a verse.
 *
 * @param tokens the verse's whitespace-split Uthmani tokens (1-based in the
 *   data model, 0-based here as a plain array)
 * @param highlightIndices 1-based word indices to mark as "highlight"
 *   (e.g. every occurrence of the root in this verse)
 * @param emphasisIndex optional 1-based word index to mark as "emphasis"
 *   instead (e.g. the specific form the user clicked through from);
 *   overrides "highlight" for that index
 */
export function buildHighlightedVerse(
  tokens: readonly string[],
  highlightIndices: Iterable<number>,
  emphasisIndex?: number,
): HighlightedToken[] {
  const highlighted = new Set<number>();
  for (const idx of highlightIndices) {
    if (Number.isInteger(idx) && idx >= 1 && idx <= tokens.length) {
      highlighted.add(idx);
    }
  }

  return tokens.map((text, i) => {
    const wordIndex = i + 1; // convert to 1-based
    const level: HighlightLevel =
      wordIndex === emphasisIndex ? "emphasis" : highlighted.has(wordIndex) ? "highlight" : "none";
    return { text, level };
  });
}

/** Convenience: highlight (and emphasize) a single word index. */
export function highlightSingle(tokens: readonly string[], wordIndex: number): HighlightedToken[] {
  return buildHighlightedVerse(tokens, [wordIndex], wordIndex);
}
