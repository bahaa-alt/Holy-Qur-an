import { describe, expect, it } from "vitest";
import { scopedFormulaRows } from "@/lib/insights/formulaScope";
import type { FormulaRow } from "@/lib/data/types";

/**
 * Hermetic: two toy phrases across two surahs, so the scoping arithmetic
 * can be checked by hand. What this looks like over the real corpus is a
 * claim about the Qur'an and belongs in scripts/build-data.ts instead.
 */
const rows: FormulaRow[] = [
  {
    phraseKey: "a b c",
    display: "أ ب ت",
    count: 3,
    refs: [
      { s: 1, a: 1, w: 1 },
      { s: 1, a: 5, w: 2 },
      { s: 2, a: 1, w: 1 },
    ],
  },
  {
    phraseKey: "d e f",
    display: "ث ج ح",
    count: 1,
    refs: [{ s: 2, a: 3, w: 4 }],
  },
];

describe("scopedFormulaRows", () => {
  it("at whole-Qur'an scope, the scoped count equals the shipped count", () => {
    const scoped = scopedFormulaRows(rows, { kind: "quran" });
    expect(scoped).toHaveLength(2);
    expect(scoped.find((r) => r.phraseKey === "a b c")?.scopedCount).toBe(3);
    expect(scoped.find((r) => r.phraseKey === "d e f")?.scopedCount).toBe(1);
  });

  it("restricts each phrase's count to refs inside the scope", () => {
    const scoped = scopedFormulaRows(rows, { kind: "surah", n: 1 });
    // "a b c" occurs twice in surah 1 (1:1, 1:5); "d e f" never does.
    expect(scoped).toHaveLength(1);
    expect(scoped[0].phraseKey).toBe("a b c");
    expect(scoped[0].scopedCount).toBe(2);
  });

  it("drops a phrase that never occurs in the chosen scope", () => {
    const scoped = scopedFormulaRows(rows, { kind: "surah", n: 3 });
    expect(scoped).toHaveLength(0);
  });

  it("leaves the row's original count and display untouched", () => {
    const scoped = scopedFormulaRows(rows, { kind: "surah", n: 2 });
    const row = scoped.find((r) => r.phraseKey === "a b c");
    // Original whole-Qur'an count (3) is preserved alongside the scoped
    // count (1, only 2:1 is in surah 2), and display/phraseKey are
    // untouched -- there is no per-scope recomputation of the phrase
    // itself, only of how often it recurs here.
    expect(row?.count).toBe(3);
    expect(row?.scopedCount).toBe(1);
    expect(row?.display).toBe("أ ب ت");
  });
});
