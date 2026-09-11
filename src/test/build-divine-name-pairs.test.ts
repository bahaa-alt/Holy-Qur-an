import { describe, expect, it } from "vitest";
import { buildDivineNamePairs } from "../../scripts/lib/build-divine-name-pairs";
import type { IndexLemmaRow, IndexRootRow, OccurrenceIndexFile } from "@/lib/data/types";
import type { TopicDefinition } from "@/lib/topics/topicDefinitions";

// Two roots, three lemmas: رحم has two distinct name lemmas (رحمن, رحيم);
// علم has one (عليم) plus an unrelated lemma (علم the noun "knowledge",
// same root but never referenced by any topic below).
const INDEX_ROOTS: IndexRootRow[] = [
  { ar: "رحم", key: "رحم", bw: "rHm", count: 0, lemmaCount: 0, verseCount: 0, glossShort: "" }, // 0
  { ar: "علم", key: "علم", bw: "Elm", count: 0, lemmaCount: 0, verseCount: 0, glossShort: "" }, // 1
  { ar: "صمد", key: "صمد", bw: "Smd", count: 0, lemmaCount: 0, verseCount: 0, glossShort: "" }, // 2
];
const INDEX_LEMMAS: IndexLemmaRow[] = [
  { lemma: "رَحْمٰن", key: "رحمن", rootIdx: 0, count: 0, cat: "adj" }, // 0
  { lemma: "رَحِيم", key: "رحيم", rootIdx: 0, count: 0, cat: "adj" }, // 1
  { lemma: "عَلِيم", key: "عليم", rootIdx: 1, count: 0, cat: "adj" }, // 2
  { lemma: "عِلْم", key: "علم", rootIdx: 1, count: 0, cat: "noun" }, // 3 (unrelated sense, same root)
  { lemma: "صَمَد", key: "صمد", rootIdx: 2, count: 0, cat: "noun" }, // 4
];

const TOPICS: TopicDefinition[] = [
  { slug: "ar-rahman", labelEn: "Ar-Rahman", labelAr: "الرحمن", category: "divineName", sources: [{ kind: "rootedLemma", root: "رحم", lemmaKey: "رحمن" }] },
  { slug: "ar-raheem", labelEn: "Ar-Raheem", labelAr: "الرحيم", category: "divineName", sources: [{ kind: "rootedLemma", root: "رحم", lemmaKey: "رحيم" }] },
  { slug: "al-alim", labelEn: "Al-Alim", labelAr: "العليم", category: "divineName", sources: [{ kind: "rootedLemma", root: "علم", lemmaKey: "عليم" }] },
  { slug: "as-samad", labelEn: "As-Samad", labelAr: "الصمد", category: "divineName", sources: [{ kind: "root", root: "صمد" }] },
];

function occFile(rows: OccurrenceIndexFile["rows"]): OccurrenceIndexFile {
  return { cats: [], rows };
}

describe("buildDivineNamePairs", () => {
  it("counts an adjacent pair of two different names and records its ref", () => {
    // 1:1: word 3 = الرحمن (رحم/رحمن), word 4 = الرحيم (رحم/رحيم) -- adjacent.
    const occ = occFile([
      [1, 1, 3, 0, 0, 0, 0],
      [1, 1, 4, 0, 1, 0, 0],
    ]);
    const result = buildDivineNamePairs(occ, INDEX_ROOTS, INDEX_LEMMAS, TOPICS);
    expect(result.pairs).toEqual([{ aSlug: "ar-rahman", bSlug: "ar-raheem", count: 1, refs: [{ s: 1, a: 1, w: 3 }] }]);
  });

  it("excludes two rooted words that are not adjacent (a gap in word index)", () => {
    // word 3 and word 5 -- a rootless word (or anything) must occupy word 4.
    const occ = occFile([
      [1, 1, 3, 0, 0, 0, 0],
      [1, 1, 5, 0, 1, 0, 0],
    ]);
    const result = buildDivineNamePairs(occ, INDEX_ROOTS, INDEX_LEMMAS, TOPICS);
    expect(result.pairs).toEqual([]);
  });

  it("excludes a pair spanning two different verses despite consecutive rows", () => {
    const occ = occFile([
      [1, 1, 6, 0, 0, 0, 0],
      [1, 2, 1, 0, 1, 0, 0],
    ]);
    const result = buildDivineNamePairs(occ, INDEX_ROOTS, INDEX_LEMMAS, TOPICS);
    expect(result.pairs).toEqual([]);
  });

  it("excludes a rooted word whose lemma isn't one of the curated names, even if the root matches", () => {
    // عليم (name) followed by علم-the-noun (same root, unrelated lemma, no topic).
    const occ = occFile([
      [1, 1, 1, 1, 2, 0, 0],
      [1, 1, 2, 1, 3, 0, 0],
    ]);
    const result = buildDivineNamePairs(occ, INDEX_ROOTS, INDEX_LEMMAS, TOPICS);
    expect(result.pairs).toEqual([]);
  });

  it("matches a whole-root source (As-Samad) regardless of which lemma under that root occurs", () => {
    const occ = occFile([
      [1, 1, 1, 1, 2, 0, 0], // العليم
      [1, 1, 2, 2, 4, 0, 0], // الصمد (root-only source)
    ]);
    const result = buildDivineNamePairs(occ, INDEX_ROOTS, INDEX_LEMMAS, TOPICS);
    expect(result.pairs).toEqual([{ aSlug: "al-alim", bSlug: "as-samad", count: 1, refs: [{ s: 1, a: 1, w: 1 }] }]);
  });

  it("excludes a name immediately followed by itself", () => {
    const occ = occFile([
      [1, 1, 1, 0, 0, 0, 0],
      [1, 1, 2, 0, 0, 0, 0],
    ]);
    const result = buildDivineNamePairs(occ, INDEX_ROOTS, INDEX_LEMMAS, TOPICS);
    expect(result.pairs).toEqual([]);
  });

  it("aggregates repeated occurrences of the same ordered pair across verses, sorted by count desc", () => {
    const occ = occFile([
      [1, 1, 3, 0, 0, 0, 0],
      [1, 1, 4, 0, 1, 0, 0],
      [1, 2, 1, 0, 0, 0, 0],
      [1, 2, 2, 0, 1, 0, 0],
      [2, 1, 1, 1, 2, 0, 0],
      [2, 1, 2, 2, 4, 0, 0],
    ]);
    const result = buildDivineNamePairs(occ, INDEX_ROOTS, INDEX_LEMMAS, TOPICS);
    expect(result.pairs[0]).toMatchObject({ aSlug: "ar-rahman", bSlug: "ar-raheem", count: 2 });
    expect(result.pairs[0].refs).toEqual([
      { s: 1, a: 1, w: 3 },
      { s: 1, a: 2, w: 1 },
    ]);
    expect(result.pairs[1]).toMatchObject({ aSlug: "al-alim", bSlug: "as-samad", count: 1 });
  });
});
