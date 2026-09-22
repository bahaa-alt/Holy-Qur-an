import { dispersion, type Dispersion } from "@/lib/stats/dispersion";
import { keyness, type Keyness } from "@/lib/stats/keyness";
import { inScope, type Scope, type VerseRef } from "./scope";
import type { VerseRootsFile } from "@/lib/data/types";

/**
 * The comparison engine behind /insights/.
 *
 * COMPUTED IN THE BROWSER, FROM DATA THE APP ALREADY SHIPS. Keyness needs
 * a scope the reader chooses, so it cannot be precomputed at build time
 * without fixing the scopes in advance -- which is exactly what made the
 * old page a set of leaderboards. verse-roots.json (122 KB gzipped, part
 * of the core payload and already prefetched for offline use) holds every
 * rooted occurrence keyed by verse, so every scope in scope.ts can be
 * answered from it with one pass: ~50,000 entries, low single-digit
 * milliseconds. No new data file, no bytes added to the download.
 *
 * THE TOKEN BASIS IS ROOTED OCCURRENCES, not words. This app defines an
 * occurrence as a segment carrying a root (see the About page), and
 * verse-roots.json holds exactly those. Rates are therefore "per 10,000
 * rooted occurrences", and the same basis is used for the scope and the
 * reference, which is what a rate comparison requires. Using whole words
 * as the denominator would mix two populations: particles and pronouns
 * carry no root and could never appear in the numerator.
 */

export interface CompareRow {
  rootIdx: number;
  /** occurrences inside the scope */
  count: number;
  /** occurrences everywhere else */
  referenceCount: number;
  keyness: Keyness;
}

export interface CompareResult {
  rows: CompareRow[];
  /** rooted occurrences in the scope, and in the reference */
  scopeTokens: number;
  referenceTokens: number;
  scopeVerses: number;
  /** how many roots were tested, for the multiple-comparison correction */
  tested: number;
}

/**
 * Counts every root inside and outside the scope, then scores each one.
 *
 * `minCount` drops roots too rare in the scope for the test to say
 * anything: with one occurrence, G² is driven entirely by the reference
 * rate, and the log ratio is whatever the floor makes it. The old page's
 * floor was 3 and it still surfaced noise; the default here is 5, and it
 * is a control rather than a constant because the right floor depends on
 * how much text the scope holds.
 */
export function compareScope(
  verseRoots: VerseRootsFile,
  refs: readonly VerseRef[],
  scope: Scope,
  rootCount: number,
  minCount: number,
): CompareResult {
  const inside = new Int32Array(rootCount);
  const outside = new Int32Array(rootCount);
  let scopeTokens = 0;
  let referenceTokens = 0;
  let scopeVerses = 0;

  const verses = Math.min(verseRoots.length, refs.length);
  for (let v = 0; v < verses; v++) {
    const occurrences = verseRoots[v];
    const isIn = inScope(scope, refs[v]);
    if (isIn) scopeVerses += 1;
    for (const [rootIdx] of occurrences) {
      if (rootIdx < 0 || rootIdx >= rootCount) continue;
      if (isIn) {
        inside[rootIdx] += 1;
        scopeTokens += 1;
      } else {
        outside[rootIdx] += 1;
        referenceTokens += 1;
      }
    }
  }

  const rows: CompareRow[] = [];
  let tested = 0;
  for (let rootIdx = 0; rootIdx < rootCount; rootIdx++) {
    const count = inside[rootIdx];
    const referenceCount = outside[rootIdx];
    if (count + referenceCount === 0) continue;
    tested += 1;
    if (count < minCount) continue;
    rows.push({
      rootIdx,
      count,
      referenceCount,
      keyness: keyness({
        a: count,
        b: referenceCount,
        c: scopeTokens,
        d: referenceTokens,
      }),
    });
  }

  rows.sort((x, y) => y.keyness.g2 - x.keyness.g2 || y.count - x.count || x.rootIdx - y.rootIdx);
  return { rows, scopeTokens, referenceTokens, scopeVerses, tested };
}

export interface DispersionRow {
  rootIdx: number;
  dispersion: Dispersion;
}

/**
 * Every root's spread across the 114 surahs.
 *
 * Parts are surahs, sized by their own rooted-occurrence count -- the
 * same basis as the rates above, so a root's dispersion and its keyness
 * are measured against the same corpus. Surahs vary from 4 to ~3,000
 * rooted occurrences, which is precisely why the parts must be weighted
 * by size and why the old "how many surahs" list was not enough.
 */
export function corpusDispersion(
  verseRoots: VerseRootsFile,
  refs: readonly VerseRef[],
  rootCount: number,
  surahCount = 114,
): DispersionRow[] {
  const perSurah: Int32Array[] = Array.from(
    { length: rootCount },
    () => new Int32Array(surahCount),
  );
  const surahSizes = new Array<number>(surahCount).fill(0);

  const verses = Math.min(verseRoots.length, refs.length);
  for (let v = 0; v < verses; v++) {
    const surah = refs[v].s - 1;
    if (surah < 0 || surah >= surahCount) continue;
    for (const [rootIdx] of verseRoots[v]) {
      if (rootIdx < 0 || rootIdx >= rootCount) continue;
      perSurah[rootIdx][surah] += 1;
      surahSizes[surah] += 1;
    }
  }

  const rows: DispersionRow[] = [];
  for (let rootIdx = 0; rootIdx < rootCount; rootIdx++) {
    const counts = Array.from(perSurah[rootIdx]);
    const d = dispersion(counts, surahSizes);
    if (d.total > 0) rows.push({ rootIdx, dispersion: d });
  }
  return rows;
}

/**
 * One root's occurrence count per surah, alongside each surah's total
 * rooted-occurrence count -- the same "part size" corpusDispersion
 * weights by. What dispersionPermutationTest (lib/stats/dispersion)
 * needs to test one root's DP for significance.
 *
 * A fresh pass over verse-roots.json rather than a lookup into
 * corpusDispersion's own working set, computed on demand for whichever
 * single row a reader asks about -- corpusDispersion does not keep
 * per-surah counts around for all 1,651 roots once it has reduced each
 * to its DP, and a permutation test's cost is dominated by one root's
 * own occurrence count, not by how many roots exist.
 */
export function perSurahCounts(
  verseRoots: VerseRootsFile,
  refs: readonly VerseRef[],
  rootIdx: number,
  surahCount = 114,
): { counts: number[]; sizes: number[] } {
  const counts = new Array<number>(surahCount).fill(0);
  const sizes = new Array<number>(surahCount).fill(0);
  const verses = Math.min(verseRoots.length, refs.length);
  for (let v = 0; v < verses; v++) {
    const surah = refs[v].s - 1;
    if (surah < 0 || surah >= surahCount) continue;
    for (const [r] of verseRoots[v]) {
      if (r < 0) continue;
      sizes[surah] += 1;
      if (r === rootIdx) counts[surah] += 1;
    }
  }
  return { counts, sizes };
}
