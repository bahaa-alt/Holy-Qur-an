import { describe, expect, it } from "vitest";
import { buildArabicSuggestions, buildBuckwalterSuggestions, rootHref, verseHref, wordHref } from "@/lib/search/suggest";
import type { FormsEntry, IndexFile, IndexLemmaRow } from "@/lib/data/types";

// A small synthetic index: roots كتب (bw ktb) and رحم (bw rHm), one rooted
// lemma each, plus a rootless lemma "الذين".
const INDEX: IndexFile = {
  roots: [
    { ar: "رحم", key: "رحم", bw: "rHm", count: 339, lemmaCount: 2, verseCount: 300, glossShort: "Mercy." },
    { ar: "كتب", key: "كتب", bw: "ktb", count: 319, lemmaCount: 2, verseCount: 250, glossShort: "To write." },
  ].sort((a, b) => a.key.localeCompare(b.key)),
  lemmas: [
    { lemma: "كِتاب", key: "كتاب", rootIdx: -1, count: 260, cat: "noun" }, // rootIdx fixed below
    { lemma: "كَتَبَ", key: "كتب", rootIdx: -1, count: 59, cat: "verb.perf" },
    { lemma: "الذين", key: "الذين", rootIdx: -1, count: 1468, cat: "other" },
  ].sort((a, b) => a.key.localeCompare(b.key)) as IndexLemmaRow[],
};
// fix up rootIdx now that both arrays are sorted
const rahmIdx = INDEX.roots.findIndex((r) => r.ar === "رحم");
const katabaIdx = INDEX.roots.findIndex((r) => r.ar === "كتب");
for (const l of INDEX.lemmas) {
  if (l.lemma === "كِتاب" || l.lemma === "كَتَبَ") l.rootIdx = katabaIdx;
}
void rahmIdx;

const kitabuLemmaIdx = INDEX.lemmas.findIndex((l) => l.lemma === "كِتاب");
const FORMS: FormsEntry[] = [
  { key: "كتب", altKey: null, rootIdx: katabaIdx, lemmaIdx: kitabuLemmaIdx, count: 97 },
].sort((a, b) => a.key.localeCompare(b.key));

describe("buildArabicSuggestions", () => {
  it("matches a root by its normalized key", () => {
    const results = buildArabicSuggestions("كتب", INDEX, FORMS);
    expect(results.some((s) => s.kind === "root" && s.primary === "كتب")).toBe(true);
  });

  it("matches a root when the query is diacritized", () => {
    const results = buildArabicSuggestions("كِتْب", INDEX, FORMS);
    expect(results.some((s) => s.kind === "root" && s.primary === "كتب")).toBe(true);
  });

  it("matches a lemma directly", () => {
    const results = buildArabicSuggestions("الذين", INDEX, FORMS);
    expect(results.some((s) => s.kind === "lemma" && s.primary === "الذين")).toBe(true);
  });

  it("resolves a matched surface form to its owning lemma, not raw text", () => {
    // "كتب" as a query also matches the كِتَٰبُ form (key "كتب"); the
    // suggestion should surface the LEMMA كِتاب, deduped against the direct
    // lemma match for the same lemma index.
    const results = buildArabicSuggestions("كتب", INDEX, FORMS);
    const lemmaHits = results.filter((s) => s.kind === "lemma" && s.primary === "كِتاب");
    expect(lemmaHits).toHaveLength(1);
  });

  it("includes root info as the secondary line for a rooted lemma", () => {
    const results = buildArabicSuggestions("كتاب", INDEX, FORMS);
    const hit = results.find((s) => s.primary === "كِتاب")!;
    expect(hit.secondary).toBe("root كتب");
  });

  it("returns an empty array for an empty query", () => {
    expect(buildArabicSuggestions("", INDEX, FORMS)).toEqual([]);
  });

  it("returns nothing for a prefix that matches nothing", () => {
    expect(buildArabicSuggestions("زلزل", INDEX, FORMS)).toEqual([]);
  });
});

describe("buildBuckwalterSuggestions", () => {
  it("matches a root by Buckwalter prefix", () => {
    const results = buildBuckwalterSuggestions("ktb", INDEX);
    expect(results).toHaveLength(1);
    expect(results[0].primary).toBe("كتب");
  });

  it("is case-insensitive", () => {
    expect(buildBuckwalterSuggestions("KTB", INDEX)).toHaveLength(1);
  });

  it("returns nothing for a non-matching prefix", () => {
    expect(buildBuckwalterSuggestions("xyz", INDEX)).toEqual([]);
  });
});

describe("href builders", () => {
  it("builds a root href", () => {
    expect(rootHref("كتب")).toBe(`/root/${encodeURIComponent("كتب")}/`);
  });

  it("builds a word href from a global lemma index", () => {
    expect(wordHref(42)).toBe("/word/42/");
  });

  it("builds a verse href with an ayah query param", () => {
    expect(verseHref(2, 255)).toBe("/surah/2/?ayah=255");
  });
});
