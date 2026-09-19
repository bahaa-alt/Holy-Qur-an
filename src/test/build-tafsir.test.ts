import { describe, expect, it } from "vitest";
import { TAFSIR_SLUG, buildTafsir, type RawTafsirRow } from "../../scripts/lib/build-tafsir";

/** Surah 1 has 3 verses here, surah 2 has 2. */
const versesPerSurah = new Map([
  [1, [1, 2, 3]],
  [2, [1, 2]],
]);

function rows(...r: [number, number, string][]): RawTafsirRow[] {
  return r.map(([surah, ayah, text]) => ({ surah, ayah, text }));
}

const FULL = new Map([
  [1, rows([1, 1, "أ"], [1, 2, "ب"], [1, 3, "ج"])],
  [2, rows([2, 1, "د"], [2, 2, "ه"])],
]);

describe("buildTafsir", () => {
  it("shards by surah, keyed by ayah", () => {
    const { files } = buildTafsir(FULL, versesPerSurah);
    expect(files.get(1)).toEqual({
      slug: TAFSIR_SLUG,
      n: 1,
      entries: [
        { a: 1, t: "أ" },
        { a: 2, t: "ب" },
        { a: 3, t: "ج" },
      ],
    });
  });

  it("omits a verse with no entry rather than carrying the previous note forward", () => {
    // The gap is the point: al-Jalalayn has no separate note for 226 verses,
    // 32 of them surah 55's repeated refrain. Filling the hole from a
    // neighbour would attribute a comment he did not make.
    const gappy = new Map([
      [1, rows([1, 1, "أ"], [1, 3, "ج"])],
      [2, rows([2, 1, "د"], [2, 2, "ه"])],
    ]);
    const { files } = buildTafsir(gappy, versesPerSurah);
    expect(files.get(1)!.entries.map((e) => e.a)).toEqual([1, 3]);
  });

  it("reports real coverage rather than assuming completeness", () => {
    const gappy = new Map([
      [1, rows([1, 1, "أ"], [1, 3, "ج"])],
      [2, rows([2, 1, "د"], [2, 2, "ه"])],
    ]);
    const { meta } = buildTafsir(gappy, versesPerSurah);
    expect(meta.coveredVerses).toBe(4);
    expect(meta.totalVerses).toBe(5);
  });

  it("drops a blank entry instead of rendering an empty commentary", () => {
    const blank = new Map([
      [1, rows([1, 1, "أ"], [1, 2, "   "], [1, 3, "ج"])],
      [2, rows([2, 1, "د"], [2, 2, "ه"])],
    ]);
    const { files, meta } = buildTafsir(blank, versesPerSurah);
    expect(files.get(1)!.entries.map((e) => e.a)).toEqual([1, 3]);
    expect(meta.coveredVerses).toBe(4);
  });

  it("trims surrounding whitespace", () => {
    const padded = new Map([
      [1, rows([1, 1, "  أ  "], [1, 2, "ب"], [1, 3, "ج"])],
      [2, rows([2, 1, "د"], [2, 2, "ه"])],
    ]);
    expect(buildTafsir(padded, versesPerSurah).files.get(1)!.entries[0].t).toBe("أ");
  });

  it("sorts entries by ayah regardless of source order", () => {
    const shuffled = new Map([
      [1, rows([1, 3, "ج"], [1, 1, "أ"], [1, 2, "ب"])],
      [2, rows([2, 1, "د"], [2, 2, "ه"])],
    ]);
    expect(
      buildTafsir(shuffled, versesPerSurah)
        .files.get(1)!
        .entries.map((e) => e.a),
    ).toEqual([1, 2, 3]);
  });

  it("throws on an entry for a verse this corpus does not have", () => {
    const overrun = new Map([
      [1, rows([1, 1, "أ"], [1, 4, "؟"])],
      [2, rows([2, 1, "د"], [2, 2, "ه"])],
    ]);
    expect(() => buildTafsir(overrun, versesPerSurah)).toThrow(/1:4 is not a verse of surah 1/);
  });

  it("throws when a file carries a row for a different surah", () => {
    const crossed = new Map([
      [1, rows([1, 1, "أ"], [2, 1, "؟"])],
      [2, rows([2, 1, "د"], [2, 2, "ه"])],
    ]);
    expect(() => buildTafsir(crossed, versesPerSurah)).toThrow(/contains a row for surah 2/);
  });

  it("throws on a duplicate entry rather than silently keeping one", () => {
    const dup = new Map([
      [1, rows([1, 1, "أ"], [1, 1, "آخر"])],
      [2, rows([2, 1, "د"], [2, 2, "ه"])],
    ]);
    expect(() => buildTafsir(dup, versesPerSurah)).toThrow(/duplicate entry for 1:1/);
  });

  it("throws when a surah's file is missing entirely", () => {
    const partial = new Map([[1, rows([1, 1, "أ"])]]);
    expect(() => buildTafsir(partial, versesPerSurah)).toThrow(/no tafsir file for surah 2/);
  });

  it("names the commentary and its authors, in both languages", () => {
    const { meta } = buildTafsir(FULL, versesPerSurah);
    expect(meta.name).toContain("Jalalayn");
    expect(meta.nameAr.length).toBeGreaterThan(0);
    expect(meta.authors).toContain("Suyuti");
    expect(meta.authorsAr.length).toBeGreaterThan(0);
  });
});
