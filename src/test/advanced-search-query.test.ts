import { describe, expect, it } from "vitest";
import { decodeAdvancedSearchQuery, encodeAdvancedSearchQuery } from "@/lib/search/advancedSearchQuery";
import type { Cat } from "@/lib/data/types";

const VALID_CATS = new Set<Cat>(["noun", "verb.perf", "verb.impf"]);

describe("encodeAdvancedSearchQuery", () => {
  it("produces an empty string for all-default filters", () => {
    expect(
      encodeAdvancedSearchQuery({
        cats: [],
        verbForms: [],
        revelation: "all",
        rootAr: null,
        surahFrom: 1,
        surahTo: 114,
        page: 0,
      }),
    ).toBe("");
  });

  it("only includes non-default fields", () => {
    const query = encodeAdvancedSearchQuery({
      cats: ["noun", "verb.perf"],
      verbForms: [1, 4],
      revelation: "meccan",
      rootAr: "كتب",
      surahFrom: 2,
      surahTo: 10,
      page: 3,
    });
    const params = new URLSearchParams(query);
    expect(params.get("cats")).toBe("noun,verb.perf");
    expect(params.get("forms")).toBe("1,4");
    expect(params.get("rev")).toBe("meccan");
    expect(params.get("root")).toBe("كتب");
    expect(params.get("from")).toBe("2");
    expect(params.get("to")).toBe("10");
    expect(params.get("page")).toBe("3");
  });
});

describe("decodeAdvancedSearchQuery", () => {
  it("returns all defaults for an empty query", () => {
    expect(decodeAdvancedSearchQuery("", VALID_CATS)).toEqual({
      cats: [],
      verbForms: [],
      revelation: "all",
      rootAr: null,
      surahFrom: 1,
      surahTo: 114,
      page: 0,
    });
  });

  it("round-trips a full filter state, including a root with no comma/encoding hazards", () => {
    const original = {
      cats: ["noun", "verb.perf"] as Cat[],
      verbForms: [1, 4],
      revelation: "medinan" as const,
      rootAr: "أمن",
      surahFrom: 5,
      surahTo: 20,
      page: 2,
    };
    const decoded = decodeAdvancedSearchQuery(encodeAdvancedSearchQuery(original), VALID_CATS);
    expect(decoded).toEqual(original);
  });

  it("drops a category not in the valid set", () => {
    const decoded = decodeAdvancedSearchQuery("cats=noun,bogusCat", VALID_CATS);
    expect(decoded.cats).toEqual(["noun"]);
  });

  it("drops a malformed or out-of-range verb Form", () => {
    const decoded = decodeAdvancedSearchQuery("forms=1,99,abc,4", VALID_CATS);
    expect(decoded.verbForms).toEqual([1, 4]);
  });

  it("falls back to 'all' for an invalid revelation value", () => {
    expect(decodeAdvancedSearchQuery("rev=bogus", VALID_CATS).revelation).toBe("all");
  });

  it("falls back to the full 1-114 range for an out-of-range or non-numeric surah bound", () => {
    expect(decodeAdvancedSearchQuery("from=0&to=200", VALID_CATS)).toMatchObject({ surahFrom: 1, surahTo: 114 });
    expect(decodeAdvancedSearchQuery("from=abc", VALID_CATS)).toMatchObject({ surahFrom: 1 });
  });

  it("falls back to page 0 for a negative or non-numeric page", () => {
    expect(decodeAdvancedSearchQuery("page=-1", VALID_CATS).page).toBe(0);
    expect(decodeAdvancedSearchQuery("page=abc", VALID_CATS).page).toBe(0);
  });
});
