import type { Cat, MetaFile, OccurrenceIndexFile } from "@/lib/data/types";

/**
 * Facets for the cross-corpus advanced search (/search/advanced). Each
 * facet is a set of accepted values; an empty or missing set means "don't
 * filter on this facet" -- so the default (no filters) returns everything.
 * `revelationType` is single-valued (Meccan/Medinan is a per-surah
 * classification, not a per-occurrence one worth multi-selecting).
 */
export interface AdvancedSearchFilters {
  cats?: ReadonlySet<Cat>;
  /** 1-11 (Form I-XI); 0 would mean "no VF tag", but that's not a useful facet to filter on */
  verbForms?: ReadonlySet<number>;
  rootIdxs?: ReadonlySet<number>;
  surahs?: ReadonlySet<number>;
  revelationType?: "meccan" | "medinan";
}

export interface AdvancedSearchRow {
  s: number;
  a: number;
  w: number;
  rootIdx: number;
  lemmaIdx: number;
  cat: Cat;
  /** 0 = no VF tag (non-verb, or a verb form the corpus left unmarked) */
  verbForm: number;
}

/**
 * Filters the global occurrence index (rooted occurrences only, matching
 * this app's documented "occurrence" methodology) by any combination of
 * category, verb Form, root, surah, and Meccan/Medinan -- the cross-corpus
 * combination no single root's own AyahExplorer can answer, since each
 * root file only carries its own occurrences.
 */
export function filterOccurrences(
  file: OccurrenceIndexFile,
  meta: MetaFile,
  filters: AdvancedSearchFilters,
): AdvancedSearchRow[] {
  const surahType = new Map(meta.surahs.map((sm) => [sm.n, sm.type]));
  const result: AdvancedSearchRow[] = [];

  for (const [s, a, w, rootIdx, lemmaIdx, catIdx, verbForm] of file.rows) {
    const cat = file.cats[catIdx];
    if (filters.cats && filters.cats.size > 0 && !filters.cats.has(cat)) continue;
    if (filters.verbForms && filters.verbForms.size > 0 && !filters.verbForms.has(verbForm)) continue;
    if (filters.rootIdxs && filters.rootIdxs.size > 0 && !filters.rootIdxs.has(rootIdx)) continue;
    if (filters.surahs && filters.surahs.size > 0 && !filters.surahs.has(s)) continue;
    if (filters.revelationType && surahType.get(s) !== filters.revelationType) continue;

    result.push({ s, a, w, rootIdx, lemmaIdx, cat, verbForm });
  }

  return result;
}
