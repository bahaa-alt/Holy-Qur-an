import { describe, expect, it } from "vitest";
import { countRhymeEndings, surahRhymeSummary, versesWithEnding } from "@/lib/quran/rhyme";
import type { RhymeRow } from "@/lib/data/types";

const ROWS: RhymeRow[] = [
  { s: 1, a: 1, ending: "م" },
  { s: 1, a: 2, ending: "ن" },
  { s: 1, a: 3, ending: "م" },
  { s: 2, a: 1, ending: "م" },
  { s: 2, a: 2, ending: "د" },
];

describe("countRhymeEndings", () => {
  it("ranks endings by how many verses end with them, ties broken alphabetically", () => {
    expect(countRhymeEndings(ROWS)).toEqual([
      { letter: "م", count: 3 },
      { letter: "د", count: 1 },
      { letter: "ن", count: 1 },
    ]);
  });

  it("returns an empty array for no rows", () => {
    expect(countRhymeEndings([])).toEqual([]);
  });
});

describe("versesWithEnding", () => {
  it("returns every verse ending in the given letter, in order", () => {
    expect(versesWithEnding(ROWS, "م")).toEqual([
      { s: 1, a: 1, ending: "م" },
      { s: 1, a: 3, ending: "م" },
      { s: 2, a: 1, ending: "م" },
    ]);
  });

  it("returns an empty array when no verse ends in that letter", () => {
    expect(versesWithEnding(ROWS, "ز")).toEqual([]);
  });
});

describe("surahRhymeSummary", () => {
  it("finds the dominant ending letter within one surah, ignoring other surahs' rows", () => {
    // Surah 1's own rows are م,ن,م -- م dominates 2 of 3, regardless of
    // surah 2's rows (which would tie م at 3 total if not filtered first).
    expect(surahRhymeSummary(ROWS, 1)).toEqual({ dominant: { letter: "م", count: 2 }, totalVerses: 3 });
  });

  it("returns totalVerses matching just that surah's row count", () => {
    expect(surahRhymeSummary(ROWS, 2)).toEqual({ dominant: { letter: "د", count: 1 }, totalVerses: 2 });
  });

  it("returns a null dominant and zero total for a surah with no rows", () => {
    expect(surahRhymeSummary(ROWS, 99)).toEqual({ dominant: null, totalVerses: 0 });
  });
});
