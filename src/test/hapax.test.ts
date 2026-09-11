import { describe, expect, it } from "vitest";
import { getHapaxLemmas, getHapaxRoots } from "@/lib/insights/hapax";
import type { IndexFile } from "@/lib/data/types";

const INDEX: IndexFile = {
  roots: [
    { ar: "كتب", key: "كتب", bw: "ktb", count: 319, lemmaCount: 3, verseCount: 200, glossShort: "" },
    { ar: "أبب", key: "ابب", bw: "Abb", count: 1, lemmaCount: 1, verseCount: 1, glossShort: "" },
    { ar: "نحت", key: "نحت", bw: "nHt", count: 1, lemmaCount: 1, verseCount: 1, glossShort: "" },
  ],
  lemmas: [
    { lemma: "كِتَاب", key: "كتاب", rootIdx: 0, count: 200, cat: "noun" },
    { lemma: "أَبّ", key: "اب", rootIdx: 1, count: 1, cat: "noun" },
    { lemma: "تَنْحِتُونَ", key: "تنحتون", rootIdx: 2, count: 1, cat: "verb.impf" },
    { lemma: "مِن", key: "من", rootIdx: -1, count: 500, cat: "other" },
  ],
};

describe("getHapaxRoots", () => {
  it("returns only roots with count exactly 1", () => {
    expect(getHapaxRoots(INDEX).map((r) => r.ar)).toEqual(["أبب", "نحت"]);
  });

  it("returns an empty array when nothing qualifies", () => {
    const noHapax: IndexFile = { roots: [INDEX.roots[0]], lemmas: [] };
    expect(getHapaxRoots(noHapax)).toEqual([]);
  });
});

describe("getHapaxLemmas", () => {
  it("returns only lemmas with count exactly 1, each carrying its wordIdx", () => {
    expect(getHapaxLemmas(INDEX)).toEqual([
      { lemma: "أَبّ", key: "اب", rootIdx: 1, count: 1, cat: "noun", wordIdx: 1 },
      { lemma: "تَنْحِتُونَ", key: "تنحتون", rootIdx: 2, count: 1, cat: "verb.impf", wordIdx: 2 },
    ]);
  });

  it("includes rootless hapax lemmas the same way as rooted ones", () => {
    const withRootlessHapax: IndexFile = {
      roots: [],
      lemmas: [{ lemma: "هَيْتَ", key: "هيت", rootIdx: -1, count: 1, cat: "other" }],
    };
    expect(getHapaxLemmas(withRootlessHapax)).toEqual([
      { lemma: "هَيْتَ", key: "هيت", rootIdx: -1, count: 1, cat: "other", wordIdx: 0 },
    ]);
  });
});
