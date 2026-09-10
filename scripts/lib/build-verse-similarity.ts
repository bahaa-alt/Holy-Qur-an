import type { VerseSimilarityFile, VerseSimilarityPair } from "../../src/lib/data/types";
import type { RawWord } from "./parse-morphology";

// A root occurring in more verses than this is too common to be a useful
// "these two verses are alike" signal (a root like أله, in ~1,700 verses,
// would make almost every verse a "candidate" of almost every other) --
// only rarer, more distinctive roots are used to *propose* candidate
// pairs. The final score still uses each verse's FULL root set, so common
// roots still count once a pair is already a candidate via a rarer one.
const CANDIDATE_ROOT_MAX_VERSES = 60;
// A verse with fewer distinct roots than this can't meaningfully share
// this many with another verse, so it's excluded from consideration
// entirely (also protects the empty-root-set / divide-by-zero case).
const MIN_SHARED_ROOTS = 4;
const MIN_JACCARD = 0.4;
const TOP_N = 50;

/**
 * Finds verse pairs that share an unusually high proportion of their
 * distinct roots (Jaccard similarity), even when the wording differs --
 * unlike the Formulas feature's exact repeated word sequences, this
 * surfaces thematically or structurally parallel verses (e.g. the
 * repeated "forbidden foods" list, or parallel destruction narratives
 * across prophets' stories) a phrase-match can't catch.
 *
 * Candidate generation is deliberately bounded (see CANDIDATE_ROOT_MAX_VERSES)
 * to keep this an O(sum over rare roots of verseCount^2) scan rather than
 * O(verses^2): only roots occurring in few enough verses to be a real
 * signal are used to propose pairs, then every candidate is scored by its
 * full Jaccard similarity over both verses' complete root sets.
 */
export function buildVerseSimilarity(
  words: readonly RawWord[],
  globalIdOf: ReadonlyMap<string, number>,
): VerseSimilarityFile {
  const rootsByVerse = new Map<number, Set<string>>();
  for (const word of words) {
    for (const seg of word.segments) {
      if (seg.root === null) continue;
      const globalId = globalIdOf.get(`${word.s}:${word.a}`);
      if (globalId === undefined) continue;
      let set = rootsByVerse.get(globalId);
      if (!set) {
        set = new Set();
        rootsByVerse.set(globalId, set);
      }
      set.add(seg.root);
    }
  }

  const versesByRoot = new Map<string, number[]>();
  for (const [globalId, roots] of rootsByVerse) {
    for (const root of roots) {
      let list = versesByRoot.get(root);
      if (!list) {
        list = [];
        versesByRoot.set(root, list);
      }
      list.push(globalId);
    }
  }

  // Pair keys encoded as a*ENCODING_BASE+b (a<b) so a Set<number> can dedupe
  // candidates proposed by more than one shared rare root. The base must
  // exceed every possible global verse id, NOT just rootsByVerse.size --
  // a verse with zero rooted words (pure particles) never gets an entry
  // in rootsByVerse, so its size can be smaller than the actual id range,
  // which would corrupt the encoding if used as the modulus.
  const ENCODING_BASE = 10_000;
  const candidatePairs = new Set<number>();
  for (const list of versesByRoot.values()) {
    if (list.length > CANDIDATE_ROOT_MAX_VERSES) continue;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = Math.min(list[i], list[j]);
        const b = Math.max(list[i], list[j]);
        candidatePairs.add(a * ENCODING_BASE + b);
      }
    }
  }

  const pairs: VerseSimilarityPair[] = [];
  for (const key of candidatePairs) {
    const a = Math.floor(key / ENCODING_BASE);
    const b = key % ENCODING_BASE;
    const rootsA = rootsByVerse.get(a);
    const rootsB = rootsByVerse.get(b);
    if (!rootsA || !rootsB) continue;
    if (rootsA.size < MIN_SHARED_ROOTS || rootsB.size < MIN_SHARED_ROOTS) continue;

    let shared = 0;
    for (const r of rootsA) if (rootsB.has(r)) shared++;
    if (shared < MIN_SHARED_ROOTS) continue;

    const jaccard = shared / (rootsA.size + rootsB.size - shared);
    if (jaccard < MIN_JACCARD) continue;

    pairs.push({ a, b, sharedRoots: shared, jaccard });
  }

  pairs.sort((x, y) => y.jaccard - x.jaccard || y.sharedRoots - x.sharedRoots || x.a - y.a || x.b - y.b);

  return { pairs: pairs.slice(0, TOP_N) };
}
