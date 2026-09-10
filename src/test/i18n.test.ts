import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/en";
import { ar } from "@/lib/i18n/ar";
import { CATEGORY_ORDER } from "@/lib/data/types";
import { ROOT_SHAPE_ORDER } from "@/lib/morphology/rootShape";

// TypeScript already enforces that `ar` satisfies the same `Dict` shape as
// `en` at compile time (ar.ts's `export const ar: Dict = {...}`), so a
// missing/misspelled key is already a build error. This file checks the
// things type-checking can't: every category/shape has a *non-empty*
// translation in both languages, and every function-typed (parameterized)
// entry actually produces a string.
describe("i18n dictionaries", () => {
  it("has a non-empty label for every grammatical category, in both languages", () => {
    for (const cat of CATEGORY_ORDER) {
      expect(en.categories[cat].length, `en.categories.${cat}`).toBeGreaterThan(0);
      expect(ar.categories[cat].length, `ar.categories.${cat}`).toBeGreaterThan(0);
    }
  });

  it("has a non-empty label for every root shape, in both languages", () => {
    for (const shape of ROOT_SHAPE_ORDER) {
      expect(en.rootShapes[shape].length, `en.rootShapes.${shape}`).toBeGreaterThan(0);
      expect(ar.rootShapes[shape].length, `ar.rootShapes.${shape}`).toBeGreaterThan(0);
    }
  });

  it("every parameterized entry used in this file returns a non-empty string", () => {
    for (const dict of [en, ar]) {
      expect(dict.home.browseAllRoots(1651).length).toBeGreaterThan(0);
      expect(dict.pagination.pageOf(1, 10).length).toBeGreaterThan(0);
      expect(dict.filterBar.occurrencesCount(5).length).toBeGreaterThan(0);
      expect(dict.phraseSearch.matchCount(3, 50).length).toBeGreaterThan(0);
      expect(dict.phraseSearch.matchCount(60, 50)).toContain("50");
      expect(dict.surahPage.summary(2, dict.surahPage.medinan, 286).length).toBeGreaterThan(0);
      expect(dict.aboutPage.dataBuildSummary("2026-01-01", 1, 2, 3, 4).length).toBeGreaterThan(0);
    }
  });

  it("ar is a genuinely different language from en for a spot-checked sample of keys", () => {
    expect(ar.nav.roots).not.toBe(en.nav.roots);
    expect(ar.common.search).not.toBe(en.common.search);
    expect(ar.rootHeader.totalOccurrences).not.toBe(en.rootHeader.totalOccurrences);
  });
});
