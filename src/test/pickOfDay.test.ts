import { describe, expect, it } from "vitest";
import { pickRootOfDay, pickVerseOfDay } from "@/lib/dailyPick/pickOfDay";
import { daysSinceEpoch } from "@/lib/dailyPick/dayIndex";
import type { IndexFile, IndexRootRow, MetaFile } from "@/lib/data/types";

function makeRoot(ar: string): IndexRootRow {
  return { ar, key: ar, bw: ar, count: 1, lemmaCount: 1, verseCount: 1, glossShort: `gloss of ${ar}` };
}

const index: IndexFile = {
  roots: [makeRoot("أ"), makeRoot("ب"), makeRoot("ت")],
  lemmas: [],
};

const meta: MetaFile = {
  surahs: [
    { n: 1, nameAr: "الفاتحة", nameEn: "Al-Fatihah", translit: "Al-Fatihah", type: "meccan", ayahs: 7 },
    { n: 2, nameAr: "البقرة", nameEn: "Al-Baqarah", translit: "Al-Baqarah", type: "medinan", ayahs: 286 },
  ],
};

describe("pickRootOfDay", () => {
  it("picks a stable root for a given day, wrapping around the root list", () => {
    const day0 = new Date(daysSinceEpoch(new Date("1970-01-01T00:00:00Z")) * 86_400_000);
    expect(pickRootOfDay(index, day0).ar).toBe("أ");

    const day1 = new Date(day0.getTime() + 86_400_000);
    expect(pickRootOfDay(index, day1).ar).toBe("ب");

    const day3 = new Date(day0.getTime() + 3 * 86_400_000);
    expect(pickRootOfDay(index, day3).ar).toBe("أ"); // wraps: 3 % 3 === 0
  });

  it("is the same for two calls on the same day", () => {
    const morning = new Date("2026-05-01T02:00:00Z");
    const evening = new Date("2026-05-01T22:00:00Z");
    expect(pickRootOfDay(index, morning)).toEqual(pickRootOfDay(index, evening));
  });
});

describe("pickVerseOfDay", () => {
  it("picks 1:1 on day 0 and wraps into surah 2 once surah 1 is exhausted", () => {
    const day0 = new Date(0);
    expect(pickVerseOfDay(meta, day0)).toEqual({ s: 1, a: 1 });

    const day6 = new Date(6 * 86_400_000);
    expect(pickVerseOfDay(meta, day6)).toEqual({ s: 1, a: 7 });

    const day7 = new Date(7 * 86_400_000);
    expect(pickVerseOfDay(meta, day7)).toEqual({ s: 2, a: 1 });
  });

  it("wraps back to 1:1 after the whole corpus (7 + 286 = 293 verses)", () => {
    const day293 = new Date(293 * 86_400_000);
    expect(pickVerseOfDay(meta, day293)).toEqual({ s: 1, a: 1 });
  });
});
