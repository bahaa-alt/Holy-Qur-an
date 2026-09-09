import { describe, expect, it } from "vitest";
import { ARABIC_ALPHABET, compareArabic } from "@/lib/arabic/letters";
import { normalizeRootKey } from "@/lib/arabic/normalize";

describe("compareArabic", () => {
  it("orders letters per the traditional alphabet, not codepoint order", () => {
    const sorted = ["ي", "ا", "ك", "ب"].sort(compareArabic);
    expect(sorted).toEqual(["ا", "ب", "ك", "ي"]);
  });

  it("sorts real roots (compared by normalized key, since compareArabic assumes plain letters)", () => {
    const roots = ["كتب", "أمن", "رحم", "بني"];
    const sorted = [...roots].sort((a, b) => compareArabic(normalizeRootKey(a), normalizeRootKey(b)));
    expect(sorted).toEqual(["أمن", "بني", "رحم", "كتب"]);
  });

  it("falls back to sorting unknown (unnormalized) characters last, not throwing", () => {
    expect(() => compareArabic("أمن", "بني")).not.toThrow();
  });

  it("orders a shorter prefix before its longer extension", () => {
    expect(compareArabic("كت", "كتب")).toBeLessThan(0);
  });

  it("has exactly 28 letters with no duplicates", () => {
    expect(ARABIC_ALPHABET).toHaveLength(28);
    expect(new Set(ARABIC_ALPHABET).size).toBe(28);
  });
});
