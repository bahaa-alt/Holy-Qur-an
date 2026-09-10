import { describe, expect, it } from "vitest";
import { buildRhyme } from "../../scripts/lib/build-rhyme";
import type { SurahFile } from "@/lib/data/types";

const SURAH_1: SurahFile = {
  n: 1,
  verses: [
    { a: 1, w: ["بِسۡمِ", "ٱللَّهِ", "ٱلرَّحۡمَٰنِ", "ٱلرَّحِيمِ"], t: "" },
    { a: 2, w: ["ٱلۡحَمۡدُ", "لِلَّهِ", "رَبِّ", "ٱلۡعَٰلَمِينَ"], t: "" },
  ],
};

const SURAH_2: SurahFile = {
  n: 2,
  verses: [{ a: 1, w: ["الٓمٓ"], t: "" }],
};

describe("buildRhyme", () => {
  it("takes the last letter of each verse's last word, diacritics stripped", () => {
    const { rows } = buildRhyme(new Map([[1, SURAH_1]]));
    expect(rows).toEqual([
      { s: 1, a: 1, ending: "م" }, // ٱلرَّحِيمِ -> stripped ٱلرحيم -> ends in م
      { s: 1, a: 2, ending: "ن" }, // ٱلۡعَٰلَمِينَ -> stripped ٱلعلمين -> ends in ن
    ]);
  });

  it("orders rows by surah number, in Qur'an order, regardless of Map insertion order", () => {
    const { rows } = buildRhyme(new Map([[2, SURAH_2], [1, SURAH_1]]));
    expect(rows.map((r) => r.s)).toEqual([1, 1, 2]);
  });

  it("handles a single-word verse (e.g. muqattaʿāt letters)", () => {
    const { rows } = buildRhyme(new Map([[2, SURAH_2]]));
    expect(rows).toEqual([{ s: 2, a: 1, ending: "م" }]); // الٓمٓ -> stripped الم -> ends in م
  });
});
