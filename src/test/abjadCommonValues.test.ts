import { describe, expect, it } from "vitest";
import { buildAbjadCommonValues } from "@/lib/quran/abjadCommonValues";
import type { AbjadTotalsFile } from "@/lib/data/types";

const ABJAD: AbjadTotalsFile = {
  bookTotal: 0,
  bySurah: [786, 100], // 786 shared with two verses below; 100 unique to this surah
  byHizb: [],
  byJuz: [],
  byVerse: [786, 786, 100, 50], // 786 shared by two verses + one surah (3 members); 100 shared with a surah (2); 50 unique
  byWord: [
    { form: "اب", value: 786, count: 2 },
    { form: "جد", value: 786, count: 1 },
  ],
};

describe("buildAbjadCommonValues", () => {
  const groups = buildAbjadCommonValues(ABJAD);

  it("drops values with only a single member across verses/surahs/words", () => {
    expect(groups.find((g) => g.value === 50)).toBeUndefined();
  });

  it("keeps a value shared between exactly a verse and a surah", () => {
    const g = groups.find((g) => g.value === 100);
    expect(g).toEqual({ value: 100, verseCount: 1, surahCount: 1, wordForms: [] });
  });

  it("aggregates verse, surah, and word membership for one value", () => {
    const g = groups.find((g) => g.value === 786);
    expect(g).toEqual({ value: 786, verseCount: 2, surahCount: 1, wordForms: ["اب", "جد"] });
  });

  it("sorts by total member count descending", () => {
    expect(groups.map((g) => g.value)).toEqual([786, 100]);
  });
});
