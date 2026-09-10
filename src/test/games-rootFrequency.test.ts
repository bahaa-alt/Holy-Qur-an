import { describe, expect, it } from "vitest";
import { buildRootFrequencyRound } from "@/lib/games/rootFrequency";
import type { IndexRootRow } from "@/lib/data/types";

function makeRoot(ar: string, count: number): IndexRootRow {
  return { ar, key: ar, bw: ar, count, lemmaCount: 1, verseCount: 1, glossShort: `gloss of ${ar}` };
}

describe("buildRootFrequencyRound", () => {
  const roots = [makeRoot("أ", 100), makeRoot("ب", 50), makeRoot("ت", 50), makeRoot("ث", 10)];

  it("picks two distinct roots with different counts", () => {
    const round = buildRootFrequencyRound(roots, 1);
    expect(round.a.ar).not.toBe(round.b.ar);
    expect(round.a.count).not.toBe(round.b.count);
  });

  it("sets higherIsA correctly", () => {
    const round = buildRootFrequencyRound(roots, 1);
    expect(round.higherIsA).toBe(round.a.count > round.b.count);
  });

  it("is deterministic for a given seed", () => {
    const r1 = buildRootFrequencyRound(roots, 42);
    const r2 = buildRootFrequencyRound(roots, 42);
    expect(r1).toEqual(r2);
  });
});
