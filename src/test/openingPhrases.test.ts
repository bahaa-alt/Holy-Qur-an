import { describe, expect, it } from "vitest";
import { findVersesStartingWith } from "@/lib/names/openingPhrases";
import type { ArIndexFile } from "@/lib/data/types";

// Tokens here are already normalizeForPhraseSearch()-shaped (plain, no
// diacritics) -- matching what build-ar-index.ts actually stores; the
// function under test normalizes its `phraseAr` argument the same way
// before comparing, so passing it fully-diacritized Arabic still works.
const AR_INDEX: ArIndexFile = [
  ["الله", "لا", "اله", "الا", "هو"], // 0: opens with الله
  ["قل", "هو", "الله", "احد"], // 1: opens with قل هو, not الله
  ["وهو", "الغفور", "الرحيم"], // 2: doesn't open with الله (والله is one token, وهو here)
  ["الله", "يعلم"], // 3: also opens with الله (single-token phrase, shorter verse)
];

describe("findVersesStartingWith", () => {
  it("finds every verse whose first word(s) match the phrase", () => {
    const matches = findVersesStartingWith("الله", AR_INDEX);
    expect(matches.map((m) => m.globalId)).toEqual([0, 3]);
    expect(matches[0]).toMatchObject({ startW: 1, endW: 1 });
  });

  it("matches a multi-word phrase only when it starts at word 1", () => {
    const matches = findVersesStartingWith("قل هو", AR_INDEX);
    expect(matches.map((m) => m.globalId)).toEqual([1]);
    expect(matches[0]).toMatchObject({ startW: 1, endW: 2 });
  });

  it("excludes a verse where the phrase occurs but not at the very start", () => {
    // "الغفور الرحيم" appears in verse 2, but not starting at word 1.
    const matches = findVersesStartingWith("الغفور الرحيم", AR_INDEX);
    expect(matches).toEqual([]);
  });

  it("returns no matches for a phrase that never opens any verse", () => {
    expect(findVersesStartingWith("ربكم", AR_INDEX)).toEqual([]);
  });
});
