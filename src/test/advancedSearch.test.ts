import { describe, expect, it } from "vitest";
import { filterOccurrences } from "@/lib/search/advancedSearch";
import type { MetaFile, OccurrenceIndexFile } from "@/lib/data/types";

const META: MetaFile = {
  surahs: [
    { n: 1, nameAr: "الفاتحة", nameEn: "Al-Fatihah", translit: "Al-Fatihah", type: "meccan", ayahs: 7 },
    { n: 2, nameAr: "البقرة", nameEn: "Al-Baqarah", translit: "Al-Baqarah", type: "medinan", ayahs: 286 },
  ],
};

// rootIdx 0 = "كتب", rootIdx 1 = "رحم"; lemmaIdx values are arbitrary but distinct.
const FILE: OccurrenceIndexFile = {
  cats: ["noun", "verb.perf", "adj"],
  rows: [
    [2, 2, 2, 0, 10, 0, 0], // noun, root كتب, surah 2 (medinan)
    [2, 79, 3, 0, 11, 1, 1], // verb.perf, Form I, root كتب, surah 2 (medinan)
    [1, 1, 3, 1, 12, 2, 0], // adj, root رحم, surah 1 (meccan)
    [2, 79, 5, 0, 13, 1, 4], // verb.perf, Form IV, root كتب, surah 2 (medinan)
  ],
};

describe("filterOccurrences", () => {
  it("returns every row when no filters are given", () => {
    expect(filterOccurrences(FILE, META, {})).toHaveLength(4);
  });

  it("filters by category", () => {
    const rows = filterOccurrences(FILE, META, { cats: new Set(["adj"]) });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ s: 1, a: 1, w: 3, cat: "adj" });
  });

  it("filters by verb form", () => {
    const rows = filterOccurrences(FILE, META, { verbForms: new Set([4]) });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ s: 2, a: 79, w: 5, verbForm: 4 });
  });

  it("filters by root index", () => {
    const rows = filterOccurrences(FILE, META, { rootIdxs: new Set([1]) });
    expect(rows).toHaveLength(1);
    expect(rows[0].rootIdx).toBe(1);
  });

  it("filters by surah", () => {
    const rows = filterOccurrences(FILE, META, { surahs: new Set([1]) });
    expect(rows).toHaveLength(1);
    expect(rows[0].s).toBe(1);
  });

  it("filters by Meccan/Medinan revelation type", () => {
    const meccan = filterOccurrences(FILE, META, { revelationType: "meccan" });
    expect(meccan).toHaveLength(1);
    expect(meccan[0].s).toBe(1);

    const medinan = filterOccurrences(FILE, META, { revelationType: "medinan" });
    expect(medinan).toHaveLength(3);
  });

  it("combines multiple facets with AND semantics", () => {
    const rows = filterOccurrences(FILE, META, {
      cats: new Set(["verb.perf"]),
      revelationType: "medinan",
      verbForms: new Set([4]),
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ s: 2, a: 79, w: 5 });
  });

  it("returns nothing when a facet matches no rows", () => {
    expect(filterOccurrences(FILE, META, { cats: new Set(["properNoun"]) })).toHaveLength(0);
  });
});
