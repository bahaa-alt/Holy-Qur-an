import { describe, expect, it } from "vitest";
import { buildKwicLine } from "@/lib/kwic";

// 1:1 tokens (Uthmani, whitespace-split): بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
const AYAH_1_1 = ["بِسْمِ", "ٱللَّهِ", "ٱلرَّحْمَٰنِ", "ٱلرَّحِيمِ"];
// 1:1 tokens followed by 1:2's (ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ), concatenated into
// one 8-token array purely to exercise a longer window -- buildKwicLine works
// on any token array, not necessarily a single verse.
const EIGHT_TOKENS = [...AYAH_1_1, "ٱلْحَمْدُ", "لِلَّهِ", "رَبِّ", "ٱلْعَٰلَمِينَ"];

const texts = (line: ReturnType<typeof buildKwicLine>) => line.tokens.map((t) => t.text);

describe("buildKwicLine", () => {
  it("windows the match with truncation on both sides for a mid-array match", () => {
    const line = buildKwicLine(EIGHT_TOKENS, 5, 2);
    expect(texts(line)).toEqual(["ٱلرَّحْمَٰنِ", "ٱلرَّحِيمِ", "ٱلْحَمْدُ", "لِلَّهِ", "رَبِّ"]);
    expect(line.truncatedBefore).toBe(true);
    expect(line.truncatedAfter).toBe(true);
  });

  it("carries each token's 1-based word index, which is what the inspector needs", () => {
    // The whole reason this returns tokens rather than joined strings: a
    // tapped context word has to resolve to the right word of the verse.
    const line = buildKwicLine(EIGHT_TOKENS, 5, 2);
    expect(line.tokens.map((t) => t.w)).toEqual([3, 4, 5, 6, 7]);
    expect(line.tokens.find((t) => t.isMatch)).toEqual({ w: 5, text: "ٱلْحَمْدُ", isMatch: true });
    expect(line.tokens.filter((t) => t.isMatch)).toHaveLength(1);
  });

  it("does not truncate before when the match is the first token", () => {
    const line = buildKwicLine(EIGHT_TOKENS, 1, 6);
    expect(line.tokens[0]).toEqual({ w: 1, text: "بِسْمِ", isMatch: true });
    expect(line.truncatedBefore).toBe(false);
    expect(line.truncatedAfter).toBe(true);
  });

  it("does not truncate after when the match is the last token", () => {
    const line = buildKwicLine(EIGHT_TOKENS, 8, 6);
    expect(line.tokens.at(-1)).toEqual({ w: 8, text: "ٱلْعَٰلَمِينَ", isMatch: true });
    expect(line.truncatedAfter).toBe(false);
    expect(line.truncatedBefore).toBe(true);
  });

  it("sets no truncation flags when the context window exceeds the available tokens", () => {
    const line = buildKwicLine(AYAH_1_1, 2, 6);
    expect(texts(line)).toEqual(AYAH_1_1);
    expect(line.tokens.map((t) => t.w)).toEqual([1, 2, 3, 4]);
    expect(line.truncatedBefore).toBe(false);
    expect(line.truncatedAfter).toBe(false);
  });

  it("returns only the match when asked for no context", () => {
    const line = buildKwicLine(AYAH_1_1, 2, 0);
    expect(texts(line)).toEqual(["ٱللَّهِ"]);
    expect(line.truncatedBefore).toBe(true);
    expect(line.truncatedAfter).toBe(true);
  });
});
