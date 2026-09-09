import { describe, expect, it } from "vitest";
import { buildEnIndex } from "../../scripts/lib/build-en-index";
import { stem } from "@/lib/search/stem";

const VERSES = [
  { globalId: 0, translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful" },
  { globalId: 1, translation: "[All] praise is [due] to Allah, Lord of the worlds" },
  { globalId: 6236 - 1, translation: "From the evil of the whisperer who withdraws" },
];

describe("buildEnIndex", () => {
  const index = buildEnIndex(VERSES);

  it("produces a sorted, deduplicated term list", () => {
    const sorted = [...index.terms].sort((a, b) => a.localeCompare(b));
    expect(index.terms).toEqual(sorted);
    expect(new Set(index.terms).size).toBe(index.terms.length);
  });

  it("indexes a term appearing in multiple verses under all of them", () => {
    const allahIdx = index.terms.indexOf(stem("allah"));
    expect(allahIdx).toBeGreaterThanOrEqual(0);
    expect(index.postings[allahIdx]).toEqual([0, 1]);
  });

  it("does not index stopwords", () => {
    expect(index.terms).not.toContain("the");
    expect(index.terms).not.toContain("of");
  });

  it("keeps postings sorted ascending and deduplicated per term", () => {
    for (const postingList of index.postings) {
      const sorted = [...postingList].sort((a, b) => a - b);
      expect(postingList).toEqual(sorted);
      expect(new Set(postingList).size).toBe(postingList.length);
    }
  });

  it("terms and postings stay parallel arrays of equal length", () => {
    expect(index.postings).toHaveLength(index.terms.length);
  });

  it("indexes a term appearing once under just its own verse", () => {
    const whispererIdx = index.terms.indexOf(stem("whisperer"));
    expect(whispererIdx).toBeGreaterThanOrEqual(0);
    expect(index.postings[whispererIdx]).toEqual([6235]);
  });
});
