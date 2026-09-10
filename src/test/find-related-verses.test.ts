import { describe, expect, it } from "vitest";
import { findRelatedVerses } from "@/lib/related/findRelatedVerses";

// root 0's verses: 10, 20, 100 (target)
// root 1's verses: 20, 30, 100 (target)
const VERSE_SETS = new Map<number, ReadonlySet<number>>([
  [0, new Set([10, 20, 100])],
  [1, new Set([20, 30, 100])],
]);

describe("findRelatedVerses", () => {
  it("requires sharing at least 2 roots when the target has 2+ roots", () => {
    const result = findRelatedVerses(100, [0, 1], VERSE_SETS);
    expect(result).toEqual([{ globalId: 20, sharedRoots: 2 }]);
  });

  it("excludes verses sharing only one of the target's several roots", () => {
    const result = findRelatedVerses(100, [0, 1], VERSE_SETS);
    expect(result.some((r) => r.globalId === 10)).toBe(false);
    expect(result.some((r) => r.globalId === 30)).toBe(false);
  });

  it("drops the threshold to 1 when the target has only one root", () => {
    const result = findRelatedVerses(100, [0], VERSE_SETS);
    expect(result.map((r) => r.globalId).sort()).toEqual([10, 20]);
  });

  it("never includes the target verse itself", () => {
    const result = findRelatedVerses(100, [0, 1], VERSE_SETS);
    expect(result.some((r) => r.globalId === 100)).toBe(false);
  });

  it("sorts by shared-root count desc, then globalId asc, and respects limit", () => {
    const bigSets = new Map<number, ReadonlySet<number>>([
      [0, new Set([1, 2, 3, 100])],
      [1, new Set([1, 2, 100])],
      [2, new Set([2, 100])],
    ]);
    // verse 2 shares all 3 roots, verse 1 shares 2, verse 3 shares 1 (below threshold 2 for a 3-root target)
    const result = findRelatedVerses(100, [0, 1, 2], bigSets);
    expect(result).toEqual([
      { globalId: 2, sharedRoots: 3 },
      { globalId: 1, sharedRoots: 2 },
    ]);

    const limited = findRelatedVerses(100, [0, 1, 2], bigSets, 1);
    expect(limited).toEqual([{ globalId: 2, sharedRoots: 3 }]);
  });

  it("returns an empty array when the target has no rooted words", () => {
    expect(findRelatedVerses(100, [], VERSE_SETS)).toEqual([]);
  });
});
