import { describe, expect, it } from "vitest";
import {
  EXTERNAL_TAFSIR_SOURCES,
  externalTafsirMeta,
  isExternalTafsirSlug,
  mapExternalTafsirRows,
} from "@/lib/tafsir/externalSources";

describe("mapExternalTafsirRows", () => {
  it("maps ayah/text rows into the app's entries shape, sorted by ayah", () => {
    const file = mapExternalTafsirRows("tafsir-al-razi", 112, [
      { surah: 112, ayah: 2, text: "second" },
      { surah: 112, ayah: 1, text: "first" },
    ]);
    expect(file).toEqual({
      slug: "tafsir-al-razi",
      n: 112,
      entries: [
        { a: 1, t: "first" },
        { a: 2, t: "second" },
      ],
    });
  });

  it("drops a row for a different surah", () => {
    const file = mapExternalTafsirRows("tafsir-al-razi", 112, [
      { surah: 112, ayah: 1, text: "in scope" },
      { surah: 2, ayah: 1, text: "wrong surah" },
    ]);
    expect(file.entries).toEqual([{ a: 1, t: "in scope" }]);
  });

  it("drops a row whose text is empty or all whitespace", () => {
    const file = mapExternalTafsirRows("tafsir-al-razi", 112, [
      { surah: 112, ayah: 1, text: "" },
      { surah: 112, ayah: 2, text: "   " },
      { surah: 112, ayah: 3, text: "kept" },
    ]);
    expect(file.entries).toEqual([{ a: 3, t: "kept" }]);
  });

  it("trims surrounding whitespace from kept text", () => {
    const file = mapExternalTafsirRows("tafsir-al-razi", 112, [
      { surah: 112, ayah: 1, text: "  padded  " },
    ]);
    expect(file.entries).toEqual([{ a: 1, t: "padded" }]);
  });
});

describe("externalTafsirMeta / isExternalTafsirSlug", () => {
  it("recognizes every configured external source's slug, and rejects an unrelated one", () => {
    for (const source of EXTERNAL_TAFSIR_SOURCES) {
      expect(isExternalTafsirSlug(source.slug)).toBe(true);
    }
    expect(isExternalTafsirSlug("jalalayn")).toBe(false);
  });

  it("returns provenance fields without coverage counts for an external source", () => {
    const meta = externalTafsirMeta(EXTERNAL_TAFSIR_SOURCES[0].slug);
    expect(meta.slug).toBe(EXTERNAL_TAFSIR_SOURCES[0].slug);
    expect(meta.name).toBe(EXTERNAL_TAFSIR_SOURCES[0].name);
    expect(meta.coveredVerses).toBeUndefined();
    expect(meta.totalVerses).toBeUndefined();
  });

  it("throws for an unknown slug", () => {
    expect(() => externalTafsirMeta("not-a-real-slug")).toThrow();
  });
});
