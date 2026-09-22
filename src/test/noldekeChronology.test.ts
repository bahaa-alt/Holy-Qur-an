import { describe, expect, it } from "vitest";
import { NOLDEKE_ORDER_BY_SURAH } from "@/lib/data/noldekeChronology";

describe("NOLDEKE_ORDER_BY_SURAH", () => {
  it("has exactly 114 entries", () => {
    expect(NOLDEKE_ORDER_BY_SURAH).toHaveLength(114);
  });

  it("is a permutation of 1..114 (no duplicates, no gaps)", () => {
    const sorted = [...NOLDEKE_ORDER_BY_SURAH].sort((a, b) => a - b);
    expect(sorted).toEqual(Array.from({ length: 114 }, (_, i) => i + 1));
  });

  it("places surah 96 (Al-Alaq) first, matching the near-universal scholarly consensus", () => {
    expect(NOLDEKE_ORDER_BY_SURAH[96 - 1]).toBe(1);
  });

  it("places surah 5 (Al-Ma'idah) last, matching the well-known claim it was revealed late", () => {
    expect(NOLDEKE_ORDER_BY_SURAH[5 - 1]).toBe(114);
  });

  // Three independently retrieved facts, cross-checked before shipping (see
  // the module comment) -- regression-guards against a transcription slip.
  it("matches three independently verified positions", () => {
    expect(NOLDEKE_ORDER_BY_SURAH[27 - 1]).toBe(68);
    expect(NOLDEKE_ORDER_BY_SURAH[60 - 1]).toBe(110);
    expect(NOLDEKE_ORDER_BY_SURAH[49 - 1]).toBe(112);
  });

  it("has 90 Meccan positions (1-90) and 24 Medinan positions (91-114)", () => {
    // The three Meccan phases (48 + 21 + 21) precede the 24 Medinan surahs.
    const meccanCount = NOLDEKE_ORDER_BY_SURAH.filter((p) => p <= 90).length;
    expect(meccanCount).toBe(90);
  });
});
