import { CATEGORY_ORDER } from "@/lib/data/types";
import type { Cat } from "@/lib/data/types";
import type { RootSummary } from "@/lib/root/summary";

export interface ComparisonCategoryRow {
  cat: Cat;
  /** counts parallel to the input summaries array; 0 when a summary has none of this category */
  counts: number[];
}

/**
 * Unions the categories present across a set of root summaries (ordered per
 * CATEGORY_ORDER) into parallel rows suitable for a side-by-side comparison
 * chart, one count per input summary (0 when absent).
 */
export function buildComparisonCategoryRows(summaries: readonly RootSummary[]): ComparisonCategoryRow[] {
  const present = new Set<Cat>();
  for (const summary of summaries) {
    for (const c of summary.byCategory) present.add(c.cat);
  }

  return CATEGORY_ORDER.filter((cat) => present.has(cat)).map((cat) => ({
    cat,
    counts: summaries.map((s) => s.byCategory.find((c) => c.cat === cat)?.count ?? 0),
  }));
}
