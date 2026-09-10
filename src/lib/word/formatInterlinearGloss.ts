import type { WordLookupResult } from "./lookupWordInfo";

export interface InterlinearGloss {
  root: string | null;
  lemma: string | null;
  cat: string | null;
}

/**
 * Thin, testable seam between a resolved WordLookupResult and the compact
 * interlinear rendering (InterlinearVerse) -- keeps that component itself
 * dumb/presentational. `categoryLabel` is passed in already-translated
 * (t.categories[cat]) since this stays a pure function with no i18n
 * dependency of its own.
 */
export function buildInterlinearGloss(result: WordLookupResult, categoryLabel: string): InterlinearGloss {
  if (result.status !== "found") return { root: null, lemma: null, cat: null };
  return { root: result.info.rootAr, lemma: result.info.lemma, cat: categoryLabel };
}
