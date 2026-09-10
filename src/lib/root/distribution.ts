import type { MetaFile, RootFile } from "@/lib/data/types";
import { CHRONOLOGICAL_ORDER_BY_SURAH } from "@/lib/data/chronologicalOrder";

export interface SurahCount {
  surah: number;
  count: number;
}

export interface SurahDistribution {
  meccanCount: number;
  medinanCount: number;
  /** rounded 0-100, by occurrence count; 0 when there are no occurrences at all */
  meccanPct: number;
  /** Quran order, count > 0 only */
  bySurah: SurahCount[];
}

/** Tallies a root/lemma's occurrences (file.occ) against each surah's revelation period. */
export function buildSurahDistribution(file: RootFile, meta: MetaFile): SurahDistribution {
  const typeBySurah = new Map(meta.surahs.map((s) => [s.n, s.type]));
  const countBySurah = new Map<number, number>();

  let meccanCount = 0;
  let medinanCount = 0;
  for (const [s] of file.occ) {
    countBySurah.set(s, (countBySurah.get(s) ?? 0) + 1);
    if (typeBySurah.get(s) === "meccan") meccanCount++;
    else if (typeBySurah.get(s) === "medinan") medinanCount++;
  }

  const bySurah: SurahCount[] = [...countBySurah.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([surah, count]) => ({ surah, count }));

  const total = meccanCount + medinanCount;
  const meccanPct = total > 0 ? Math.round((meccanCount / total) * 100) : 0;

  return { meccanCount, medinanCount, meccanPct, bySurah };
}

/** Reorders rows by the conventional chronological (revelation) order instead of Quran (surah-number) order. */
export function sortByChronologicalOrder<T extends { surah: number }>(rows: readonly T[]): T[] {
  return [...rows].sort(
    (a, b) => CHRONOLOGICAL_ORDER_BY_SURAH[a.surah - 1] - CHRONOLOGICAL_ORDER_BY_SURAH[b.surah - 1],
  );
}
