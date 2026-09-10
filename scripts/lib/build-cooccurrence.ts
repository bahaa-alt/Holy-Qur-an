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
 *
 * Each pair also gets a PMI (log2 pointwise mutual information) score,
 * using `verseCountByRoot` (each root's corpus-wide distinct-verse count,
 * i.e. IndexRootRow.verseCount) and `totalVerses` as the probability
 * space -- raw count alone is biased toward simply-frequent roots (e.g.
 * أله/قول co-occurring often mostly because both are extremely common on
 * their own); PMI instead asks whether a pair co-occurs more than each
 * root's own frequency would predict, surfacing distinctive pairings a
 * count-only ranking misses (including rare-but-tightly-bound pairs that
 * would never make a top-count list).
 */
export function buildCooccurrence(
  words: readonly RawWord[],
  verseCountByRoot: ReadonlyMap<string, number>,
  totalVerses: number,
): CooccurrenceFile {
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

  function pmiOf(rootA: string, rootB: string, count: number): number {
    const verseCountA = verseCountByRoot.get(rootA) ?? 0;
    const verseCountB = verseCountByRoot.get(rootB) ?? 0;
    return Math.log2((count * totalVerses) / (verseCountA * verseCountB));
  }

  const allPairs: RootPairRow[] = [];
  for (const [key, count] of pairCounts) {
    if (count < MIN_COUNT) continue;
    const [rootA, rootB] = key.split("|");
    allPairs.push({ rootA, rootB, count, pmi: pmiOf(rootA, rootB, count) });
  }

  const byCount = [...allPairs].sort(
    (a, b) => b.count - a.count || a.rootA.localeCompare(b.rootA) || a.rootB.localeCompare(b.rootB),
  );
  const byPmi = [...allPairs].sort(
    (a, b) => b.pmi - a.pmi || b.count - a.count || a.rootA.localeCompare(b.rootA) || a.rootB.localeCompare(b.rootB),
  );

  const partnersByRoot = new Map<string, RootCooccurrencePartner[]>();
  for (const pair of allPairs) {
    if (!partnersByRoot.has(pair.rootA)) partnersByRoot.set(pair.rootA, []);
    partnersByRoot.get(pair.rootA)!.push({ root: pair.rootB, count: pair.count, pmi: pair.pmi });
    if (!partnersByRoot.has(pair.rootB)) partnersByRoot.set(pair.rootB, []);
    partnersByRoot.get(pair.rootB)!.push({ root: pair.rootA, count: pair.count, pmi: pair.pmi });
  }

  // byRoot holds the UNION of each root's top-5-by-count and top-5-by-PMI
  // partners (deduped), so a UI sort toggle has genuinely different
  // partners to show for either metric, not just a re-sort of a
  // count-selected top 5.
  const byRoot: Record<string, RootCooccurrencePartner[]> = {};
  for (const [root, partners] of partnersByRoot) {
    const topByCount = [...partners].sort((a, b) => b.count - a.count || a.root.localeCompare(b.root)).slice(0, TOP_PER_ROOT);
    const topByPmi = [...partners].sort((a, b) => b.pmi - a.pmi || b.count - a.count || a.root.localeCompare(b.root)).slice(0, TOP_PER_ROOT);
    const merged = new Map<string, RootCooccurrencePartner>();
    for (const p of [...topByCount, ...topByPmi]) merged.set(p.root, p);
    byRoot[root] = [...merged.values()].sort((a, b) => b.count - a.count || a.root.localeCompare(b.root));
  }

  return { topPairs: byCount.slice(0, TOP_GLOBAL), topPairsByPmi: byPmi.slice(0, TOP_GLOBAL), byRoot };
}
