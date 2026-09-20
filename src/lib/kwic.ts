export interface KwicToken {
  /** 1-based word index in the verse, matching an Occurrence's `w` */
  w: number;
  text: string;
  /** the word the result is about */
  isMatch: boolean;
}

export interface KwicLine {
  tokens: KwicToken[];
  truncatedBefore: boolean;
  truncatedAfter: boolean;
}

/**
 * Builds a Keyword-In-Context line: the matched token plus up to
 * `contextWords` tokens on either side.
 *
 * Returns the tokens individually, with their word indices, rather than
 * three joined strings as it used to. Every word in a result list is now
 * tappable -- the inspector is the way from a result into the corpus, and
 * a list of results is where a researcher spends most of their time -- and
 * that needs each token to know which word of the verse it is.
 */
export function buildKwicLine(
  tokens: readonly string[],
  wordIndex: number,
  contextWords = 6,
): KwicLine {
  const i = wordIndex - 1;
  const beforeStart = Math.max(0, i - contextWords);
  const afterEnd = Math.min(tokens.length, i + 1 + contextWords);

  const out: KwicToken[] = [];
  for (let j = beforeStart; j < afterEnd; j++) {
    out.push({ w: j + 1, text: tokens[j], isMatch: j === i });
  }

  return {
    tokens: out,
    truncatedBefore: beforeStart > 0,
    truncatedAfter: afterEnd < tokens.length,
  };
}
