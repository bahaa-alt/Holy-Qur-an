import { describe, expect, it } from "vitest";
import { letterFrequencyRefs } from "@/lib/insights/letterFrequencyScope";
import { buildVerseRefs } from "@/lib/insights/scope";
import type { MetaFile } from "@/lib/data/types";

const meta = {
  surahs: [
    { n: 1, nameAr: "", nameEn: "", translit: "", type: "meccan", ayahs: 7 },
    { n: 2, nameAr: "", nameEn: "", translit: "", type: "medinan", ayahs: 286 },
  ],
} as unknown as MetaFile;

describe("letterFrequencyRefs", () => {
  it("narrows to exactly one ref when an ayah is given for a surah scope", () => {
    expect(letterFrequencyRefs(meta, { kind: "surah", n: 2 }, 5)).toEqual([{ s: 2, a: 5 }]);
  });

  it("falls back to the plain scope when no ayah is given", () => {
    const refs = letterFrequencyRefs(meta, { kind: "surah", n: 1 }, null);
    expect(refs).toHaveLength(7);
    expect(refs[0]).toEqual({ s: 1, a: 1 });
  });

  it("ignores the ayah refinement outside a surah scope -- it isn't meaningful for any other kind", () => {
    const refs = letterFrequencyRefs(meta, { kind: "quran" }, 3);
    expect(refs).toEqual(buildVerseRefs(meta));
  });

  it("covers the whole Qur'an for the quran scope", () => {
    expect(letterFrequencyRefs(meta, { kind: "quran" }, null)).toEqual(buildVerseRefs(meta));
  });
});
