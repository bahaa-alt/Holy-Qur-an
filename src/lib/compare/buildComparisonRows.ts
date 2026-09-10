import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/data/types";
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

/** Renders the stats table and (if any) the category breakdown as Markdown tables, for export. */
export function buildComparisonMarkdown(
  summaries: readonly RootSummary[],
  categoryRows: readonly ComparisonCategoryRow[],
): string {
  const cols = summaries.map((s) => s.root ?? "").join(" | ");
  const sep = summaries.map(() => "---").join(" | ");
  const statLines: [string, number[]][] = [
    ["Total occurrences", summaries.map((s) => s.total)],
    ["Derived lemmas", summaries.map((s) => s.lemmaCount)],
    ["Distinct forms", summaries.map((s) => s.formCount)],
    ["Verses", summaries.map((s) => s.verseCount)],
    ["Surahs", summaries.map((s) => s.surahCount)],
  ];

  const lines = [
    `| | ${cols} |`,
    `| --- | ${sep} |`,
    ...statLines.map(([label, values]) => `| ${label} | ${values.join(" | ")} |`),
  ];

  if (categoryRows.length > 0) {
    lines.push("", `| Category | ${cols} |`, `| --- | ${sep} |`);
    for (const row of categoryRows) {
      lines.push(`| ${CATEGORY_LABELS[row.cat]} | ${row.counts.join(" | ")} |`);
    }
  }

  return lines.join("\n");
}
