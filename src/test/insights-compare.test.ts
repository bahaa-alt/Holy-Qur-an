import { describe, expect, it } from "vitest";
import { compareScope, corpusDispersion, perSurahCounts } from "@/lib/insights/compare";
import type { VerseRef } from "@/lib/insights/scope";
import type { VerseRootsFile } from "@/lib/data/types";

/**
 * Hermetic: a four-verse toy corpus, so the arithmetic can be checked by
 * hand. What the engine returns over the REAL corpus is a claim about the
 * Qur'an and is asserted in scripts/build-data.ts instead -- a unit test
 * that read public/data/v1 would not run on a fresh clone.
 *
 * Roots 0,1,2. Surah 1 (verses 0-1), surah 2 (verses 2-3).
 */
const verseRoots: VerseRootsFile = [
  [
    [0, 1],
    [0, 2],
    [1, 3],
  ], // 1:1 -- root0 ×2, root1
  [
    [0, 1],
    [2, 2],
  ], // 1:2 -- root0, root2
  [
    [1, 1],
    [1, 2],
    [1, 3],
    [1, 4],
  ], // 2:1 -- root1 ×4
  [
    [1, 1],
    [2, 2],
  ], // 2:2 -- root1, root2
];
const refs: VerseRef[] = [
  { s: 1, a: 1 },
  { s: 1, a: 2 },
  { s: 2, a: 1 },
  { s: 2, a: 2 },
];

describe("compareScope", () => {
  it("counts inside and outside the scope, in rooted occurrences", () => {
    const r = compareScope(verseRoots, refs, { kind: "surah", n: 1 }, 3, 1);
    expect(r.scopeTokens).toBe(5); // 3 + 2
    expect(r.referenceTokens).toBe(6); // 4 + 2
    expect(r.scopeVerses).toBe(2);
    expect(r.tested).toBe(3);
    const byRoot = new Map(r.rows.map((row) => [row.rootIdx, row]));
    expect(byRoot.get(0)).toMatchObject({ count: 3, referenceCount: 0 });
    expect(byRoot.get(1)).toMatchObject({ count: 1, referenceCount: 5 });
    expect(byRoot.get(2)).toMatchObject({ count: 1, referenceCount: 1 });
  });

  it("scores over-use and under-use in the right direction", () => {
    const r = compareScope(verseRoots, refs, { kind: "surah", n: 1 }, 3, 1);
    const byRoot = new Map(r.rows.map((row) => [row.rootIdx, row]));
    // root0: 3/5 here, 0/6 elsewhere.
    expect(byRoot.get(0)!.keyness.overused).toBe(true);
    expect(byRoot.get(0)!.keyness.logRatioEstimated).toBe(true); // floored zero
    // root1: 1/5 here, 5/6 elsewhere.
    expect(byRoot.get(1)!.keyness.overused).toBe(false);
    // root2: 1/5 vs 1/6 -- barely anything.
    expect(byRoot.get(2)!.keyness.g2).toBeLessThan(1);
  });

  it("ranks by G², which is the whole point of the table", () => {
    const r = compareScope(verseRoots, refs, { kind: "surah", n: 1 }, 3, 1);
    const g2s = r.rows.map((row) => row.keyness.g2);
    expect([...g2s].sort((a, b) => b - a)).toEqual(g2s);
  });

  it("applies the minimum-count floor to the scope, not the reference", () => {
    const r = compareScope(verseRoots, refs, { kind: "surah", n: 1 }, 3, 2);
    expect(r.rows.map((row) => row.rootIdx)).toEqual([0]);
    // The floor hides rows; it must not change the denominators or the
    // number of tests the correction is computed from.
    expect(r.scopeTokens).toBe(5);
    expect(r.tested).toBe(3);
  });

  it("gives an empty scope no rows rather than dividing by zero", () => {
    const r = compareScope(verseRoots, refs, { kind: "surah", n: 99 }, 3, 1);
    expect(r.rows).toEqual([]);
    expect(r.scopeTokens).toBe(0);
    expect(r.referenceTokens).toBe(11);
  });

  it("puts everything in scope, and nothing in the reference, for the whole Qur'an", () => {
    const r = compareScope(verseRoots, refs, { kind: "quran" }, 3, 1);
    expect(r.scopeTokens).toBe(11);
    expect(r.referenceTokens).toBe(0);
    // With no reference there is nothing to compare against: every G² is 0,
    // which is why the UI shows dispersion instead of keyness at this scope.
    expect(r.rows.every((row) => row.keyness.g2 === 0)).toBe(true);
  });
});

describe("corpusDispersion", () => {
  it("measures spread across surahs, weighted by how much text each holds", () => {
    const rows = corpusDispersion(verseRoots, refs, 3, 2);
    const byRoot = new Map(rows.map((r) => [r.rootIdx, r.dispersion]));
    // Surah sizes: 5 and 6 rooted occurrences.
    // root2 is 1 and 1: proportions .5/.5 against expected 5/11 and 6/11.
    expect(byRoot.get(2)!.dp).toBeCloseTo(Math.abs(0.5 - 5 / 11), 12);
    expect(byRoot.get(2)!.range).toBe(2);
    // root0 sits entirely in surah 1 -- the ceiling for that part.
    expect(byRoot.get(0)!.dp).toBeCloseTo(1 - 5 / 11, 12);
    expect(byRoot.get(0)!.range).toBe(1);
    expect(byRoot.get(0)!.total).toBe(3);
  });

  it("leaves out roots that never occur", () => {
    const rows = corpusDispersion(verseRoots, refs, 5, 2);
    expect(rows.map((r) => r.rootIdx)).toEqual([0, 1, 2]);
  });
});

describe("perSurahCounts", () => {
  it("matches corpusDispersion's own per-surah counts and sizes for the same root", () => {
    // root0 sits entirely in surah 1 (index 0): 3 occurrences, per the
    // compareScope test above. Sizes are the same 5/6 rooted-occurrence
    // totals corpusDispersion computed for its dp assertions.
    const { counts, sizes } = perSurahCounts(verseRoots, refs, 0, 2);
    expect(counts).toEqual([3, 0]);
    expect(sizes).toEqual([5, 6]);
  });

  it("counts a different root correctly from the same pass", () => {
    // root2: one occurrence in each surah.
    const { counts } = perSurahCounts(verseRoots, refs, 2, 2);
    expect(counts).toEqual([1, 1]);
  });

  it("returns all zeros for a root that never occurs", () => {
    const { counts, sizes } = perSurahCounts(verseRoots, refs, 99, 2);
    expect(counts).toEqual([0, 0]);
    expect(sizes).toEqual([5, 6]);
  });
});
