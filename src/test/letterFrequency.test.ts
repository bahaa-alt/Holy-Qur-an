import { describe, expect, it } from "vitest";
import { countLetters, letterCountOf } from "@/lib/arabic/letterFrequency";

describe("countLetters", () => {
  it("counts each Arabic letter across the given texts, diacritics stripped", () => {
    const rows = countLetters(["بِسۡمِ ٱللَّهِ"]);
    const byLetter = Object.fromEntries(rows.map((r) => [r.letter, r.count]));
    expect(byLetter["ل"]).toBe(2); // ٱللَّهِ has two lams
    expect(byLetter["ب"]).toBe(1);
    expect(byLetter["س"]).toBe(1);
    expect(byLetter["م"]).toBe(1);
    expect(byLetter["ٱ"]).toBe(1);
    expect(byLetter["ه"]).toBe(1);
  });

  it("does not unify letter variants the way normalize() does", () => {
    const rows = countLetters(["آ", "أ", "إ", "ٱ", "ا"]);
    const letters = rows.map((r) => r.letter).sort();
    expect(letters).toEqual(["آ", "أ", "إ", "ا", "ٱ"].sort());
    expect(rows.every((r) => r.count === 1)).toBe(true);
  });

  it("excludes diacritics, tatweel, spaces, and non-Arabic characters", () => {
    const rows = countLetters(["بَـتّ 123 abc"]);
    const letters = rows.map((r) => r.letter);
    expect(letters).toEqual(["ب", "ت"]);
  });

  it("sums across multiple texts", () => {
    const rows = countLetters(["كتب", "كتاب", "مكتوب"]);
    const byLetter = Object.fromEntries(rows.map((r) => [r.letter, r.count]));
    expect(byLetter["ك"]).toBe(3);
    expect(byLetter["ت"]).toBe(3);
    expect(byLetter["ب"]).toBe(3);
  });

  it("returns an empty array for texts with no Arabic letters", () => {
    expect(countLetters(["123", ""])).toEqual([]);
  });
});

describe("letterCountOf", () => {
  it("counts one word's letters with diacritics stripped", () => {
    expect(letterCountOf("بِسۡمِ")).toBe(3);
  });

  it("returns 0 for text with no Arabic letters", () => {
    expect(letterCountOf("123")).toBe(0);
  });

  it("sorts by count desc, then by letter for ties", () => {
    const rows = countLetters(["ببب تت س"]);
    expect(rows.map((r) => r.letter)).toEqual(["ب", "ت", "س"]);
  });
});
