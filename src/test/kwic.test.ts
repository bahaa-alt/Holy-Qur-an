import { describe, expect, it } from "vitest";
import { buildKwicLine } from "@/lib/kwic";

// 1:1 tokens (Uthmani, whitespace-split): بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
const AYAH_1_1 = ["بِسْمِ", "ٱللَّهِ", "ٱلرَّحْمَٰنِ", "ٱلرَّحِيمِ"];
// 1:1 tokens followed by 1:2's (ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ), concatenated into
// one 8-token array purely to exercise a longer window -- buildKwicLine works
// on any token array, not necessarily a single verse.
const EIGHT_TOKENS = [...AYAH_1_1, "ٱلْحَمْدُ", "لِلَّهِ", "رَبِّ", "ٱلْعَٰلَمِينَ"];

describe("buildKwicLine", () => {
  it("builds before/match/after with truncation on both sides for a mid-array match", () => {
    const line = buildKwicLine(EIGHT_TOKENS, 5, 2);
    expect(line).toEqual({
      before: "ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
      match: "ٱلْحَمْدُ",
      after: "لِلَّهِ رَبِّ",
      truncatedBefore: true,
      truncatedAfter: true,
    });
  });

  it("has an empty, non-truncated before when the match is the first token", () => {
    const line = buildKwicLine(EIGHT_TOKENS, 1, 6);
    expect(line.before).toBe("");
    expect(line.truncatedBefore).toBe(false);
    expect(line.match).toBe("بِسْمِ");
    expect(line.truncatedAfter).toBe(true);
  });

  it("has an empty, non-truncated after when the match is the last token", () => {
    const line = buildKwicLine(EIGHT_TOKENS, 8, 6);
    expect(line.after).toBe("");
    expect(line.truncatedAfter).toBe(false);
    expect(line.match).toBe("ٱلْعَٰلَمِينَ");
    expect(line.truncatedBefore).toBe(true);
  });

  it("sets no truncation flags when the context window exceeds the available tokens", () => {
    const line = buildKwicLine(AYAH_1_1, 2, 6);
    expect(line).toEqual({
      before: "بِسْمِ",
      match: "ٱللَّهِ",
      after: "ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
      truncatedBefore: false,
      truncatedAfter: false,
    });
  });
});
