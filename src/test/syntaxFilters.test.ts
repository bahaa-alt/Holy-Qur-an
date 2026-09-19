import { describe, expect, it } from "vitest";
import { buildSyntaxLookups, filterOccurrences } from "@/lib/search/advancedSearch";
import type { MetaFile, OccurrenceIndexFile, SyntaxIndexFile } from "@/lib/data/types";

/**
 * 2:1 — word 1 is a rooted PASSIVE verb, word 2 a rooted active verb.
 * 2:2 — word 1 a rootless RES particle, word 2 a rooted active verb.
 * 3:1 — nothing tagged at all.
 */
const syntax: SyntaxIndexFile = {
  tags: ["NEG", "PASS", "RES"],
  s: [2, 2, 2],
  a: [1, 2, 2],
  w: [1, 1, 1],
  g: [1, 1, 2],
  t: [1, 2, 0], // PASS at 2:1:1, RES at 2:2:1 seg1, NEG at 2:2:1 seg2
};

const occurrences: OccurrenceIndexFile = {
  cats: ["verb.perf"],
  rows: [
    [2, 1, 1, 0, 0, 0, 1], // the passive verb
    [2, 1, 2, 0, 0, 0, 1], // an active verb in the same verse
    [2, 2, 2, 0, 0, 0, 1], // a verb in the verse that has RES/NEG on word 1
    [3, 1, 1, 0, 0, 0, 1], // a verb in an untagged verse
  ],
};

const meta: MetaFile = {
  surahs: [
    { n: 2, nameAr: "", nameEn: "", translit: "", type: "medinan", ayahs: 286 },
    { n: 3, nameAr: "", nameEn: "", translit: "", type: "medinan", ayahs: 200 },
  ],
};

const lookups = buildSyntaxLookups(syntax);
const at = (rows: { s: number; a: number; w: number }[]) => rows.map((r) => `${r.s}:${r.a}:${r.w}`);

describe("buildSyntaxLookups", () => {
  it("indexes a word's own tags by surah:ayah:word", () => {
    expect(lookups.byWord.get("2:1:1")).toEqual(new Set(["PASS"]));
  });

  it("collects every tag on a word, even across its segments", () => {
    // 2:2:1 is one word whose two segments carry RES and NEG.
    expect(lookups.byWord.get("2:2:1")).toEqual(new Set(["RES", "NEG"]));
  });

  it("indexes a verse's tags by surah:ayah, pooled across its words", () => {
    expect(lookups.byVerse.get("2:2")).toEqual(new Set(["RES", "NEG"]));
    expect(lookups.byVerse.get("2:1")).toEqual(new Set(["PASS"]));
  });

  it("has no entry for an untagged word or verse", () => {
    expect(lookups.byWord.get("3:1:1")).toBeUndefined();
    expect(lookups.byVerse.get("3:1")).toBeUndefined();
  });
});

describe("filterOccurrences with syntax facets", () => {
  it("returns everything when neither syntax facet is set", () => {
    expect(filterOccurrences(occurrences, meta, {})).toHaveLength(4);
  });

  it("wordSyntaxTags matches only the occurrence's OWN word", () => {
    const rows = filterOccurrences(occurrences, meta, {
      syntax: lookups,
      wordSyntaxTags: new Set(["PASS"]),
    });
    expect(at(rows)).toEqual(["2:1:1"]);
  });

  it("verseSyntaxTags matches any occurrence in a verse carrying the tag", () => {
    const rows = filterOccurrences(occurrences, meta, {
      syntax: lookups,
      verseSyntaxTags: new Set(["PASS"]),
    });
    // Both words of 2:1, because the VERSE contains a passive — including
    // the active verb at 2:1:2. This is the distinction the two facets exist
    // to keep apart.
    expect(at(rows)).toEqual(["2:1:1", "2:1:2"]);
  });

  it("verseSyntaxTags finds an occurrence whose own word is untagged", () => {
    const rows = filterOccurrences(occurrences, meta, {
      syntax: lookups,
      verseSyntaxTags: new Set(["RES"]),
    });
    // 2:2:2 is a rooted verb; the RES particle is on word 1, which is
    // rootless and has no occurrence row of its own. Finding this verb is
    // exactly what the verse-scope facet is for.
    expect(at(rows)).toEqual(["2:2:2"]);
    expect(
      filterOccurrences(occurrences, meta, { syntax: lookups, wordSyntaxTags: new Set(["RES"]) }),
    ).toEqual([]);
  });

  it("treats multiple selected tags as OR within a facet", () => {
    const rows = filterOccurrences(occurrences, meta, {
      syntax: lookups,
      verseSyntaxTags: new Set(["PASS", "RES"]),
    });
    expect(at(rows)).toEqual(["2:1:1", "2:1:2", "2:2:2"]);
  });

  it("ANDs the two syntax facets with each other", () => {
    const rows = filterOccurrences(occurrences, meta, {
      syntax: lookups,
      wordSyntaxTags: new Set(["PASS"]),
      verseSyntaxTags: new Set(["RES"]),
    });
    // No occurrence is both a passive word and in a verse containing RES.
    expect(rows).toEqual([]);
  });

  it("ANDs the syntax facets with the existing ones", () => {
    const rows = filterOccurrences(occurrences, meta, {
      syntax: lookups,
      verseSyntaxTags: new Set(["PASS"]),
      surahs: new Set([3]),
    });
    expect(rows).toEqual([]);
  });

  it("filters nothing when a syntax facet is set but no lookups were supplied", () => {
    // Defensive: the index is fetched lazily, so the UI can hold a selected
    // tag before the data lands. That must not silently return zero rows and
    // read as "no matches".
    const rows = filterOccurrences(occurrences, meta, { wordSyntaxTags: new Set(["PASS"]) });
    expect(rows).toHaveLength(4);
  });

  it("ignores an empty facet set, same as the other facets", () => {
    const rows = filterOccurrences(occurrences, meta, {
      syntax: lookups,
      wordSyntaxTags: new Set(),
      verseSyntaxTags: new Set(),
    });
    expect(rows).toHaveLength(4);
  });
});
