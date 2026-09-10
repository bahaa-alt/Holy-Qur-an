import { describe, expect, it } from "vitest";
import { buildRootMeaningRound } from "@/lib/games/rootMeaning";
import type { IndexRootRow } from "@/lib/data/types";

function makeRoot(ar: string): IndexRootRow {
  return { ar, key: ar, bw: ar, count: 1, lemmaCount: 1, verseCount: 1, glossShort: `gloss of ${ar}` };
}

describe("buildRootMeaningRound", () => {
  const roots = [makeRoot("أ"), makeRoot("ب"), makeRoot("ت"), makeRoot("ث"), makeRoot("ج")];

  it("includes the target's own gloss among the choices, at answerIndex", () => {
    const round = buildRootMeaningRound(roots, 7);
    expect(round.choices).toHaveLength(4);
    expect(round.choices[round.answerIndex]).toBe(round.target.glossShort);
  });

  it("choices are unique (no duplicate distractor picked twice)", () => {
    const round = buildRootMeaningRound(roots, 7);
    expect(new Set(round.choices).size).toBe(round.choices.length);
  });

  it("shrinks choiceCount to the available root count", () => {
    const round = buildRootMeaningRound(roots.slice(0, 2), 1, 4);
    expect(round.choices).toHaveLength(2);
  });

  it("is deterministic for a given seed", () => {
    const r1 = buildRootMeaningRound(roots, 99);
    const r2 = buildRootMeaningRound(roots, 99);
    expect(r1).toEqual(r2);
  });
});
