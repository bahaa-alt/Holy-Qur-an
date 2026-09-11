import { describe, expect, it } from "vitest";
import { findByAbjadValue } from "@/lib/quran/abjadLookup";
import type { AbjadTotalsFile, MetaFile } from "@/lib/data/types";

// Two surahs: surah 1 has 2 verses (global ids 0,1), surah 2 has 1 verse (global id 2).
const META: MetaFile = {
  surahs: [
    { n: 1, nameAr: "أ", nameEn: "A", translit: "A", type: "meccan", ayahs: 2 },
    { n: 2, nameAr: "ب", nameEn: "B", translit: "B", type: "medinan", ayahs: 1 },
  ],
};

const ABJAD: AbjadTotalsFile = {
  bookTotal: 786 + 786 + 100,
  bySurah: [786 + 786, 100],
  byHizb: [],
  byJuz: [],
  byVerse: [786, 786, 100],
  byWord: [
    { form: "اب", value: 786, count: 3 },
    { form: "جد", value: 786, count: 1 },
  ],
};

describe("findByAbjadValue", () => {
  it("finds every verse whose total equals the target value", () => {
    expect(findByAbjadValue(ABJAD, META, 786).verses).toEqual([
      { s: 1, a: 1 },
      { s: 1, a: 2 },
    ]);
  });

  it("finds a whole surah whose total equals the target value", () => {
    const result = findByAbjadValue(ABJAD, META, 1572);
    expect(result.surahs).toEqual([1]);
    expect(result.verses).toEqual([]);
    expect(result.words).toEqual([]);
  });

  it("finds every distinct word form whose value equals the target value", () => {
    expect(findByAbjadValue(ABJAD, META, 786).words).toEqual([
      { form: "اب", count: 3 },
      { form: "جد", count: 1 },
    ]);
  });

  it("returns empty results for a value nothing matches", () => {
    expect(findByAbjadValue(ABJAD, META, 12345)).toEqual({ verses: [], surahs: [], words: [] });
  });
});
