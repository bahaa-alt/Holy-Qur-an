import { prefixRange } from "./binarySearch";
import { stem, tokenizeEnglish } from "./stem";
import type { EnIndexFile } from "@/lib/data/types";

export interface EnglishVerseMatch {
  globalId: number;
  matchedTerms: number;
}

/**
 * Searches the prebuilt English inverted index for verses matching `query`.
 * Every fully-typed word (all but the last) must match a term exactly;
 * the last word (often still being typed) matches by stemmed prefix, so
 * "the entirely merci" already suggests verses containing "merciful". A
 * query where every word is a stopword yields no results.
 */
export function searchEnglish(query: string, index: EnIndexFile, limit = 8): EnglishVerseMatch[] {
  const rawWords = query.trim().split(/\s+/).filter(Boolean);
  if (rawWords.length === 0) return [];

  const lastRaw = rawWords[rawWords.length - 1];
  const leadingTerms = tokenizeEnglish(rawWords.slice(0, -1).join(" "));
  const lastStem = stem(lastRaw.toLowerCase());

  // postings sets to intersect: one per fully-typed term, plus a unioned
  // set for the (possibly partial) last term.
  const requiredSets: number[][] = [];
  for (const term of leadingTerms) {
    const idx = index.terms.indexOf(term);
    requiredSets.push(idx === -1 ? [] : index.postings[idx]);
  }

  if (lastRaw.length >= 2) {
    const [start, end] = prefixRange(index.terms, lastStem, (t) => t);
    const union = new Set<number>();
    for (let i = start; i < end; i++) {
      for (const verseId of index.postings[i]) union.add(verseId);
    }
    requiredSets.push([...union].sort((a, b) => a - b));
  }

  if (requiredSets.length === 0) return [];

  // intersect all required sets, counting matches for ranking
  const counts = new Map<number, number>();
  for (const set of requiredSets) {
    for (const verseId of set) {
      counts.set(verseId, (counts.get(verseId) ?? 0) + 1);
    }
  }

  const needed = requiredSets.length;
  const matches: EnglishVerseMatch[] = [...counts.entries()]
    .filter(([, count]) => count === needed)
    .map(([globalId, matchedTerms]) => ({ globalId, matchedTerms }))
    .sort((a, b) => a.globalId - b.globalId);

  return matches.slice(0, limit);
}

/** Roots whose gloss text contains `query` (case-insensitive substring). */
export function searchGlossText(
  query: string,
  roots: readonly { ar: string; glossShort: string }[],
  limit = 3,
): { ar: string; glossShort: string }[] {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return [];
  return roots.filter((r) => r.glossShort.toLowerCase().includes(q)).slice(0, limit);
}
