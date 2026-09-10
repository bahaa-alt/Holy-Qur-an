import { describe, expect, it } from "vitest";
import { ABJAD_LETTER_ORDER, ABJAD_VALUES, abjadLetterValues, abjadValueOf } from "@/lib/arabic/abjad";

describe("ABJAD_VALUES", () => {
  it("has exactly the 28 letters of the classical table", () => {
    expect(Object.keys(ABJAD_VALUES)).toHaveLength(28);
  });

  it("has the same 28 letters as the display-order list, just a different order", () => {
    expect([...ABJAD_LETTER_ORDER].sort()).toEqual(Object.keys(ABJAD_VALUES).sort());
  });

  it("assigns the standard values at each decade boundary", () => {
    expect(ABJAD_VALUES["ا"]).toBe(1);
    expect(ABJAD_VALUES["ي"]).toBe(10);
    expect(ABJAD_VALUES["ك"]).toBe(20);
    expect(ABJAD_VALUES["ص"]).toBe(90);
    expect(ABJAD_VALUES["ق"]).toBe(100);
    expect(ABJAD_VALUES["غ"]).toBe(1000);
  });
});

describe("abjadValueOf", () => {
  it("sums a simple word's letters directly from the table", () => {
    // ك=20 ت=400 ب=2
    expect(abjadValueOf("كتب")).toBe(422);
  });

  it("strips diacritics before summing", () => {
    expect(abjadValueOf("كِتَابٌ")).toBe(abjadValueOf("كتاب"));
  });

  it("folds hamza-on-alif seats (أ إ آ ٱ) to alif's value", () => {
    // ق=100 ر=200 أ->ا=1
    expect(abjadValueOf("قرأ")).toBe(301);
    expect(abjadValueOf("ٱلرَّحْمَٰنِ".replace(/ٰ/g, ""))).toBe(abjadValueOf("الرحمن"));
  });

  it("folds standalone hamza carriers (ء ؤ ئ) to alif's value", () => {
    expect(abjadValueOf("سماء")).toBe(abjadValueOf("سماا"));
  });

  it("folds teh marbuta (ة) to heh's value", () => {
    // ر=200 ح=8 م=40 ة->ه=5
    expect(abjadValueOf("رحمة")).toBe(253);
  });

  it("folds alif maksura (ى) to ya's value", () => {
    // ع=70 ل=30 ى->ي=10
    expect(abjadValueOf("على")).toBe(110);
  });

  it("skips spaces and non-Arabic characters without counting them", () => {
    expect(abjadValueOf("كتب 123 abc")).toBe(422);
  });

  it("sums across multiple words when given a whole phrase", () => {
    expect(abjadValueOf("اب اب")).toBe(2 * abjadValueOf("اب"));
  });

  it("returns 0 for text with no Abjad letters", () => {
    expect(abjadValueOf("123")).toBe(0);
    expect(abjadValueOf("")).toBe(0);
  });
});

describe("abjadLetterValues", () => {
  it("returns one entry per letter, preserving the original (unfolded) letter", () => {
    const result = abjadLetterValues("قرأ");
    expect(result).toEqual([
      { letter: "ق", value: 100 },
      { letter: "ر", value: 200 },
      { letter: "أ", value: 1 },
    ]);
  });
});
