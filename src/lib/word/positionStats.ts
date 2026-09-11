/** How often a word's occurrences fall at the start, end, or middle of
 *  their verse, plus the full position-within-verse breakdown. */
export interface WordPositionStats {
  startCount: number;
  endCount: number;
  middleCount: number;
  total: number;
  /** 1-based word position -> occurrence count, sorted by position ascending */
  positions: { position: number; count: number }[];
}

/**
 * Classifies every occurrence of a word (lemma) by where it falls in its
 * verse. A verse's own word count is supplied via `verseWordCount` (a
 * lookup, not a fixed field on the occurrence) since that's the one piece
 * of information a bare (s, a, w) triple doesn't carry -- callers
 * typically build it from already-fetched SurahFile.verses[].w.length.
 *
 * A single-word verse's only word is counted as the start, not the end --
 * an arbitrary but documented tie-break, since it's unambiguously not
 * "within" the verse either way.
 */
export function buildWordPositionStats(
  occurrences: readonly { s: number; a: number; w: number }[],
  verseWordCount: (s: number, a: number) => number | undefined,
): WordPositionStats {
  let startCount = 0;
  let endCount = 0;
  let middleCount = 0;
  const positionCounts = new Map<number, number>();

  for (const occ of occurrences) {
    const total = verseWordCount(occ.s, occ.a);
    if (total === undefined) continue;

    if (occ.w === 1) startCount++;
    else if (occ.w === total) endCount++;
    else middleCount++;

    positionCounts.set(occ.w, (positionCounts.get(occ.w) ?? 0) + 1);
  }

  const positions = [...positionCounts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([position, count]) => ({ position, count }));

  return { startCount, endCount, middleCount, total: occurrences.length, positions };
}
