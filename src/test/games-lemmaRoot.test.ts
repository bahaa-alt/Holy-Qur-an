import { describe, expect, it } from "vitest";
import { buildLemmaRootRound } from "@/lib/games/lemmaRoot";
import type { IndexLemmaRow, IndexRootRow } from "@/lib/data/types";

function makeRoot(ar: string): IndexRootRow {
  return { ar, key: ar, bw: ar, count: 1, lemmaCount: 1, verseCount: 1, glossShort: `gloss of ${ar}` };
}

const roots = [makeRoot("أ"), makeRoot("ب"), makeRoot("ت"), makeRoot("ث"), makeRoot("ج")];
const lemmas: IndexLemmaRow[] = [
  { lemma: "كَتَبَ", key: "كتب", rootIdx: 2, count: 10, cat: "verb.perf" },
  { lemma: "وَ", key: "و", rootIdx: -1, count: 100, cat: "other" },
];

describe("buildLemmaRootRound", () => {
  it("only ever targets a rooted lemma", () => {
    const round = buildLemmaRootRound(lemmas, roots, 3)!;
    expect(round.lemma.rootIdx).toBeGreaterThanOrEqual(0);
  });

  it("includes the lemma's real root among the choices, at answerIndex", () => {
    const round = buildLemmaRootRound(lemmas, roots, 3)!;
    expect(round.choices[round.answerIndex].ar).toBe(roots[round.lemma.rootIdx].ar);
  });

  it("returns null when there are no rooted lemmas", () => {
    const rootless: IndexLemmaRow[] = [{ lemma: "وَ", key: "و", rootIdx: -1, count: 1, cat: "other" }];
    expect(buildLemmaRootRound(rootless, roots, 1)).toBeNull();
  });

  it("returns null when there aren't enough roots for the requested choice count", () => {
    expect(buildLemmaRootRound(lemmas, roots.slice(0, 2), 1, 4)).toBeNull();
  });

  it("is deterministic for a given seed", () => {
    const r1 = buildLemmaRootRound(lemmas, roots, 11);
    const r2 = buildLemmaRootRound(lemmas, roots, 11);
    expect(r1).toEqual(r2);
  });
});
