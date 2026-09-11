import { describe, expect, it } from "vitest";
import { buildFormulas } from "../../scripts/lib/build-formulas";
import type { SurahFile } from "@/lib/data/types";

// Plain ASCII tokens throughout -- normalize() is a no-op on non-Arabic
// text (verified separately in normalize.test.ts), so this keeps the
// n-gram counting arithmetic exact and easy to verify by hand.
function verse(a: number, tokens: string[]) {
  return { a, w: tokens, t: "" };
}

const SURAH_FILES = new Map<number, SurahFile>([
  [
    // Six 3-token verses, each exactly "A B C" -- meets MIN_COUNT[3]=6
    // exactly (a boundary case for ">="). Too short for any 4/5/6-gram.
    1,
    {
      n: 1,
      verses: [
        verse(1, ["A", "B", "C"]),
        verse(2, ["A", "B", "C"]),
        verse(3, ["A", "B", "C"]),
        verse(4, ["A", "B", "C"]),
        verse(5, ["A", "B", "C"]),
        verse(6, ["A", "B", "C"]),
        // A distinct, rare 3-word verse -- its own trigram occurs only
        // once, below MIN_COUNT[3]=6, so it must not appear in results.
        verse(7, ["H", "I", "C"]),
      ],
    },
  ],
  [
    // Five 4-token verses, each exactly "D E F G" -- meets MIN_COUNT[4]=4
    // for the 4-gram "D E F G" (count 5), but the two 3-grams it also
    // produces ("D E F", "E F G", count 5 each) fall below MIN_COUNT[3]=6
    // and must be excluded from the length-3 results.
    2,
    {
      n: 2,
      verses: [
        verse(1, ["D", "E", "F", "G"]),
        verse(2, ["D", "E", "F", "G"]),
        verse(3, ["D", "E", "F", "G"]),
        verse(4, ["D", "E", "F", "G"]),
        verse(5, ["D", "E", "F", "G"]),
      ],
    },
  ],
  [
    // Verse pairs designed to catch a verse-boundary bug: if n-grams were
    // ever built by concatenating a surah's verses instead of sliding
    // within each verse alone, "M N O" would recur 6 times (meeting
    // MIN_COUNT[3]=6) across the odd/even verse boundary below. With a
    // correct per-verse implementation it never occurs at all.
    3,
    {
      n: 3,
      verses: [
        verse(1, ["X1", "M", "N"]),
        verse(2, ["O", "X2", "X3"]),
        verse(3, ["X1", "M", "N"]),
        verse(4, ["O", "X2", "X3"]),
        verse(5, ["X1", "M", "N"]),
        verse(6, ["O", "X2", "X3"]),
        verse(7, ["X1", "M", "N"]),
        verse(8, ["O", "X2", "X3"]),
        verse(9, ["X1", "M", "N"]),
        verse(10, ["O", "X2", "X3"]),
        verse(11, ["X1", "M", "N"]),
        verse(12, ["O", "X2", "X3"]),
        // A 1-token verse, shorter than even the smallest (2-word) window.
        verse(13, ["P"]),
      ],
    },
  ],
  [
    // Six more verses embedding "A B C" starting at word 2 (not word 1,
    // unlike surah 1's verses) -- checks that the stored starting index is
    // the phrase's actual position within each verse, not always 1.
    4,
    {
      n: 4,
      verses: [
        verse(1, ["Z", "A", "B", "C", "Y"]),
        verse(2, ["Z", "A", "B", "C", "Y"]),
        verse(3, ["Z", "A", "B", "C", "Y"]),
        verse(4, ["Z", "A", "B", "C", "Y"]),
        verse(5, ["Z", "A", "B", "C", "Y"]),
        verse(6, ["Z", "A", "B", "C", "Y"]),
      ],
    },
  ],
  [
    // Ten 2-token verses, each exactly "R S" -- meets MIN_COUNT[2]=10
    // exactly (a boundary case for ">="), plus a rare pair below it.
    5,
    {
      n: 5,
      verses: [
        verse(1, ["R", "S"]),
        verse(2, ["R", "S"]),
        verse(3, ["R", "S"]),
        verse(4, ["R", "S"]),
        verse(5, ["R", "S"]),
        verse(6, ["R", "S"]),
        verse(7, ["R", "S"]),
        verse(8, ["R", "S"]),
        verse(9, ["R", "S"]),
        verse(10, ["R", "S"]),
        // A distinct, rare 2-word verse -- its own bigram occurs only
        // once, below MIN_COUNT[2]=10, so it must not appear in results.
        verse(11, ["T", "U"]),
      ],
    },
  ],
]);

describe("buildFormulas", () => {
  const result = buildFormulas(SURAH_FILES);
  const byLength = new Map(result.lengths.map((g) => [g.length, g.rows]));

  it("returns one group per length 2-6, in ascending order", () => {
    expect(result.lengths.map((g) => g.length)).toEqual([2, 3, 4, 5, 6]);
  });

  it("counts a phrase meeting the length-2 minimum and reports its verse refs", () => {
    const row = byLength.get(2)!.find((r) => r.phraseKey === "R S");
    expect(row).toBeDefined();
    expect(row!.count).toBe(10);
    expect(row!.display).toBe("R S");
    expect(row!.refs).toHaveLength(10);
    expect(row!.refs[0]).toEqual({ s: 5, a: 1, w: 1 });
  });

  it("excludes a length-2 phrase below the length-2 minimum", () => {
    expect(byLength.get(2)!.some((r) => r.phraseKey === "T U")).toBe(false);
  });

  it("counts a phrase meeting the length-3 minimum and reports its verse refs", () => {
    // 6 occurrences from surah 1 (starting at word 1) + 6 more from surah 4
    // (embedded starting at word 2) = 12 total.
    const row = byLength.get(3)!.find((r) => r.phraseKey === "A B C");
    expect(row).toBeDefined();
    expect(row!.count).toBe(12);
    expect(row!.display).toBe("A B C");
    expect(row!.refs).toHaveLength(12);
    expect(row!.refs[0]).toEqual({ s: 1, a: 1, w: 1 });
  });

  it("records the phrase's actual starting word index, not always 1", () => {
    const row = byLength.get(3)!.find((r) => r.phraseKey === "A B C");
    const surah4Ref = row!.refs.find((r) => r.s === 4);
    expect(surah4Ref).toEqual({ s: 4, a: 1, w: 2 });
  });

  it("excludes a length-3 phrase below the length-3 minimum", () => {
    expect(byLength.get(3)!.some((r) => r.phraseKey === "H I C")).toBe(false);
  });

  it("counts a phrase meeting the length-4 minimum", () => {
    const row = byLength.get(4)!.find((r) => r.phraseKey === "D E F G");
    expect(row).toBeDefined();
    expect(row!.count).toBe(5);
  });

  it("excludes a length-3 sub-phrase of a length-4 phrase when it falls below the length-3 minimum", () => {
    expect(byLength.get(3)!.some((r) => r.phraseKey === "D E F" || r.phraseKey === "E F G")).toBe(false);
  });

  it("never builds a phrase spanning two different verses", () => {
    for (const rows of byLength.values()) {
      expect(rows.some((r) => r.phraseKey === "M N O")).toBe(false);
    }
  });

  it("handles a verse shorter than the smallest window without error", () => {
    // Verse 3:13 (["P"], length 1) contributes no n-gram of any tracked
    // length; simply not throwing and producing no stray rows referencing
    // it is the assertion.
    for (const rows of byLength.values()) {
      expect(rows.some((r) => r.refs.some((ref) => ref.s === 3 && ref.a === 13))).toBe(false);
    }
  });
});
