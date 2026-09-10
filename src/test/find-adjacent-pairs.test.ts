import { describe, expect, it } from "vitest";
import { findAdjacentRootPairs } from "@/lib/phrases/findAdjacentPairs";
import type { VerseRootsFile } from "@/lib/data/types";

// root indices: 0 = قول, 1 = أله, 2 = علم (arbitrary for this fixture)
const VERSE_ROOTS: VerseRootsFile = [
  [[0, 1], [1, 3]], // verse 0: قول immediately followed by أله -- a match
  [[1, 2], [2, 5]], // verse 1: أله then علم -- not a (قول, أله) match
  [
    [0, 1],
    [2, 2],
    [1, 4],
  ], // verse 2: قول then علم then أله -- قول is NOT immediately followed by أله (علم is between them)
  [
    [0, 1],
    [1, 2],
    [0, 4],
    [1, 5],
  ], // verse 3: two separate (قول, أله) adjacent pairs
  [[1, 1], [1, 3]], // verse 4: أله immediately followed by أله (self-pair)
];

describe("findAdjacentRootPairs", () => {
  it("finds a verse where the lead root is immediately followed by the follow root", () => {
    const matches = findAdjacentRootPairs(VERSE_ROOTS, 0, 1);
    expect(matches).toContainEqual({ globalId: 0, leadW: 1, followW: 3 });
  });

  it("does not match when another root sits between the two", () => {
    const matches = findAdjacentRootPairs(VERSE_ROOTS, 0, 1);
    expect(matches.some((m) => m.globalId === 2)).toBe(false);
  });

  it("finds multiple matches within a single verse", () => {
    const matches = findAdjacentRootPairs(VERSE_ROOTS, 0, 1).filter((m) => m.globalId === 3);
    expect(matches).toEqual([
      { globalId: 3, leadW: 1, followW: 2 },
      { globalId: 3, leadW: 4, followW: 5 },
    ]);
  });

  it("supports a root immediately followed by itself", () => {
    const matches = findAdjacentRootPairs(VERSE_ROOTS, 1, 1);
    expect(matches).toContainEqual({ globalId: 4, leadW: 1, followW: 3 });
  });

  it("returns results in ascending verse order", () => {
    const matches = findAdjacentRootPairs(VERSE_ROOTS, 0, 1);
    const ids = matches.map((m) => m.globalId);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
  });

  it("returns an empty array when the pair never occurs", () => {
    expect(findAdjacentRootPairs(VERSE_ROOTS, 2, 0)).toEqual([]);
  });
});
