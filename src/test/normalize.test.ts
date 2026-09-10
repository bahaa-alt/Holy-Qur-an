import { describe, expect, it } from "vitest";
import {
  altKeyFor,
  collapseRepeatedAlif,
  isArabic,
  normalize,
  normalizeForPhraseSearch,
  normalizeRootKey,
} from "@/lib/arabic/normalize";

describe("normalize", () => {
  it("strips tashkeel and dagger alif, unifying it away (كِتَٰبُ -> كتب)", () => {
    // 2:2:2:2 in the morphology corpus, root كتب
    expect(normalize("كِتَٰبُ")).toBe("كتب");
  });

  it("strips tashkeel from a verb form (يَكْتُبُ -> يكتب)", () => {
    // 2:79:3:1
    expect(normalize("يَكْتُبُ")).toBe("يكتب");
  });

  it("unifies alif variants and strips diacritics (ٱلرَّحْمَٰنِ -> الرحمن)", () => {
    expect(normalize("ٱلرَّحْمَٰنِ")).toBe("الرحمن");
  });

  it("leaves standalone hamza and hamza-on-waw untouched on word forms", () => {
    // 2:29:18:1 شَىْءٍ ("a thing"), root شيأ -> alif maksura folds to ya, hamza stays
    expect(normalize("شَىْءٍ")).toBe("شيء");
    expect(normalize("مُؤْمِنِينَ")).toContain("ؤ");
  });

  it("maps alif maksura to ya and teh marbuta to ha", () => {
    expect(normalize("عَلَىٰ")).toBe("علي");
    expect(normalize("رَحْمَة")).toBe("رحمه");
  });

  it("is idempotent", () => {
    const once = normalize("ٱلرَّحْمَٰنِ");
    expect(normalize(once)).toBe(once);
  });
});

describe("normalizeRootKey", () => {
  it("folds alif-with-hamza and standalone hamza to alif in addition to normal normalization", () => {
    // أمن spells its first radical with hamza-on-alif (أ), already folded by normalize()
    expect(normalizeRootKey("أمن")).toBe("امن");
    // هاء ("H", the letter name) ends in a standalone hamza (ء), which only
    // normalizeRootKey folds -- normalize() alone would leave it as هاء
    expect(normalizeRootKey("هاء")).toBe("هاا");
    expect(normalize("هاء")).toBe("هاء");
  });

  it("leaves an already-plain root unchanged", () => {
    expect(normalizeRootKey("كتب")).toBe("كتب");
    expect(normalizeRootKey("رحم")).toBe("رحم");
  });
});

describe("altKeyFor", () => {
  it("returns an alternate key with dagger alif rendered as a full alif", () => {
    expect(altKeyFor("كِتَٰبُ")).toBe("كتاب");
    expect(altKeyFor("رَّحْمَٰنِ")).toBe("رحمان");
  });

  it("returns null when there is no dagger alif", () => {
    expect(altKeyFor("كِتَابُ")).toBeNull();
    expect(altKeyFor("hello")).toBeNull();
  });
});

describe("normalizeForPhraseSearch", () => {
  it("expands a dagger alif to a full alif instead of stripping it", () => {
    // plain normalize() would give "الرحمن" (dagger alif stripped away)
    expect(normalizeForPhraseSearch("ٱلرَّحْمَٰنِ")).toBe("الرحمان");
  });

  it("folds every hamza carrier (ء ؤ ئ), not just standalone ء, to ا", () => {
    expect(normalizeForPhraseSearch("ءَامَنُوا")).toBe("امنوا");
    expect(normalizeForPhraseSearch("مُؤْمِنِينَ")).toBe("مامنين");
  });

  it("reconciles the three common spellings of a hamza+alif word to one key", () => {
    const viaMadda = normalizeForPhraseSearch("آمَنُوا"); // آ, madda-alif
    const viaHamzaSeat = normalizeForPhraseSearch("ءَامَنُوا"); // ء then ا
    const viaPlainAlif = normalizeForPhraseSearch("امَنُوا"); // plain ا
    expect(viaMadda).toBe(viaHamzaSeat);
    expect(viaMadda).toBe(viaPlainAlif);
  });

  it("collapses a run of repeated alifs produced by the hamza fold", () => {
    expect(normalizeForPhraseSearch("ءامنوا")).not.toMatch(/ا{2,}/);
  });
});

describe("collapseRepeatedAlif", () => {
  it("collapses two or more consecutive alifs to one", () => {
    expect(collapseRepeatedAlif("ياادم")).toBe("يادم");
    expect(collapseRepeatedAlif("ياااب")).toBe("ياب");
  });

  it("leaves text with no repeated alif unchanged", () => {
    expect(collapseRepeatedAlif("يابني")).toBe("يابني");
  });
});

describe("isArabic", () => {
  it("detects Arabic-block characters", () => {
    expect(isArabic("كتب")).toBe(true);
    expect(isArabic("Book كتب")).toBe(true);
  });

  it("returns false for pure Latin text", () => {
    expect(isArabic("ktb")).toBe(false);
    expect(isArabic("knowledge")).toBe(false);
  });
});
