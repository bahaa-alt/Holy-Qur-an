import { describe, expect, it } from "vitest";
import { countRhymeEndings, versesWithEnding } from "@/lib/quran/rhyme";
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
