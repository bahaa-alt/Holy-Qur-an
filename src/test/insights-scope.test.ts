import { describe, expect, it } from "vitest";
import {
  buildVerseRefs,
  inScope,
  scopeFromParam,
  scopeToParam,
  scopeToQcqlFilter,
  type Scope,
} from "@/lib/insights/scope";
import { CHRONOLOGICAL_ORDER_BY_SURAH } from "@/lib/data/chronologicalOrder";
import type { MetaFile } from "@/lib/data/types";

const meta = {
  surahs: [
    { n: 1, nameAr: "", nameEn: "", translit: "", type: "meccan", ayahs: 7 },
    { n: 2, nameAr: "", nameEn: "", translit: "", type: "medinan", ayahs: 286 },
  ],
} as unknown as MetaFile;

describe("buildVerseRefs", () => {
  it("lays verses out in corpus order, aligned with verse-roots.json", () => {
    const refs = buildVerseRefs(meta);
    expect(refs).toHaveLength(293);
    expect(refs[0]).toEqual({ s: 1, a: 1 });
    expect(refs[6]).toEqual({ s: 1, a: 7 });
    expect(refs[7]).toEqual({ s: 2, a: 1 });
    expect(refs[292]).toEqual({ s: 2, a: 286 });
  });
});

describe("inScope", () => {
  it("takes everything for the whole Qur'an", () => {
    expect(inScope({ kind: "quran" }, { s: 50, a: 1 })).toBe(true);
  });

  it("matches a surah and a juz", () => {
    expect(inScope({ kind: "surah", n: 2 }, { s: 2, a: 30 })).toBe(true);
    expect(inScope({ kind: "surah", n: 2 }, { s: 3, a: 30 })).toBe(false);
    // Juz' 2 starts at 2:142, so 2:141 is still Juz' 1.
    expect(inScope({ kind: "juz", n: 1 }, { s: 2, a: 141 })).toBe(true);
    expect(inScope({ kind: "juz", n: 2 }, { s: 2, a: 142 })).toBe(true);
  });

  it("splits Meccan from Medinan at revelation position 86", () => {
    // 96 (al-'Alaq) is first revealed; 110 (an-Nasr) is last-ish, Medinan.
    expect(CHRONOLOGICAL_ORDER_BY_SURAH[96 - 1]).toBe(1);
    expect(inScope({ kind: "revelation", value: "meccan" }, { s: 96, a: 1 })).toBe(true);
    expect(inScope({ kind: "revelation", value: "medinan" }, { s: 96, a: 1 })).toBe(false);
    const nasr = CHRONOLOGICAL_ORDER_BY_SURAH[110 - 1];
    expect(nasr).toBeGreaterThan(86);
    expect(inScope({ kind: "revelation", value: "medinan" }, { s: 110, a: 1 })).toBe(true);
  });

  it("reads a chronological window by revelation position, not surah number", () => {
    const early: Scope = { kind: "chrono", from: 1, to: 5 };
    expect(inScope(early, { s: 96, a: 1 })).toBe(true); // position 1
    expect(inScope(early, { s: 1, a: 1 })).toBe(true); // position 5
    expect(inScope(early, { s: 2, a: 1 })).toBe(false); // near the end
  });
});

describe("scope params", () => {
  it("round-trips every kind", () => {
    const scopes: Scope[] = [
      { kind: "quran" },
      { kind: "surah", n: 12 },
      { kind: "juz", n: 30 },
      { kind: "revelation", value: "meccan" },
      { kind: "revelation", value: "medinan" },
      { kind: "chrono", from: 1, to: 10 },
    ];
    for (const scope of scopes) {
      expect(scopeFromParam(scopeToParam(scope)), scopeToParam(scope)).toEqual(scope);
    }
  });

  it("rejects junk and out-of-range values rather than guessing", () => {
    for (const bad of [
      null,
      "",
      "surah:0",
      "surah:115",
      "juz:31",
      "chrono:10-1",
      "chrono:0-5",
      "nonsense",
    ]) {
      expect(scopeFromParam(bad), String(bad)).toBeNull();
    }
  });
});

describe("scopeToQcqlFilter", () => {
  it("expresses the scopes QCQL v1 can express", () => {
    expect(scopeToQcqlFilter({ kind: "quran" })).toBe("");
    expect(scopeToQcqlFilter({ kind: "surah", n: 12 })).toBe("surah = 12");
    expect(scopeToQcqlFilter({ kind: "revelation", value: "meccan" })).toBe("meccan");
    expect(scopeToQcqlFilter({ kind: "chrono", from: 1, to: 10 })).toBe(
      "chrono >= 1 & chrono <= 10",
    );
    expect(scopeToQcqlFilter({ kind: "chrono", from: 7, to: 7 })).toBe("chrono = 7");
  });

  it("returns null for a juz, which QCQL v1 cannot express", () => {
    // A juz cuts across surahs mid-surah; QCQL filters whole surahs. Better
    // to offer no query than one that quietly means something else.
    expect(scopeToQcqlFilter({ kind: "juz", n: 2 })).toBeNull();
  });
});
