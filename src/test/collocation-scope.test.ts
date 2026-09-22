import { describe, expect, it } from "vitest";
import { scopedCollocationRows } from "@/lib/insights/collocationScope";
import type { VerbPrepositionRow } from "@/lib/data/types";

/**
 * Hermetic: two toy combos across two surahs, so the scoping arithmetic
 * can be checked by hand. What this looks like over the real corpus is a
 * claim about the Qur'an and belongs in scripts/build-data.ts instead.
 */
// g2/p/qValue are unexercised by this file's scoping tests -- arbitrary
// but valid placeholders, since VerbPrepositionRow requires them.
const rows: VerbPrepositionRow[] = [
  {
    verbRootAr: "أمن",
    prepositionKey: "ب",
    prepositionLemma: "بِ",
    count: 3,
    pmi: 1.2,
    g2: 5,
    p: 0.02,
    qValue: 0.05,
    refs: [
      { s: 1, a: 1, w: 1 },
      { s: 1, a: 5, w: 2 },
      { s: 2, a: 1, w: 1 },
    ],
  },
  {
    verbRootAr: "أمن",
    prepositionKey: "ل",
    prepositionLemma: "لِ",
    count: 1,
    pmi: -0.4,
    g2: 0.1,
    p: 0.9,
    qValue: 0.9,
    refs: [{ s: 2, a: 3, w: 4 }],
  },
];

describe("scopedCollocationRows", () => {
  it("at whole-Qur'an scope, the scoped count equals the shipped count", () => {
    const scoped = scopedCollocationRows(rows, { kind: "quran" });
    expect(scoped).toHaveLength(2);
    expect(scoped.find((r) => r.prepositionKey === "ب")?.scopedCount).toBe(3);
    expect(scoped.find((r) => r.prepositionKey === "ل")?.scopedCount).toBe(1);
  });

  it("restricts each combo's count to refs inside the scope", () => {
    const scoped = scopedCollocationRows(rows, { kind: "surah", n: 1 });
    // بِ occurs twice in surah 1 (1:1, 1:5); لِ never does.
    expect(scoped).toHaveLength(1);
    expect(scoped[0].prepositionKey).toBe("ب");
    expect(scoped[0].scopedCount).toBe(2);
  });

  it("drops a combo that never occurs in the chosen scope", () => {
    const scoped = scopedCollocationRows(rows, { kind: "surah", n: 3 });
    expect(scoped).toHaveLength(0);
  });

  it("leaves the row's original count and pmi untouched", () => {
    const scoped = scopedCollocationRows(rows, { kind: "surah", n: 2 });
    const row = scoped.find((r) => r.prepositionKey === "ب");
    // Original whole-Qur'an count (3) is preserved alongside the scoped
    // count (1, only 2:1 is in surah 2) -- the caller needs both: the
    // scoped count to rank with, the original PMI to still be labeled
    // "whole Qur'an" honestly.
    expect(row?.count).toBe(3);
    expect(row?.scopedCount).toBe(1);
    expect(row?.pmi).toBe(1.2);
  });
});
