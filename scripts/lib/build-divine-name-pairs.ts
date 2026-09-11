import type {
  DivineNamePairRow,
  DivineNamePairsFile,
  IndexLemmaRow,
  IndexRootRow,
  OccurrenceIndexFile,
} from "../../src/lib/data/types";
import type { TopicDefinition } from "../../src/lib/topics/topicDefinitions";

/**
 * Finds every ordered pair of curated Divine Names (see DIVINE_NAME_TOPICS)
 * that occur as immediately adjacent words somewhere in the Qur'an -- e.g.
 * "العليم الحكيم", or the Basmala's "الله" directly followed by "الرحمن".
 *
 * Built entirely from `occurrenceIndex` (already-resolved root+lemma per
 * rooted word, sorted in Qur'an order), matched against each Divine Name
 * topic's own `sources`: a `root` source matches any lemma under that
 * root, a `rootedLemma` source matches only that specific (root, lemma
 * key) pair. `occurrenceIndex` only ever contains rooted words, so a
 * `rootlessLemma` source (none currently used by DIVINE_NAME_TOPICS) can
 * never match here -- that's fine, it's simply never looked up.
 *
 * Adjacency is checked on the word's actual 1-based position (`w`), not on
 * array-adjacency within the filtered rows: a rootless word in between
 * (e.g. a pronoun) would still leave a gap in `w`, correctly excluding
 * that pair, while two names separated only by an attached clitic (never
 * its own word) are correctly still adjacent.
 *
 * A name adjacent to itself (the same slug twice in a row) is excluded --
 * not a meaningful "pair," and not attested in practice.
 */
export function buildDivineNamePairs(
  occurrenceIndex: OccurrenceIndexFile,
  indexRoots: readonly IndexRootRow[],
  indexLemmas: readonly IndexLemmaRow[],
  divineNameTopics: readonly TopicDefinition[],
): DivineNamePairsFile {
  const slugByRootedLemma = new Map<string, string>();
  const slugByRootOnly = new Map<string, string>();
  for (const topic of divineNameTopics) {
    for (const source of topic.sources) {
      if (source.kind === "rootedLemma") {
        slugByRootedLemma.set(`${source.root}:${source.lemmaKey}`, topic.slug);
      } else if (source.kind === "root") {
        slugByRootOnly.set(source.root, topic.slug);
      }
    }
  }

  function slugFor(rootIdx: number, lemmaIdx: number): string | null {
    const rootAr = indexRoots[rootIdx]?.ar;
    const lemmaKey = indexLemmas[lemmaIdx]?.key;
    if (rootAr === undefined || lemmaKey === undefined) return null;
    return slugByRootedLemma.get(`${rootAr}:${lemmaKey}`) ?? slugByRootOnly.get(rootAr) ?? null;
  }

  const byPairKey = new Map<string, DivineNamePairRow>();
  const rows = occurrenceIndex.rows;
  // rows are sorted by (s, a, w); scan consecutive rows within one verse.
  for (let i = 0; i < rows.length - 1; i++) {
    const [s1, a1, w1, rootIdx1, lemmaIdx1] = rows[i];
    const [s2, a2, w2, rootIdx2, lemmaIdx2] = rows[i + 1];
    if (s1 !== s2 || a1 !== a2) continue;
    if (w2 !== w1 + 1) continue;

    const slugA = slugFor(rootIdx1, lemmaIdx1);
    const slugB = slugFor(rootIdx2, lemmaIdx2);
    if (!slugA || !slugB || slugA === slugB) continue;

    const pairKey = `${slugA}|${slugB}`;
    let row = byPairKey.get(pairKey);
    if (!row) {
      row = { aSlug: slugA, bSlug: slugB, count: 0, refs: [] };
      byPairKey.set(pairKey, row);
    }
    row.count++;
    row.refs.push({ s: s1, a: a1, w: w1 });
  }

  const pairs = [...byPairKey.values()].sort(
    (x, y) => y.count - x.count || x.aSlug.localeCompare(y.aSlug) || x.bSlug.localeCompare(y.bSlug),
  );

  return { pairs };
}
