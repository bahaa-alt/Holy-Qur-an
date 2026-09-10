import { describe, expect, it } from "vitest";
import { buildArIndex } from "../../scripts/lib/build-ar-index";

// 1:1 (basmala) and 1:2, real Uthmani tokens with tashkeel -- exercises
// normalizeForPhraseSearch() being applied per-token, and that array
// position (not the diacritized string) is what stays aligned to global
// verse id.
const VERSES = [
  { globalId: 0, tokens: ["بِسْمِ", "ٱللَّهِ", "ٱلرَّحْمَٰنِ", "ٱلرَّحِيمِ"] },
  { globalId: 1, tokens: ["ٱلْحَمْدُ", "لِلَّهِ", "رَبِّ", "ٱلْعَٰلَمِينَ"] },
];

describe("buildArIndex", () => {
  const index = buildArIndex(VERSES);

  it("produces one entry per verse, aligned by global id", () => {
    expect(index).toHaveLength(2);
  });

  it("normalizes every token for phrase search (strips tashkeel, unifies alif variants, expands a dagger alif to a full alif)", () => {
    expect(index[0]).toEqual(["بسم", "الله", "الرحمان", "الرحيم"]);
    // ٱلْعَٰلَمِينَ's dagger alif is expanded to a full alif (not stripped --
    // that's plain normalize()'s job, not normalizeForPhraseSearch()'s),
    // so a plainly-typed "العالمين" query matches it.
    expect(index[1]).toEqual(["الحمد", "لله", "رب", "العالمين"]);
  });

  it("preserves token order within a verse", () => {
    expect(index[0][2]).toBe("الرحمان");
  });

  it("places each verse's tokens at its globalId position, regardless of input order", () => {
    const outOfOrder = buildArIndex([
      { globalId: 1, tokens: ["ب"] },
      { globalId: 0, tokens: ["ا"] },
    ]);
    expect(outOfOrder).toHaveLength(2);
    expect(outOfOrder[0]).toEqual(["ا"]);
    expect(outOfOrder[1]).toEqual(["ب"]);
  });
});
