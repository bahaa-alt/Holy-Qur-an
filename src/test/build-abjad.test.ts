import { describe, expect, it } from "vitest";
import { parseMorphologyTSV } from "../../scripts/lib/parse-morphology";
import { buildAbjad } from "../../scripts/lib/build-abjad";
import { HIZB_COUNT } from "@/lib/quran/hizb";
import { JUZ_COUNT } from "@/lib/quran/juz";

// Real morphological tags don't matter here -- buildAbjad only reads
// word.s/a/text, not segments. "َ"/"ْ" are fatha/sukun,
// exercising byWord's dedup-by-diacritics-stripped-skeleton.
const ROWS = [
  "1:1:1:1\tاب\tN\tLEM:اب", // value 1+2=3
  "1:1:2:1\tجَدْ\tN\tLEM:جد", // جد diacritized -- value 3+4=7
  "1:2:1:1\tجد\tN\tLEM:جد", // جد plain again, different verse -- same skeleton as above
  "2:1:1:1\tه\tN\tLEM:ه", // value 5, unique -- dropped from byWord
  "2:2:1:1\tاَبْ\tN\tLEM:اب", // اب diacritized -- same skeleton as row 1
  "2:2:2:1\tز\tN\tLEM:ز", // value 7 -- shares its value with جد, exercises byWord's shared-value filter
].join("\n");

// Global verse ids, Qur'an order: 1:1 -> 0, 1:2 -> 1, 2:1 -> 2, 2:2 -> 3.
const GLOBAL_ID_OF = new Map([
  ["1:1", 0],
  ["1:2", 1],
  ["2:1", 2],
  ["2:2", 3],
]);

describe("buildAbjad", () => {
  const totals = buildAbjad(parseMorphologyTSV(ROWS), 2, GLOBAL_ID_OF);

  it("sums every word's Abjad value into the book total", () => {
    expect(totals.bookTotal).toBe(3 + 7 + 7 + 5 + 3 + 7);
  });

  it("sums per surah", () => {
    expect(totals.bySurah).toHaveLength(2);
    expect(totals.bySurah[0]).toBe(3 + 7 + 7); // surah 1: both verses
    expect(totals.bySurah[1]).toBe(5 + 3 + 7); // surah 2: both verses
  });

  it("sums per Hizb and per Juz' (all four fixture verses fall in Hizb 1 / Juz' 1)", () => {
    expect(totals.byHizb).toHaveLength(HIZB_COUNT);
    expect(totals.byJuz).toHaveLength(JUZ_COUNT);
    expect(totals.byHizb[0]).toBe(32);
    expect(totals.byJuz[0]).toBe(32);
    expect(totals.byHizb.slice(1).every((v) => v === 0)).toBe(true);
    expect(totals.byJuz.slice(1).every((v) => v === 0)).toBe(true);
  });

  it("sums per verse, indexed by global verse id", () => {
    expect(totals.byVerse).toHaveLength(GLOBAL_ID_OF.size);
    expect(totals.byVerse[0]).toBe(3 + 7); // 1:1, two words
    expect(totals.byVerse[1]).toBe(7); // 1:2
    expect(totals.byVerse[2]).toBe(5); // 2:1
    expect(totals.byVerse[3]).toBe(3 + 7); // 2:2, two words
  });

  it("dedupes word forms by their diacritics-stripped skeleton, aggregating counts across diacritic variants", () => {
    // جد appears once plain and once diacritized -- both collapse to one
    // "جد" entry with count 2, since abjadValueOf ignores diacritics anyway.
    const jad = totals.byWord.find((w) => w.form === "جد");
    expect(jad).toEqual({ form: "جد", value: 7, count: 2 });
  });

  it("lists only word forms whose Abjad value is shared by another distinct form", () => {
    // جد and ز both total 7 -- both survive. اب (3, seen plain and
    // diacritized -- count 2) and ه (5) are each the only *form* with their
    // value in this fixture, so both are dropped despite اب's count.
    expect(totals.byWord).toEqual(
      expect.arrayContaining([
        { form: "جد", value: 7, count: 2 },
        { form: "ز", value: 7, count: 1 },
      ]),
    );
    expect(totals.byWord).toHaveLength(2);
  });
});
