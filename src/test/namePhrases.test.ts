import { describe, expect, it } from "vitest";
import { findVersesContaining } from "@/lib/names/namePhrases";
import type { ArIndexFile } from "@/lib/data/types";

// Tokens here are already normalizeForPhraseSearch()-shaped (plain, no
// diacritics) -- matching what build-ar-index.ts actually stores; the
// function under test normalizes its `phraseAr` argument the same way
// before comparing, so passing it fully-diacritized Arabic still works.
const AR_INDEX: ArIndexFile = [
  ["الله", "لا", "اله", "الا", "هو"], // 0: opens with الله
  ["قل", "هو", "الله", "احد"], // 1: contains الله mid-verse, not at the start
  ["وهو", "الغفور", "الرحيم"], // 2: doesn't contain الله at all
  ["الله", "يعلم"], // 3: opens with الله (single-token phrase, shorter verse)
];

describe("findVersesContaining", () => {
  it("finds a verse whose phrase occurs at the start", () => {
    const matches = findVersesContaining("الله", AR_INDEX);
    expect(matches.map((m) => m.globalId)).toEqual([0, 1, 3]);
  });

  it("finds a verse where the phrase occurs mid-verse, not just at the start", () => {
    const matches = findVersesContaining("قل هو", AR_INDEX);
    expect(matches.map((m) => m.globalId)).toEqual([1]);
    expect(matches[0]).toMatchObject({ startW: 1, endW: 2 });
  });

  it("returns no matches for a phrase that never occurs anywhere", () => {
    expect(findVersesContaining("ربكم", AR_INDEX)).toEqual([]);
  });

  it("excludes a verse that doesn't contain the phrase at all", () => {
    expect(findVersesContaining("الله", AR_INDEX).some((m) => m.globalId === 2)).toBe(false);
  });
});
