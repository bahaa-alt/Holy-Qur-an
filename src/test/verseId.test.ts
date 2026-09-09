import { describe, expect, it } from "vitest";
import { globalIdToRef, refToGlobalId } from "@/lib/data/verseId";
import type { MetaFile } from "@/lib/data/types";

const META: MetaFile = {
  surahs: [
    { n: 1, nameAr: "الفاتحة", nameEn: "The Opener", translit: "Al-Fatihah", type: "meccan", ayahs: 7 },
    { n: 2, nameAr: "البقرة", nameEn: "The Cow", translit: "Al-Baqarah", type: "medinan", ayahs: 286 },
    { n: 3, nameAr: "آل عمران", nameEn: "The Family of Imran", translit: "Aal-Imran", type: "medinan", ayahs: 200 },
  ],
};

describe("globalIdToRef", () => {
  it("maps global id 0 to the first ayah of the first surah", () => {
    expect(globalIdToRef(META, 0)).toEqual({ s: 1, a: 1 });
  });

  it("maps the last ayah of a surah correctly", () => {
    expect(globalIdToRef(META, 6)).toEqual({ s: 1, a: 7 });
  });

  it("rolls over into the next surah", () => {
    expect(globalIdToRef(META, 7)).toEqual({ s: 2, a: 1 });
    expect(globalIdToRef(META, 7 + 285)).toEqual({ s: 2, a: 286 });
    expect(globalIdToRef(META, 7 + 286)).toEqual({ s: 3, a: 1 });
  });

  it("returns null for an out-of-range id", () => {
    expect(globalIdToRef(META, 7 + 286 + 200)).toBeNull();
    expect(globalIdToRef(META, -1)).toBeNull();
  });
});

describe("refToGlobalId", () => {
  it("is the inverse of globalIdToRef across the whole range", () => {
    const total = META.surahs.reduce((s, x) => s + x.ayahs, 0);
    for (let id = 0; id < total; id++) {
      const ref = globalIdToRef(META, id)!;
      expect(refToGlobalId(META, ref.s, ref.a)).toBe(id);
    }
  });

  it("returns null for an out-of-range ayah", () => {
    expect(refToGlobalId(META, 1, 8)).toBeNull();
    expect(refToGlobalId(META, 1, 0)).toBeNull();
  });

  it("returns null for a nonexistent surah", () => {
    expect(refToGlobalId(META, 999, 1)).toBeNull();
  });
});
