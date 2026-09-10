import { normalize } from "../../src/lib/arabic/normalize";
import type { FormulaLengthGroup, FormulaRef, FormulaRow, FormulasFile, SurahFile } from "../../src/lib/data/types";

const LENGTHS = [3, 4, 5, 6] as const;
// Higher minimum for shorter phrases, since short word sequences recur far
// more often just by grammatical chance (e.g. common particle + noun
// pairs); a genuinely "formulaic" 3-word phrase needs to clear a higher
// bar than a 6-word one to be worth surfacing.
const MIN_COUNT: Record<number, number> = { 3: 6, 4: 4, 5: 3, 6: 3 };
const TOP_N = 25;

interface FormulaAgg {
  display: string;
  count: number;
  // Uncapped: only the top TOP_N phrases per length survive into the final
  // output, so the full ref list here costs nothing there, and a phrase's
  // detail page (/insights/formulas/[length]/[key]/) needs every occurrence,
  // not a preview.
  refs: FormulaRef[];
}

/**
 * Detects recurring multi-word phrases (candidate Qur'anic "formulas"):
 * every contiguous run of 3-6 words within a single verse (never crossing
 * a verse boundary) is grouped by its normalize()-d text and counted
 * across the whole corpus. Each length is analyzed independently (a
 * 3-word phrase and the 4-word phrase containing it are separate rows,
 * standard n-gram practice) and ranked by raw frequency, floored per
 * length by MIN_COUNT to keep short, grammatically-common sequences from
 * drowning out genuinely distinctive ones.
 */
export function buildFormulas(surahFiles: ReadonlyMap<number, SurahFile>): FormulasFile {
  const aggByLength = new Map<number, Map<string, FormulaAgg>>(LENGTHS.map((n) => [n, new Map()]));

  const surahsSorted = [...surahFiles.values()].sort((a, b) => a.n - b.n);
  for (const surah of surahsSorted) {
    for (const verse of surah.verses) {
      const tokens = verse.w;
      const normTokens = tokens.map((tok) => normalize(tok));
      for (const n of LENGTHS) {
        if (tokens.length < n) continue;
        const map = aggByLength.get(n)!;
        for (let i = 0; i + n <= tokens.length; i++) {
          const key = normTokens.slice(i, i + n).join(" ");
          let agg = map.get(key);
          if (!agg) {
            agg = { display: tokens.slice(i, i + n).join(" "), count: 0, refs: [] };
            map.set(key, agg);
          }
          agg.count++;
          agg.refs.push({ s: surah.n, a: verse.a, w: i + 1 });
        }
      }
    }
  }

  const lengths: FormulaLengthGroup[] = LENGTHS.map((n) => {
    const map = aggByLength.get(n)!;
    const rows: FormulaRow[] = [...map.entries()]
      .filter(([, agg]) => agg.count >= MIN_COUNT[n])
      .sort(([, a], [, b]) => b.count - a.count || a.display.localeCompare(b.display))
      .slice(0, TOP_N)
      .map(([phraseKey, agg]) => ({ phraseKey, display: agg.display, count: agg.count, refs: agg.refs }));
    return { length: n, rows };
  });

  return { lengths };
}
