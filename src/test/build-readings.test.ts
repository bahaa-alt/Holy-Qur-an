import { describe, expect, it } from "vitest";
import { RIWAYAT, buildReadings, type RawEdition } from "../../scripts/lib/build-readings";

function edition(rows: [number, number, string][]): RawEdition {
  return { quran: rows.map(([chapter, verse, text]) => ({ chapter, verse, text })) };
}

/** Surah 1 has 2 verses, surah 2 has 1, in this miniature corpus. */
const versesPerSurah = new Map([
  [1, [1, 2]],
  [2, [1]],
]);

function allEditions(rows: [number, number, string][]) {
  return new Map(RIWAYAT.map((r) => [r.slug, edition(rows)]));
}

const GOOD: [number, number, string][] = [
  [1, 1, "بِسْمِ"],
  [1, 2, "مَلِكِ"],
  [2, 1, "الٓمٓ"],
];

describe("RIWAYAT", () => {
  it("ships the seven non-Hafs transmissions", () => {
    expect(RIWAYAT).toHaveLength(7);
    expect(RIWAYAT.map((r) => r.slug).sort()).toEqual(
      ["bazzi", "doori", "qaloon", "qumbul", "shouba", "soosi", "warsh"].sort(),
    );
  });

  it("does not include Hafs, which is the app's base text", () => {
    expect(RIWAYAT.map((r) => r.slug)).not.toContain("hafs");
    expect(RIWAYAT.map((r) => r.riwaya)).not.toContain("Hafs");
  });

  it("names a qari for every riwaya, in both languages", () => {
    for (const r of RIWAYAT) {
      expect(r.qari.length, r.slug).toBeGreaterThan(0);
      expect(r.qariAr.length, r.slug).toBeGreaterThan(0);
      expect(r.riwayaAr.length, r.slug).toBeGreaterThan(0);
    }
  });

  it("pairs the two transmitters each qari is known through", () => {
    const byQari = new Map<string, string[]>();
    for (const r of RIWAYAT) byQari.set(r.qari, [...(byQari.get(r.qari) ?? []), r.slug]);
    // Three of the four readers here are represented by both their rawis;
    // 'Asim's other rawi is Hafs, which is the base text.
    expect(byQari.get("Nafi' al-Madani")).toHaveLength(2);
    expect(byQari.get("Ibn Kathir al-Makki")).toHaveLength(2);
    expect(byQari.get("Abu 'Amr al-Basri")).toHaveLength(2);
    expect(byQari.get("'Asim al-Kufi")).toEqual(["shouba"]);
  });
});

describe("buildReadings", () => {
  it("emits one file per riwaya per surah", () => {
    const { files } = buildReadings(allEditions(GOOD), versesPerSurah);
    expect(files.size).toBe(RIWAYAT.length * 2);
    expect(files.get("warsh/1")).toEqual({
      slug: "warsh",
      n: 1,
      verses: [
        { a: 1, t: "بِسْمِ" },
        { a: 2, t: "مَلِكِ" },
      ],
    });
  });

  it("orders verses by the base corpus's own ayah list, not the source's row order", () => {
    const shuffled: [number, number, string][] = [
      [1, 2, "مَلِكِ"],
      [2, 1, "الٓمٓ"],
      [1, 1, "بِسْمِ"],
    ];
    const { files } = buildReadings(allEditions(shuffled), versesPerSurah);
    expect(files.get("warsh/1")!.verses.map((v) => v.a)).toEqual([1, 2]);
  });

  it("returns metadata for every riwaya", () => {
    const { meta } = buildReadings(allEditions(GOOD), versesPerSurah);
    expect(meta.riwayat.map((r) => r.slug)).toEqual(RIWAYAT.map((r) => r.slug));
  });

  it("throws when an edition's verse count disagrees with the base corpus", () => {
    // These editions are re-segmented onto Hafs verse boundaries upstream, so
    // a disagreement means the join is no longer meaningful -- it must fail
    // the build rather than silently pair up mismatched verses.
    const short: [number, number, string][] = [
      [1, 1, "بِسْمِ"],
      [2, 1, "الٓمٓ"],
    ];
    expect(() => buildReadings(allEditions(short), versesPerSurah)).toThrow(
      /has 1 verses, base corpus has 2/,
    );
  });

  it("throws when a specific verse is missing rather than emitting a hole", () => {
    const wrongAyah: [number, number, string][] = [
      [1, 1, "بِسْمِ"],
      [1, 3, "؟"],
      [2, 1, "الٓمٓ"],
    ];
    expect(() => buildReadings(allEditions(wrongAyah), versesPerSurah)).toThrow(/missing 1:2/);
  });

  it("throws when a whole surah is absent", () => {
    const noSurah2: [number, number, string][] = [
      [1, 1, "بِسْمِ"],
      [1, 2, "مَلِكِ"],
    ];
    expect(() => buildReadings(allEditions(noSurah2), versesPerSurah)).toThrow(/no surah 2/);
  });

  it("throws when an edition was never fetched", () => {
    const missing = new Map(allEditions(GOOD));
    missing.delete("warsh");
    expect(() => buildReadings(missing, versesPerSurah)).toThrow(/no edition fetched for "warsh"/);
  });
});
