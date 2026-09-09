import { describe, expect, it } from "vitest";
import { buildHighlightedVerse, highlightSingle } from "@/lib/highlight";

// 1:1 tokens (Uthmani, whitespace-split): بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
const AYAH_1_1 = ["بِسْمِ", "ٱللَّهِ", "ٱلرَّحْمَٰنِ", "ٱلرَّحِيمِ"];

describe("buildHighlightedVerse", () => {
  it("marks the requested 1-based word index as highlighted, others as none", () => {
    const result = buildHighlightedVerse(AYAH_1_1, [3]);
    expect(result).toEqual([
      { text: "بِسْمِ", level: "none" },
      { text: "ٱللَّهِ", level: "none" },
      { text: "ٱلرَّحْمَٰنِ", level: "highlight" },
      { text: "ٱلرَّحِيمِ", level: "none" },
    ]);
  });

  it("marks every index in a verse where a root occurs more than once", () => {
    // both رَّحْمَٰنِ (3) and رَّحِيمِ (4) share root رحم
    const result = buildHighlightedVerse(AYAH_1_1, [3, 4]);
    expect(result.map((t) => t.level)).toEqual(["none", "none", "highlight", "highlight"]);
  });

  it("marks the emphasis index as emphasis even when also in highlightIndices", () => {
    const result = buildHighlightedVerse(AYAH_1_1, [3, 4], 4);
    expect(result.map((t) => t.level)).toEqual(["none", "none", "highlight", "emphasis"]);
  });

  it("ignores out-of-range indices instead of throwing", () => {
    const result = buildHighlightedVerse(AYAH_1_1, [0, 99, 2]);
    expect(result.map((t) => t.level)).toEqual(["none", "highlight", "none", "none"]);
  });

  it("preserves the original token text", () => {
    const result = buildHighlightedVerse(AYAH_1_1, []);
    expect(result.map((t) => t.text)).toEqual(AYAH_1_1);
  });
});

describe("highlightSingle", () => {
  it("marks exactly one index as emphasis", () => {
    const result = highlightSingle(AYAH_1_1, 3);
    expect(result.map((t) => t.level)).toEqual(["none", "none", "emphasis", "none"]);
  });
});
