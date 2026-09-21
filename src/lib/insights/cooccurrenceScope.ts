import { inScope, type Scope, type VerseRef } from "./scope";
import type { VerseRootsFile } from "@/lib/data/types";

/**
 * Root co-occurrence, restricted to a scope, computed directly from
 * verse-roots.json rather than the shipped cooccurrence.json.
 *
 * WHY THIS FILE EXISTS SEPARATELY FROM collocationScope.ts. Collocations'
 * shipped rows carry every occurrence's own refs, so a scope there is a
 * plain filter. cooccurrence.json carries none of that: CooccurrenceFile
 * is corpus-wide aggregates only (topPairs/topPairsByPmi, and byRoot's
 * union of each root's top 5 by count and top 5 by PMI) with no per-pair
 * verse list to restrict. There is nothing in it to filter, so a
 * scope-aware version has to be recomputed from scratch -- the same
 * verse-roots.json Compare's keyness already reads, which already gives
 * every verse's distinct rooted occurrences and needs no new data.
 *
 * PMI IS NOT COMPUTED HERE, for the same reason collocationScope.ts
 * leaves it out: it is defined over each root's corpus-wide rate (see
 * build-cooccurrence.ts), and a scope-local version would silently be a
 * different, non-comparable quantity. Only the count -- unambiguous at
 * any scope -- is computed; the caller shows PMI only at whole-Qur'an
 * scope, where the shipped figure still applies untouched.
 */

export interface ScopedCooccurrencePartner {
  root: string;
  count: number;
}

/**
 * Which roots co-occur with `targetRootIdx` within `scope`, ranked by how
 * many distinct verses (in scope) both share.
 *
 * Only verses containing the target root are examined, and each verse
 * contributes at most once per partner (a partner appearing twice in one
 * verse is still one shared verse) -- the same "distinct verses" measure
 * RootPairRow.count already uses corpus-wide.
 */
export function scopedCooccurrencePartners(
  verseRoots: VerseRootsFile,
  refs: readonly VerseRef[],
  scope: Scope,
  targetRootIdx: number,
  rootNames: readonly string[],
): ScopedCooccurrencePartner[] {
  const counts = new Map<number, number>();
  const verses = Math.min(verseRoots.length, refs.length);
  for (let v = 0; v < verses; v++) {
    if (!inScope(scope, refs[v])) continue;
    const rootsHere = verseRoots[v];
    if (!rootsHere.some(([idx]) => idx === targetRootIdx)) continue;
    const seen = new Set<number>([targetRootIdx]);
    for (const [idx] of rootsHere) {
      if (seen.has(idx)) continue;
      seen.add(idx);
      counts.set(idx, (counts.get(idx) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([idx, count]) => ({ root: rootNames[idx], count }))
    .sort((a, b) => b.count - a.count);
}

export interface ScopedRootPair {
  rootA: string;
  rootB: string;
  count: number;
}

/**
 * Every pair of distinct roots sharing at least 3 verses within `scope`,
 * ranked by shared-verse count -- the scoped counterpart of
 * CooccurrenceFile.topPairs, which build-cooccurrence.ts computes the
 * same way (with the same floor) but only ever over the whole Qur'an.
 */
export function scopedTopPairs(
  verseRoots: VerseRootsFile,
  refs: readonly VerseRef[],
  scope: Scope,
  rootNames: readonly string[],
): ScopedRootPair[] {
  const counts = new Map<string, number>();
  const verses = Math.min(verseRoots.length, refs.length);
  for (let v = 0; v < verses; v++) {
    if (!inScope(scope, refs[v])) continue;
    const distinct = [...new Set(verseRoots[v].map(([idx]) => idx))].sort((a, b) => a - b);
    for (let i = 0; i < distinct.length; i++) {
      for (let j = i + 1; j < distinct.length; j++) {
        const key = `${distinct[i]}:${distinct[j]}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }
  const out: ScopedRootPair[] = [];
  for (const [key, count] of counts) {
    if (count < 3) continue;
    const [a, b] = key.split(":").map(Number);
    out.push({ rootA: rootNames[a], rootB: rootNames[b], count });
  }
  return out.sort((a, b) => b.count - a.count);
}
