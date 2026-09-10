import { describe, expect, it } from "vitest";
import { buildComparisonCategoryRows, buildComparisonMarkdown } from "@/lib/compare/buildComparisonRows";
import type { RootSummary } from "@/lib/root/summary";

function summary(overrides: Partial<RootSummary>): RootSummary {
  return {
    root: null,
    total: 0,
    lemmaCount: 0,
    formCount: 0,
    verseCount: 0,
    surahCount: 0,
    byCategory: [],
    byLemma: [],
    ...overrides,
  };
}

describe("buildComparisonCategoryRows", () => {
  const katabaSummary = summary({
    root: "كتب",
    byCategory: [
      { cat: "verb.perf", count: 200 },
      { cat: "noun", count: 90 },
    ],
  });
  const rahmSummary = summary({
    root: "رحم",
    byCategory: [
      { cat: "adj", count: 150 },
      { cat: "noun", count: 30 },
    ],
  });

  it("unions categories across all summaries, ordered per CATEGORY_ORDER", () => {
    const rows = buildComparisonCategoryRows([katabaSummary, rahmSummary]);
    expect(rows.map((r) => r.cat)).toEqual(["verb.perf", "noun", "adj"]);
  });

  it("fills 0 for a category a summary doesn't have, preserving input order", () => {
    const rows = buildComparisonCategoryRows([katabaSummary, rahmSummary]);
    const nounRow = rows.find((r) => r.cat === "noun")!;
    expect(nounRow.counts).toEqual([90, 30]);

    const verbRow = rows.find((r) => r.cat === "verb.perf")!;
    expect(verbRow.counts).toEqual([200, 0]);

    const adjRow = rows.find((r) => r.cat === "adj")!;
    expect(adjRow.counts).toEqual([0, 150]);
  });

  it("returns an empty array for no summaries", () => {
    expect(buildComparisonCategoryRows([])).toEqual([]);
  });
});

describe("buildComparisonMarkdown", () => {
  const katabaSummary = summary({
    root: "كتب",
    total: 290,
    lemmaCount: 2,
    formCount: 5,
    verseCount: 250,
    surahCount: 60,
    byCategory: [{ cat: "verb.perf", count: 200 }],
  });
  const rahmSummary = summary({
    root: "رحم",
    total: 180,
    lemmaCount: 3,
    formCount: 4,
    verseCount: 160,
    surahCount: 40,
    byCategory: [{ cat: "adj", count: 150 }],
  });

  it("renders a stats table with one column per root", () => {
    const md = buildComparisonMarkdown([katabaSummary, rahmSummary], []);
    expect(md).toContain("| | كتب | رحم |");
    expect(md).toContain("| Total occurrences | 290 | 180 |");
    expect(md).toContain("| Verses | 250 | 160 |");
  });

  it("appends a category table when category rows are given", () => {
    const rows = buildComparisonCategoryRows([katabaSummary, rahmSummary]);
    const md = buildComparisonMarkdown([katabaSummary, rahmSummary], rows);
    expect(md).toContain("| Category | كتب | رحم |");
    expect(md).toContain(`| ${"Verb (perfect)"} | 200 | 0 |`);
  });

  it("omits the category table entirely when no category rows are given", () => {
    const md = buildComparisonMarkdown([katabaSummary, rahmSummary], []);
    expect(md).not.toContain("Category");
  });
});
