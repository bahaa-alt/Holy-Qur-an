import { pickDistinctIndices, shuffle } from "./rng";
import type { IndexLemmaRow, IndexRootRow } from "@/lib/data/types";

export interface LemmaRootRound {
  lemma: IndexLemmaRow;
  /** shuffled candidate roots, one of which is the lemma's own */
  choices: IndexRootRow[];
  /** index into `choices` of the correct answer */
  answerIndex: number;
}

/**
 * Builds a "which root does this word come from?" multiple-choice round.
 * Only rooted lemmas are eligible (a rootless particle has no root to
 * guess); returns null if there aren't enough distinct roots in the corpus
 * to build a round with the requested number of choices (never happens in
 * practice with the real corpus's 1,600+ roots, but keeps this honest for
 * a hand-built test fixture).
 */
export function buildLemmaRootRound(
  lemmas: readonly IndexLemmaRow[],
  roots: readonly IndexRootRow[],
  seed: number,
  choiceCount = 4,
): LemmaRootRound | null {
  const rootedLemmas = lemmas.filter((l) => l.rootIdx >= 0 && l.rootIdx < roots.length);
  if (rootedLemmas.length === 0 || roots.length < choiceCount) return null;

  const { indices: lemmaIdx, nextSeed: s1 } = pickDistinctIndices(rootedLemmas.length, 1, seed);
  const lemma = rootedLemmas[lemmaIdx[0]];
  const correctRootIdx = lemma.rootIdx;

  const distractorPool = roots.map((_, i) => i).filter((i) => i !== correctRootIdx);
  const { indices: poolIdx, nextSeed: s2 } = pickDistinctIndices(
    distractorPool.length,
    Math.min(choiceCount - 1, distractorPool.length),
    s1,
  );
  const distractorRootIdx = poolIdx.map((i) => distractorPool[i]);

  const rawChoices = [roots[correctRootIdx], ...distractorRootIdx.map((i) => roots[i])];
  const { items: choices } = shuffle(rawChoices, s2);
  const answerIndex = choices.indexOf(roots[correctRootIdx]);
  return { lemma, choices, answerIndex };
}
