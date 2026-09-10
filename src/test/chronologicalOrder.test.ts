import { describe, expect, it } from "vitest";
import { CHRONOLOGICAL_ORDER_BY_SURAH } from "@/lib/data/chronologicalOrder";

describe("CHRONOLOGICAL_ORDER_BY_SURAH", () => {
  it("has exactly 114 entries", () => {
    expect(CHRONOLOGICAL_ORDER_BY_SURAH).toHaveLength(114);
  });

  it("is a permutation of 1..114 (no duplicates, no gaps)", () => {
    const sorted = [...CHRONOLOGICAL_ORDER_BY_SURAH].sort((a, b) => a - b);
    expect(sorted).toEqual(Array.from({ length: 114 }, (_, i) => i + 1));
  });

  it("places surah 96 (Al-Alaq, traditionally the first revelation) first", () => {
    expect(CHRONOLOGICAL_ORDER_BY_SURAH[96 - 1]).toBe(1);
  });

  it("places surah 110 (An-Nasr, traditionally among the last) last", () => {
    expect(CHRONOLOGICAL_ORDER_BY_SURAH[110 - 1]).toBe(114);
  });

  it("places the standard Uthmani-order first and second surahs early/late respectively", () => {
    // Surah 1 (Al-Fatiha) is early Meccan; surah 2 (Al-Baqarah) is the first Medinan surah.
    expect(CHRONOLOGICAL_ORDER_BY_SURAH[1 - 1]).toBeLessThanOrEqual(86);
    expect(CHRONOLOGICAL_ORDER_BY_SURAH[2 - 1]).toBeGreaterThan(86);
  });
});
