import { describe, expect, it } from "vitest";
import { buildInterlinearGloss } from "@/lib/word/formatInterlinearGloss";
import type { WordLookupResult } from "@/lib/word/lookupWordInfo";

describe("buildInterlinearGloss", () => {
  it("extracts root/lemma/category for a found word", () => {
    const result: WordLookupResult = {
      status: "found",
      info: {
        rootAr: "كتب",
        rootBw: "ktb",
        rootGlossShort: "to write",
        rootTotal: 319,
        lemma: "كِتاب",
        lemmaKey: "كتاب",
        lemmaCount: 230,
        globalLemmaIdx: 42,
        cat: "noun",
        formCount: 10,
        tagsJoined: "N|MS|GEN",
      },
    };
    expect(buildInterlinearGloss(result, "Noun")).toEqual({ root: "كتب", lemma: "كِتاب", cat: "Noun" });
  });

  it("returns all-null for a not-rooted word", () => {
    const result: WordLookupResult = { status: "not-rooted" };
    expect(buildInterlinearGloss(result, "Noun")).toEqual({ root: null, lemma: null, cat: null });
  });
});
