import { bonferroniAlpha, keyness } from "../../src/lib/stats/keyness";
import type { DistinctiveRootRow, DistinctiveVocabFile, IndexRootRow, RootFile } from "../../src/lib/data/types";

const MIN_LOCAL_COUNT = 3;
const TOP_N = 8;

/**
 * For every surah, ranks roots by how distinctive they are there --
 * significantly over-represented relative to their corpus-wide rate, not
 * merely a high ratio.
 *
 * THIS USED TO RANK BY RAW RATIO ALONE (local rate ÷ global rate), which
 * lib/stats/keyness.ts's own module comment calls out by name and by the
 * exact failure mode it produces: "three occurrences in a twenty-word
 * surah is a ratio of thirty and evidence of nothing." That critique was
 * about THIS function -- Compare's keyness tool (G², a log-ratio effect
 * size, and Bonferroni/FDR correction) was built to replace it there, but
 * the fix never propagated back to this one, which still shipped the
 * superseded method on every surah page.
 *
 * Now scored with the same keyness() this app uses everywhere else,
 * against the same basis Compare uses (rooted occurrences, not raw words,
 * as both the scope's and the reference's token counts -- see
 * lib/insights/compare.ts's own module comment for why a rate comparison
 * needs a single consistent denominator). A root only qualifies if its G²
 * clears a per-surah Bonferroni-corrected threshold: with up to ~1,651
 * roots tested per surah, an uncorrected p<0.05 would let dozens of
 * chance results through per surah, the same problem bonferroniAlpha's
 * own doc comment describes for Compare's table. `ratio` is kept on the
 * output only as the human-readable "N.N× avg" figure the surah-page chip
 * already shows; it is no longer what ranking or inclusion is decided by.
 */
export function buildDistinctiveVocab(
  rootFiles: ReadonlyMap<string, RootFile>,
  indexRoots: readonly IndexRootRow[],
  totalSurahs: number,
): DistinctiveVocabFile {
  // Rooted occurrences per surah, and the corpus-wide total -- the same
  // token basis keyness() expects (see compare.ts), computed here from the
  // per-root occurrence lists already in memory rather than from a
  // separate rooted-occurrence index this build step doesn't otherwise need.
  const rootedPerSurah = new Map<number, number>();
  let totalRooted = 0;
  for (const file of rootFiles.values()) {
    for (const [s] of file.occ) {
      rootedPerSurah.set(s, (rootedPerSurah.get(s) ?? 0) + 1);
      totalRooted += 1;
    }
  }

  // Every (surah, root) pair with enough local evidence to test at all,
  // grouped by surah so the Bonferroni correction below is sized to the
  // number of roots actually tested in THIS surah, not the whole corpus.
  const candidatesBySurah = new Map<
    number,
    { ar: string; glossShort: string; localCount: number; globalCount: number }[]
  >();
  for (const row of indexRoots) {
    const file = rootFiles.get(row.ar);
    if (!file) continue;

    const localCounts = new Map<number, number>();
    for (const [s] of file.occ) {
      localCounts.set(s, (localCounts.get(s) ?? 0) + 1);
    }

    for (const [s, localCount] of localCounts) {
      if (localCount < MIN_LOCAL_COUNT) continue;
      let list = candidatesBySurah.get(s);
      if (!list) {
        list = [];
        candidatesBySurah.set(s, list);
      }
      list.push({ ar: row.ar, glossShort: row.glossShort, localCount, globalCount: row.count });
    }
  }

  const bySurah: DistinctiveRootRow[][] = Array.from({ length: totalSurahs }, (_, i) => {
    const candidates = candidatesBySurah.get(i + 1) ?? [];
    const scopeTokens = rootedPerSurah.get(i + 1) ?? 0;
    const referenceTokens = totalRooted - scopeTokens;
    if (scopeTokens === 0 || candidates.length === 0) return [];

    const correctedAlpha = bonferroniAlpha(candidates.length);
    const scored = candidates.map((c) => {
      const k = keyness({
        a: c.localCount,
        b: c.globalCount - c.localCount,
        c: scopeTokens,
        d: referenceTokens,
      });
      return {
        ar: c.ar,
        glossShort: c.glossShort,
        localCount: c.localCount,
        ratio: k.referenceRate > 0 ? k.rate / k.referenceRate : Math.pow(2, k.logRatio),
        g2: k.g2,
        p: k.p,
      };
    });

    const significant = scored.filter((r) => r.p < correctedAlpha);
    significant.sort((a, b) => b.g2 - a.g2 || b.localCount - a.localCount || a.ar.localeCompare(b.ar));
    significant.splice(TOP_N);
    return significant;
  });

  return { bySurah };
}
