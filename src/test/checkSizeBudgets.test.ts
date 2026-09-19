import { describe, expect, it } from "vitest";
import { checkSizeBudgets } from "../../scripts/lib/emit";

const BUDGETS = { "index.json": 100, "forms.json": 100 };

function entry(label: string, rawBytes: number, gzBytes = 0) {
  return { label, rawBytes, gzBytes };
}

describe("checkSizeBudgets", () => {
  it("reports nothing when everything is inside its budget", () => {
    const violations = checkSizeBudgets({
      entries: [entry("index.json", 50, 10), entry("forms.json", 50, 10)],
      perFileRawBudgets: BUDGETS,
      totalRawBudget: 200,
      totalGzBudget: 100,
    });
    expect(violations).toEqual([]);
  });

  it("catches a single file over its own raw budget", () => {
    const violations = checkSizeBudgets({
      entries: [entry("index.json", 101, 10)],
      perFileRawBudgets: BUDGETS,
      totalRawBudget: 1000,
      totalGzBudget: 1000,
    });
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      label: "index.json",
      actual: 101,
      budget: 100,
      kind: "raw",
    });
  });

  it("catches the raw total even when every individual file is fine", () => {
    const violations = checkSizeBudgets({
      entries: [entry("index.json", 90, 10), entry("forms.json", 90, 10)],
      perFileRawBudgets: BUDGETS,
      totalRawBudget: 150,
      totalGzBudget: 1000,
    });
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({ label: "TOTAL", actual: 180, budget: 150, kind: "raw" });
  });

  it("catches the gzipped total independently of the raw total", () => {
    const violations = checkSizeBudgets({
      entries: [entry("index.json", 10, 80)],
      perFileRawBudgets: BUDGETS,
      totalRawBudget: 1000,
      totalGzBudget: 50,
    });
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({ label: "TOTAL", actual: 80, budget: 50, kind: "gz" });
  });

  it("ignores entries that have no declared per-file budget, but still totals them", () => {
    const violations = checkSizeBudgets({
      entries: [entry("surahs/*.json", 5000, 900)],
      perFileRawBudgets: BUDGETS,
      totalRawBudget: 1000,
      totalGzBudget: 10000,
    });
    // No per-file complaint (none declared), but it counts toward the total.
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({ label: "TOTAL", kind: "raw", actual: 5000 });
  });

  it("reports every violation at once rather than stopping at the first", () => {
    const violations = checkSizeBudgets({
      entries: [entry("index.json", 500, 400), entry("forms.json", 500, 400)],
      perFileRawBudgets: BUDGETS,
      totalRawBudget: 100,
      totalGzBudget: 100,
    });
    expect(violations.map((v) => `${v.label}:${v.kind}`)).toEqual([
      "index.json:raw",
      "forms.json:raw",
      "TOTAL:raw",
      "TOTAL:gz",
    ]);
  });

  it("would have caught a gz-only regression that a zeroed gz column hides", () => {
    // The bug this function exists to prevent: --check used to record every
    // entry with gzBytes = 0, so totalGz() was always 0 and no gz budget
    // could ever trip. Passing real gz figures must trip it.
    const zeroed = checkSizeBudgets({
      entries: [entry("index.json", 10, 0)],
      perFileRawBudgets: BUDGETS,
      totalRawBudget: 1000,
      totalGzBudget: 5,
    });
    expect(zeroed).toEqual([]);

    const real = checkSizeBudgets({
      entries: [entry("index.json", 10, 900)],
      perFileRawBudgets: BUDGETS,
      totalRawBudget: 1000,
      totalGzBudget: 5,
    });
    expect(real).toHaveLength(1);
  });
});
