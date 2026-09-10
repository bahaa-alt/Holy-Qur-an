import { describe, expect, it } from "vitest";
import { buildSurahOccurrenceCounts } from "@/lib/root/surahHeatmap";
import type { RootFile } from "@/lib/data/types";

function file(occ: [number, number, number, number, number, number][]): RootFile {
  return { root: "ك", total: occ.length, lemmas: [], forms: [], feats: [], occ };
}

describe("buildSurahOccurrenceCounts", () => {
  it("returns a 114-length array, one entry per surah", () => {
    expect(buildSurahOccurrenceCounts(file([]))).toHaveLength(114);
  });

  it("tallies occurrences into the right surah slot (index = surah - 1)", () => {
    const counts = buildSurahOccurrenceCounts(
      file([
        [1, 1, 1, 1, 0, 0],
        [1, 5, 2, 1, 0, 0],
        [114, 1, 1, 1, 0, 0],
      ]),
    );
    expect(counts[0]).toBe(2); // surah 1
    expect(counts[113]).toBe(1); // surah 114
    expect(counts.slice(1, 113).every((c) => c === 0)).toBe(true);
  });

  it("returns all zeros for a root with no occurrences", () => {
    expect(buildSurahOccurrenceCounts(file([])).every((c) => c === 0)).toBe(true);
  });
});
