import { describe, expect, it } from "vitest";
import { scopedCooccurrencePartners, scopedTopPairs } from "@/lib/insights/cooccurrenceScope";
import type { VerseRef } from "@/lib/insights/scope";
import type { VerseRootsFile } from "@/lib/data/types";

/**
 * Hermetic: the same four-verse toy corpus insights-compare.test.ts uses,
 * so the two engines can be reasoned about side by side. Roots 0,1,2;
 * surah 1 (verses 0-1), surah 2 (verses 2-3).
 */
const rootNames = ["r0", "r1", "r2"];
const verseRoots: VerseRootsFile = [
  [
    [0, 1],
    [0, 2],
    [1, 3],
  ], // 1:1 -- root0 x2, root1 (distinct roots here: {0,1})
  [
    [0, 1],
    [2, 2],
  ], // 1:2 -- root0, root2 ({0,2})
  [
    [1, 1],
    [1, 2],
    [1, 3],
    [1, 4],
  ], // 2:1 -- root1 x4 ({1})
  [
    [1, 1],
    [2, 2],
  ], // 2:2 -- root1, root2 ({1,2})
];
const refs: VerseRef[] = [
  { s: 1, a: 1 },
  { s: 1, a: 2 },
  { s: 2, a: 1 },
  { s: 2, a: 2 },
];

describe("scopedCooccurrencePartners", () => {
  it("counts distinct shared verses, not occurrences", () => {
    // root0 co-occurs with root1 in 1:1 (once, despite root0 appearing
    // twice there) and with root2 in 1:2.
    const partners = scopedCooccurrencePartners(verseRoots, refs, { kind: "quran" }, 0, rootNames);
    expect(partners).toEqual([
      { root: "r1", count: 1 },
      { root: "r2", count: 1 },
    ]);
  });

  it("restricts to verses inside the chosen scope", () => {
    // root1 co-occurs with root0 in 1:1 and with root2 in 2:2 -- but
    // surah 1 only sees the first.
    const partners = scopedCooccurrencePartners(
      verseRoots,
      refs,
      { kind: "surah", n: 1 },
      1,
      rootNames,
    );
    expect(partners).toEqual([{ root: "r0", count: 1 }]);
  });

  it("returns nothing for a root absent from the scope", () => {
    const partners = scopedCooccurrencePartners(
      verseRoots,
      refs,
      { kind: "surah", n: 2 },
      0,
      rootNames,
    );
    expect(partners).toEqual([]);
  });
});

describe("scopedTopPairs", () => {
  it("applies the same floor as the corpus-wide build (fewer than 3 shared verses is noise)", () => {
    // Every pair in this toy corpus shares at most one verse.
    expect(scopedTopPairs(verseRoots, refs, { kind: "quran" }, rootNames)).toEqual([]);
  });

  it("counts a pair once per verse even when both roots repeat in it", () => {
    const denseVerseRoots: VerseRootsFile = [
      [
        [0, 1],
        [0, 2],
        [1, 3],
        [1, 4],
      ], // root0 x2, root1 x2, same verse, three times over
      [
        [0, 1],
        [1, 2],
      ],
      [
        [0, 1],
        [1, 2],
      ],
    ];
    const threeRefs: VerseRef[] = [
      { s: 1, a: 1 },
      { s: 1, a: 2 },
      { s: 1, a: 3 },
    ];
    const pairs = scopedTopPairs(denseVerseRoots, threeRefs, { kind: "quran" }, rootNames);
    expect(pairs).toEqual([{ rootA: "r0", rootB: "r1", count: 3 }]);
  });
});
