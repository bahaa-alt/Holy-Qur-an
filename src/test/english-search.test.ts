import { describe, expect, it } from "vitest";
import { buildEnIndex } from "../../scripts/lib/build-en-index";
import { searchEnglish, searchGlossText } from "@/lib/search/english";

const VERSES = [
  { globalId: 0, translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful" },
  { globalId: 1, translation: "[All] praise is [due] to Allah, Lord of the worlds" },
  { globalId: 2, translation: "The Entirely Merciful, the Especially Merciful" },
  { globalId: 3, translation: "Guide us to the straight path" },
  { globalId: 4, translation: "It is You we worship and You we ask for help" },
];

describe("searchEnglish", () => {
  const index = buildEnIndex(VERSES);

  it("matches verses containing a fully-typed term", () => {
    const results = searchEnglish("worship", index);
    expect(results.map((r) => r.globalId)).toEqual([4]);
  });

  it("matches by stemmed prefix on the last (partial) word", () => {
    const results = searchEnglish("merci", index);
    expect(results.map((r) => r.globalId).sort()).toEqual([0, 2]);
  });

  it("requires every fully-typed leading word to match (AND semantics)", () => {
    const results = searchEnglish("entirely merci", index);
    expect(results.map((r) => r.globalId).sort()).toEqual([0, 2]);
    // "lord merci" has no verse containing both -> no results
    expect(searchEnglish("lord merci", index)).toEqual([]);
  });

  it("returns nothing for an all-stopword query", () => {
    expect(searchEnglish("the of", index)).toEqual([]);
  });

  it("returns nothing for an empty query", () => {
    expect(searchEnglish("", index)).toEqual([]);
  });

  it("respects the result limit", () => {
    const results = searchEnglish("the", index, 1);
    // "the" alone is a stopword and contributes nothing as a leading term,
    // but as the single (last) word it still needs >= 2 chars to prefix-match;
    // since it's filtered by tokenizeEnglish only for leading terms, verify
    // the limit is honored whenever there are matches.
    expect(results.length).toBeLessThanOrEqual(1);
  });
});

describe("searchGlossText", () => {
  const roots = [
    { ar: "كتب", glossShort: "The root primarily means to write or prescribe." },
    { ar: "علم", glossShort: "Relates to knowledge and knowing." },
  ];

  it("matches roots whose gloss contains the query substring", () => {
    expect(searchGlossText("knowledge", roots).map((r) => r.ar)).toEqual(["علم"]);
  });

  it("is case-insensitive", () => {
    expect(searchGlossText("WRITE", roots).map((r) => r.ar)).toEqual(["كتب"]);
  });

  it("ignores queries shorter than 3 characters", () => {
    expect(searchGlossText("to", roots)).toEqual([]);
  });
});
