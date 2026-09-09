export interface KwicLine {
  before: string;
  match: string;
  after: string;
  truncatedBefore: boolean;
  truncatedAfter: boolean;
}

/**
 * Builds a Keyword-In-Context line: the matched token plus up to
 * `contextWords` tokens on either side, joined with spaces. `wordIndex` is
 * 1-based, matching an Occurrence's `w` and OccRow's `w`.
 */
export function buildKwicLine(tokens: readonly string[], wordIndex: number, contextWords = 6): KwicLine {
  const i = wordIndex - 1;
  const beforeStart = Math.max(0, i - contextWords);
  const afterEnd = Math.min(tokens.length, i + 1 + contextWords);

  return {
    before: tokens.slice(beforeStart, i).join(" "),
    match: tokens[i] ?? "",
    after: tokens.slice(i + 1, afterEnd).join(" "),
    truncatedBefore: beforeStart > 0,
    truncatedAfter: afterEnd < tokens.length,
  };
}
