import { benjaminiHochberg, chiSquarePValue1df, contingencyG2 } from "../../src/lib/stats/keyness";
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

  // Dunning's (1993) collocation test, over the same corpus-wide-verse
  // opportunity space PMI uses: does this pair share more verses than each
  // root's own verse frequency, independently, would predict? See
  // lib/stats/keyness.ts's contingencyG2 for why the full 2x2 table (not
  // just the two roots' raw counts) is what this needs.
  function g2Of(rootA: string, rootB: string, count: number): number {
    const verseCountA = verseCountByRoot.get(rootA) ?? 0;
    const verseCountB = verseCountByRoot.get(rootB) ?? 0;
    return contingencyG2({
      both: count,
      onlyFirst: verseCountA - count,
      onlySecond: verseCountB - count,
      neither: totalVerses - verseCountA - verseCountB + count,
    });
  }

  const withoutFdr: (Omit<RootPairRow, "qValue"> & { p: number })[] = [];
  for (const [key, count] of pairCounts) {
    if (count < MIN_COUNT) continue;
    const [rootA, rootB] = key.split("|");
    const g2 = g2Of(rootA, rootB, count);
    withoutFdr.push({ rootA, rootB, count, pmi: pmiOf(rootA, rootB, count), g2, p: chiSquarePValue1df(g2) });
  }

  // FDR across every pair tested (the natural family: one test per pair
  // that cleared MIN_COUNT), same convention as collocations.
  const fdr = benjaminiHochberg(withoutFdr.map((r) => r.p));
  const allPairs: RootPairRow[] = withoutFdr.map((r, i) => ({ ...r, qValue: fdr.qValues[i] }));

  const byCount = [...allPairs].sort(
    (a, b) => b.count - a.count || a.rootA.localeCompare(b.rootA) || a.rootB.localeCompare(b.rootB),
  );
  const byPmi = [...allPairs].sort(
    (a, b) => b.pmi - a.pmi || b.count - a.count || a.rootA.localeCompare(b.rootA) || a.rootB.localeCompare(b.rootB),
  );

  const partnersByRoot = new Map<string, RootCooccurrencePartner[]>();
  for (const pair of allPairs) {
    // Only qValue, not g2/p -- see RootCooccurrencePartner's own doc comment.
    // Rounded to 4 significant figures: the UI only ever shows 3 decimal
    // places, and this shape is repeated twice per pair across up to
    // ~1,651 roots, so float64's full digit string is pure size for
    // precision nothing here reads.
    const shared = { count: pair.count, pmi: pair.pmi, qValue: Number(pair.qValue.toPrecision(4)) };
    if (!partnersByRoot.has(pair.rootA)) partnersByRoot.set(pair.rootA, []);
    partnersByRoot.get(pair.rootA)!.push({ root: pair.rootB, ...shared });
    if (!partnersByRoot.has(pair.rootB)) partnersByRoot.set(pair.rootB, []);
    partnersByRoot.get(pair.rootB)!.push({ root: pair.rootA, ...shared });
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
