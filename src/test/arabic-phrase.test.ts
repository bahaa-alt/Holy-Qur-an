import { describe, expect, it } from "vitest";
import { searchArabicPhrase, tokenizePhraseQuery } from "@/lib/search/arabicPhrase";
import type { ArIndexFile } from "@/lib/data/types";

// A tiny synthetic corpus, shaped like the real ar-index.json: the vocative
// "يا" is never its own token -- it's always fused onto the word it
// precedes (يايها = "يا أيها", exactly as the Uthmani script writes it).
const AR_INDEX: ArIndexFile = [
  ["يايها", "الناس", "اعبدوا"], // 0
  ["يايها", "الذين", "امنوا"], // 1 -- different second word, no match
  ["قالوا", "يايها", "الناس", "انا"], // 2 -- phrase mid-verse
  ["ياقوم"], // 3 -- unrelated single-word verse, too short to match anyway
  ["يايها", "الناس"], // 4 -- phrase is the whole verse
];

describe("tokenizePhraseQuery", () => {
  it("merges a vocative يا onto the following word, matching how it's never a standalone token in the Uthmani script", () => {
    expect(tokenizePhraseQuery("يا أيها الناس")).toEqual(["يايها", "الناس"]);
  });

  it("normalizes tashkeel and alif variants, then merges", () => {
    expect(tokenizePhraseQuery("يَا أَيُّهَا ٱلنَّاسُ")).toEqual(["يايها", "الناس"]);
  });

  it("merges يا onto a word that doesn't start with alif too", () => {
    expect(tokenizePhraseQuery("يا قوم")).toEqual(["ياقوم"]);
  });

  it("collapses repeated whitespace and trims", () => {
    expect(tokenizePhraseQuery("  يا   قوم  ")).toEqual(["ياقوم"]);
  });

  it("returns an empty array for an empty/whitespace-only query", () => {
    expect(tokenizePhraseQuery("   ")).toEqual([]);
  });

  it("leaves a query with no vocative يا unmerged", () => {
    expect(tokenizePhraseQuery("الحمد لله")).toEqual(["الحمد", "لله"]);
  });

  it("does not attempt to merge a trailing يا with nothing after it", () => {
    expect(tokenizePhraseQuery("قالوا يا")).toEqual(["قالوا", "يا"]);
  });
});

describe("searchArabicPhrase", () => {
  it("finds a phrase at the start of a verse", () => {
    const matches = searchArabicPhrase("يا أيها الناس", AR_INDEX);
    expect(matches).toContainEqual({ globalId: 0, startW: 1, endW: 2 });
  });

  it("finds the same phrase mid-verse", () => {
    const matches = searchArabicPhrase("يا أيها الناس", AR_INDEX);
    expect(matches).toContainEqual({ globalId: 2, startW: 2, endW: 3 });
  });

  it("finds a phrase that spans the entire verse", () => {
    const matches = searchArabicPhrase("يا أيها الناس", AR_INDEX);
    expect(matches).toContainEqual({ globalId: 4, startW: 1, endW: 2 });
  });

  it("does not match a verse with a different word following يا أيها", () => {
    const matches = searchArabicPhrase("يا أيها الناس", AR_INDEX);
    expect(matches.some((m) => m.globalId === 1)).toBe(false);
  });

  it("does not match an unrelated verse", () => {
    const matches = searchArabicPhrase("يا أيها الناس", AR_INDEX);
    expect(matches.some((m) => m.globalId === 3)).toBe(false);
  });

  it("matches with diacritics in the query (normalized before comparing)", () => {
    const matches = searchArabicPhrase("يَا أَيُّهَا ٱلنَّاسُ", AR_INDEX);
    expect(matches.length).toBe(3);
  });

  it("supports a single-word query (matches every occurrence of that word)", () => {
    const matches = searchArabicPhrase("الناس", AR_INDEX);
    expect(matches).toHaveLength(3); // verses 0, 2, 4
  });

  it("returns an empty array for an empty query", () => {
    expect(searchArabicPhrase("   ", AR_INDEX)).toEqual([]);
  });

  it("returns no matches when the phrase doesn't occur anywhere", () => {
    expect(searchArabicPhrase("لن يوجد هذا", AR_INDEX)).toEqual([]);
  });
});
