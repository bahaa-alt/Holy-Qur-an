import { describe, expect, it } from "vitest";
import { JUZ_COUNT, filterVersesInJuz, juzForVerse, juzRange, juzSurahNumbers } from "@/lib/quran/juz";
import type { SurahFile } from "@/lib/data/types";

function stubSurah(n: number, verseCount: number): SurahFile {
  return {
    n,
    verses: Array.from({ length: verseCount }, (_, i) => ({ a: i + 1, w: [], t: `s${n}:${i + 1}` })),
  };
}

describe("juzForVerse", () => {
  it("resolves the first verse of the Qur'an to Juz' 1", () => {
    expect(juzForVerse(1, 1)).toBe(1);
  });

  it("resolves the last verse of the Qur'an to Juz' 30", () => {
    expect(juzForVerse(114, 6)).toBe(30);
  });

  it("resolves a verse exactly at a Juz' boundary to the new Juz'", () => {
    expect(juzForVerse(2, 142)).toBe(2); // Juz' 2 starts here
    expect(juzForVerse(2, 141)).toBe(1); // one ayah earlier is still Juz' 1
  });

  it("resolves a verse mid-surah, between two boundaries within the same surah", () => {
    expect(juzForVerse(2, 200)).toBe(2); // between 2:142 (Juz 2) and 2:253 (Juz 3)
  });

  it("resolves a verse in a surah with no boundary of its own, inheriting the last Juz' that started before it", () => {
    // Surah 10 has no Juz' start of its own; Juz' 11 starts at 9:93, Juz' 12 at 11:6.
    expect(juzForVerse(10, 1)).toBe(11);
  });

  it("resolves every Juz' start point to its own Juz' number", () => {
    for (let juz = 1; juz <= JUZ_COUNT; juz++) {
      const { start } = juzRange(juz);
      expect(juzForVerse(start.s, start.a)).toBe(juz);
    }
  });
});

describe("juzRange", () => {
  it("gives Juz' 1 an end at Juz' 2's start", () => {
    const { start, end } = juzRange(1);
    expect(start).toEqual({ s: 1, a: 1 });
    expect(end).toEqual({ s: 2, a: 142 });
  });

  it("gives Juz' 30 a null end (runs to the end of the Qur'an)", () => {
    const { end } = juzRange(30);
    expect(end).toBeNull();
  });

  it("throws for an out-of-range Juz' number", () => {
    expect(() => juzRange(0)).toThrow();
    expect(() => juzRange(31)).toThrow();
  });
});

describe("juzSurahNumbers", () => {
  it("lists every surah a Juz' spans, including a boundary surah it only partially covers", () => {
    expect(juzSurahNumbers(4)).toEqual([3, 4]); // Juz' 4: 3:93 -> Juz' 5 at 4:24
  });

  it("lists a single surah when a Juz' both starts and ends inside it", () => {
    expect(juzSurahNumbers(5)).toEqual([4]); // Juz' 5: 4:24 -> Juz' 6 at 4:148
  });

  it("runs to surah 114 for the last Juz'", () => {
    const nums = juzSurahNumbers(30);
    expect(nums[0]).toBe(78);
    expect(nums[nums.length - 1]).toBe(114);
  });
});

describe("filterVersesInJuz", () => {
  it("takes a fully-contained surah in full and trims boundary surahs to just the ayahs inside the Juz'", () => {
    const surahs = new Map([
      [3, stubSurah(3, 96)],
      [4, stubSurah(4, 26)],
    ]);
    const verses = filterVersesInJuz(4, surahs); // 3:93 -> 4:24 (exclusive)

    expect(verses).toHaveLength(4 + 23); // surah 3: ayahs 93-96; surah 4: ayahs 1-23
    expect(verses[0].t).toBe("s3:93");
    expect(verses.map((v) => v.t)).not.toContain("s3:92"); // just before the Juz' starts
    expect(verses.map((v) => v.t)).toContain("s4:23");
    expect(verses.map((v) => v.t)).not.toContain("s4:24"); // Juz' 5 starts here
  });

  it("includes every verse of a Juz' fully contained within one surah", () => {
    const surahs = new Map([[4, stubSurah(4, 150)]]);
    const verses = filterVersesInJuz(5, surahs); // 4:24 -> 4:148
    expect(verses).toHaveLength(148 - 24); // ayahs 24-147
    expect(verses[0].t).toBe("s4:24");
    expect(verses[verses.length - 1].t).toBe("s4:147");
  });

  it("skips a surah the caller never fetched, rather than throwing", () => {
    const verses = filterVersesInJuz(4, new Map([[3, stubSurah(3, 96)]])); // surah 4 missing
    expect(verses.every((v) => v.t.startsWith("s3:"))).toBe(true);
  });

  it("runs to the true end of the Qur'an for Juz' 30 (no next boundary to stop at)", () => {
    const surahs = new Map([[114, stubSurah(114, 6)]]);
    const verses = filterVersesInJuz(30, surahs);
    expect(verses).toHaveLength(6);
  });
});
