import { nextInt, pickDistinctIndices, shuffle } from "./rng";
import type { SurahFile } from "@/lib/data/types";

export interface FillBlankRound {
  s: number;
  a: number;
  /** verse tokens, with the token at `blankIndex` already removed from display -- render it as the blank */
  tokens: string[];
  /** 0-based index into `tokens` that was blanked */
  blankIndex: number;
  /** shuffled candidate words, one of which is the correct token */
  choices: string[];
  answerIndex: number;
}

const MIN_TOKENS = 6;

/**
 * Builds a "which word completes this verse?" round from one already-fetched
 * surah file: picks a verse with enough tokens to leave real context on both
 * sides of the blank, then samples distractor words from *other* verses in
 * the same surah (already in memory, no extra fetches). Returns null if the
 * surah has no verse long enough to build a fair round -- the caller (a
 * client component) retries with a different surah number.
 */
export function buildFillBlankRound(surah: SurahFile, seed: number): FillBlankRound | null {
  const eligible = surah.verses.filter((v) => v.w.length >= MIN_TOKENS);
  if (eligible.length === 0) return null;

  const { indices: verseIdx, nextSeed: s1 } = pickDistinctIndices(eligible.length, 1, seed);
  const verse = eligible[verseIdx[0]];

  // Keep at least one token of context on either side of the blank.
  const { value: blankIndex, nextSeed: s2 } = nextInt(s1, verse.w.length - 2);
  const blankPos = blankIndex + 1;
  const answer = verse.w[blankPos];

  const distractorPool = [
    ...new Set(
      surah.verses
        .filter((v) => v.a !== verse.a)
        .flatMap((v) => v.w)
        .filter((token) => token !== answer),
    ),
  ];
  const { indices: poolIdx, nextSeed: s3 } = pickDistinctIndices(
    distractorPool.length,
    Math.min(3, distractorPool.length),
    s2,
  );
  const distractors = poolIdx.map((i) => distractorPool[i]);

  const { items: choices } = shuffle([answer, ...distractors], s3);
  const answerIndex = choices.indexOf(answer);

  return { s: surah.n, a: verse.a, tokens: verse.w, blankIndex: blankPos, choices, answerIndex };
}
