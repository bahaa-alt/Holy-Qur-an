import { describe, expect, it } from "vitest";
import { parseMorphologyTSV } from "../../scripts/lib/parse-morphology";
import { buildAbjad } from "../../scripts/lib/build-abjad";
import { HIZB_COUNT } from "@/lib/quran/hizb";
import { JUZ_COUNT } from "@/lib/quran/juz";

// Real morphological tags don't matter here -- buildAbjad only reads
// word.s/a/text, not segments.
const ROWS = [
  "1:1:1:1\tاب\tN\tLEM:اب", // value 1+2=3
  "1:2:1:1\tجد\tN\tLEM:جد", // value 3+4=7
  "2:1:1:1\tه\tN\tLEM:ه", // value 5
].join("\n");

// Global verse ids, Qur'an order: 1:1 -> 0, 1:2 -> 1, 2:1 -> 2.
const GLOBAL_ID_OF = new Map([
  ["1:1", 0],
  ["1:2", 1],
  ["2:1", 2],
]);

describe("buildAbjad", () => {
  const totals = buildAbjad(parseMorphologyTSV(ROWS), 2, GLOBAL_ID_OF);

  it("sums every word's Abjad value into the book total", () => {
    expect(totals.bookTotal).toBe(3 + 7 + 5);
  });

  it("sums per surah", () => {
    expect(totals.bySurah).toHaveLength(2);
    expect(totals.bySurah[0]).toBe(3 + 7); // surah 1: both verses
    expect(totals.bySurah[1]).toBe(5); // surah 2
  });

  it("sums per Hizb and per Juz' (all three fixture verses fall in Hizb 1 / Juz' 1)", () => {
    expect(totals.byHizb).toHaveLength(HIZB_COUNT);
    expect(totals.byJuz).toHaveLength(JUZ_COUNT);
    expect(totals.byHizb[0]).toBe(15);
    expect(totals.byJuz[0]).toBe(15);
    expect(totals.byHizb.slice(1).every((v) => v === 0)).toBe(true);
    expect(totals.byJuz.slice(1).every((v) => v === 0)).toBe(true);
  });

  it("sums per verse, indexed by global verse id", () => {
    expect(totals.byVerse).toHaveLength(GLOBAL_ID_OF.size);
    expect(totals.byVerse[0]).toBe(3); // 1:1
    expect(totals.byVerse[1]).toBe(7); // 1:2
    expect(totals.byVerse[2]).toBe(5); // 2:1
  });
});
