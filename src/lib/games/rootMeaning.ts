import { pickDistinctIndices, shuffle } from "./rng";
import type { IndexRootRow } from "@/lib/data/types";

export interface RootMeaningRound {
  target: IndexRootRow;
  /** shuffled candidate glosses, one of which is the target's own */
  choices: string[];
  /** index into `choices` of the correct answer */
  answerIndex: number;
}

/**
 * Builds a "which meaning belongs to this root?" multiple-choice round:
 * the target root's own glossShort plus 3 distractor glossShorts from
 * other roots, shuffled.
 */
export function buildRootMeaningRound(
  roots: readonly IndexRootRow[],
  seed: number,
  choiceCount = 4,
): RootMeaningRound {
  const pickCount = Math.min(choiceCount, roots.length);
  const { indices, nextSeed } = pickDistinctIndices(roots.length, pickCount, seed);
  const [targetIdx, ...distractorIdx] = indices;
  const target = roots[targetIdx];
  const rawChoices = [target.glossShort, ...distractorIdx.map((i) => roots[i].glossShort)];
  const { items: choices } = shuffle(rawChoices, nextSeed);
  const answerIndex = choices.indexOf(target.glossShort);
  return { target, choices, answerIndex };
}
