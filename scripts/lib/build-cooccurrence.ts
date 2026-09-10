import type { CooccurrenceFile, RootCooccurrencePartner, RootPairRow } from "../../src/lib/data/types";
import type { RawWord } from "./parse-morphology";

/** Pairs co-occurring fewer times than this are noise, not a genuine pattern. */
const MIN_COUNT = 3;
const TOP_GLOBAL = 50;
const TOP_PER_ROOT = 5;

/**
 * For every verse, collects its distinct rooted-word roots (the same
 * grouping buildInsights uses for mostRootDenseVerse), then tallies every
 * unordered pair of roots that co-occur in at least one verse together.
 * This is corpus-wide, unlike the per-root Collocations feature (which only
 * looks within one root's own verses) -- it answers "which root pairs
 * co-occur most anywhere in the Qur'an", not "what else appears alongside
 * this one root".
 */
export function buildCooccurrence(words: readonly RawWord[]): CooccurrenceFile {
  const rootsByVerse = new Map<string, Set<string>>();
  for (const word of words) {
    for (const seg of word.segments) {
      if (seg.root === null) continue;
      const key = `${word.s}:${word.a}`;
      let set = rootsByVerse.get(key);
      if (!set) {
        set = new Set();
        rootsByVerse.set(key, set);
      }
      set.add(seg.root);
    }
  }

  // Canonical pair key "a|b" with a < b (locale order) so each unordered
  // pair is tallied exactly once regardless of which root a verse lists first.
  const pairCounts = new Map<string, number>();
  for (const roots of rootsByVerse.values()) {
    const list = [...roots].sort((a, b) => a.localeCompare(b));
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const key = `${list[i]}|${list[j]}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    }
  }

  const allPairs: RootPairRow[] = [];
  for (const [key, count] of pairCounts) {
    if (count < MIN_COUNT) continue;
    const [rootA, rootB] = key.split("|");
    allPairs.push({ rootA, rootB, count });
  }
  allPairs.sort((a, b) => b.count - a.count || a.rootA.localeCompare(b.rootA) || a.rootB.localeCompare(b.rootB));

  const partnersByRoot = new Map<string, RootCooccurrencePartner[]>();
  for (const pair of allPairs) {
    if (!partnersByRoot.has(pair.rootA)) partnersByRoot.set(pair.rootA, []);
    partnersByRoot.get(pair.rootA)!.push({ root: pair.rootB, count: pair.count });
    if (!partnersByRoot.has(pair.rootB)) partnersByRoot.set(pair.rootB, []);
    partnersByRoot.get(pair.rootB)!.push({ root: pair.rootA, count: pair.count });
  }

  const byRoot: Record<string, RootCooccurrencePartner[]> = {};
  for (const [root, partners] of partnersByRoot) {
    partners.sort((a, b) => b.count - a.count || a.root.localeCompare(b.root));
    byRoot[root] = partners.slice(0, TOP_PER_ROOT);
  }

  return { topPairs: allPairs.slice(0, TOP_GLOBAL), byRoot };
}
