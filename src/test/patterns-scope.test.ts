import { describe, expect, it } from "vitest";
import { scopedPatterns } from "@/lib/insights/patternsScope";
import type { OccurrenceIndexFile } from "@/lib/data/types";

/**
 * Hermetic: a six-row toy occurrence index, so the aggregation can be
 * checked by hand. Root 0 (سلم, sound), root 1 (قول, hollow) -- shapes
 * are derived from the actual root text, so these have to be real
 * classifiable roots, not placeholders.
 */
const rootNames = ["سلم", "قول"];
const cats = ["verb.perf", "noun", "actPcpl"] as const;
const occurrences: OccurrenceIndexFile = {
  cats: [...cats],
  rows: [
    // s, a, w, rootIdx, lemmaIdx, catIdx, verbForm
    [1, 1, 1, 0, 0, 0, 0], // surah 1, root سلم, cat verb.perf, UNTAGGED (verbForm 0) -- must count as Form I
    [1, 1, 2, 1, 1, 1, 0], // surah 1, root قول, cat noun -- not a verb by category
    [1, 2, 1, 0, 0, 0, 4], // surah 1, root سلم, cat verb.perf, Form IV (tagged)
    [2, 1, 1, 1, 2, 0, 0], // surah 2, root قول, cat verb.perf, untagged -- also Form I
    [2, 1, 2, 1, 3, 0, 0], // surah 2, root قول, cat verb.perf, untagged, same verse as the row above
    [2, 2, 1, 1, 4, 2, 4], // surah 2, root قول, cat actPcpl (a Form IV ACTIVE PARTICIPLE, not the finite verb) carrying VF:4 -- must NOT be counted as a Form IV verb occurrence; this is the pitfall the module's doc comment describes
  ],
};

describe("scopedPatterns", () => {
  it("treats an untagged verb (verbForm 0) as Form I", () => {
    const result = scopedPatterns(occurrences, { kind: "quran" }, rootNames);
    const formI = result.verbForms.find((f) => f.key === 1);
    // Row 0 (surah 1) and rows 3-4 (surah 2) are all untagged verb.perf
    // occurrences -- three total, from two distinct roots.
    expect(formI?.count).toBe(3);
    expect(formI?.rootCount).toBe(2);
  });

  it("does not count a participle/verbal-noun's own VF: tag as a verb occurrence", () => {
    const result = scopedPatterns(occurrences, { kind: "quran" }, rootNames);
    // Row 5 carries VF:4 but its category is actPcpl (an active
    // participle derived from Form IV), not a verb category -- verbForm
    // alone cannot tell a Form's participle from its finite verb, which
    // is exactly why this file gates on category first.
    const formIV = result.verbForms.find((f) => f.key === 4);
    expect(formIV?.count).toBe(1); // only row 2 (the real Form IV verb.perf)
    const actPcpl = result.categories.find((c) => c.key === "actPcpl");
    expect(actPcpl?.count).toBe(1); // row 5 still counted as a category occurrence
  });

  it("distinguishes lemma pairs by root, not lemma index alone", () => {
    const result = scopedPatterns(occurrences, { kind: "quran" }, rootNames);
    const formI = result.verbForms.find((f) => f.key === 1);
    // lemmaIdx 0 (root سلم) and lemmaIdx 2, 3 (root قول) are three
    // distinct (root, lemma) pairs.
    expect(formI?.lemmaCount).toBe(3);
  });

  it("restricts every section to the chosen scope", () => {
    const result = scopedPatterns(occurrences, { kind: "surah", n: 1 }, rootNames);
    // Rows 0-2 are in surah 1: two verb.perf occurrences (untagged Form
    // I, explicit Form IV) and one noun occurrence.
    const totalVerbOccurrences = result.verbForms.reduce((sum, f) => sum + f.count, 0);
    expect(totalVerbOccurrences).toBe(2);
    const nounCat = result.categories.find((c) => c.key === "noun");
    expect(nounCat?.count).toBe(1);
  });

  it("classifies root shapes from the root text and counts distinct roots per shape", () => {
    const result = scopedPatterns(occurrences, { kind: "quran" }, rootNames);
    // سلم is sound (no weak/geminate/hamza radicals); قول is hollow
    // (middle radical و).
    const sound = result.rootShapes.find((s) => s.key === "sound");
    const hollow = result.rootShapes.find((s) => s.key === "hollow");
    expect(sound?.rootCount).toBe(1);
    expect(hollow?.rootCount).toBe(1);
    expect(sound?.count).toBe(2); // both سلم rows
    expect(hollow?.count).toBe(4); // all four قول rows
  });

  it("shapeRoots lists each shape's roots with their scoped occurrence count", () => {
    const result = scopedPatterns(occurrences, { kind: "quran" }, rootNames);
    const hollowRoots = result.shapeRoots.get("hollow");
    expect(hollowRoots).toEqual([{ rootIdx: 1, count: 4 }]);
  });
});
