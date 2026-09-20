import { describe, expect, it } from "vitest";
import { excerptTokens, rootKeynessInSurah, segmentFeatures } from "@/lib/word/wordDetail";
import type { VerseRef } from "@/lib/insights/scope";
import type { MorphologyIndexFile } from "@/lib/data/types";

/**
 * A three-segment word at 2:1:1 and a one-segment word at 2:1:2, encoded
 * exactly as build-morphology writes them: every feature column is
 * 1-based into its vocabulary, 0 means the corpus does not mark it.
 */
const morphology: MorphologyIndexFile = {
  pgnTags: ["2MS", "3MS", "MP"],
  s: [2, 2, 2, 2, 3],
  a: [1, 1, 1, 1, 1],
  w: [1, 1, 1, 2, 1],
  g: [2, 1, 3, 1, 1],
  c: [3, 0, 0, 1, 0], // GEN on segment 2 of word 1; NOM on word 2
  m: [0, 0, 0, 0, 2], // SUBJ, but in another surah
  d: [0, 1, 0, 0, 0], // DET on segment 1 -- the article, its own segment
  p: [0, 0, 3, 2, 0], // MP on segment 3; 3MS on word 2
};

describe("segmentFeatures", () => {
  it("decodes each column through its vocabulary, in segment order", () => {
    expect(segmentFeatures(morphology, 2, 1, 1)).toEqual([
      { g: 1, definiteness: "DET" },
      { g: 2, case: "GEN" },
      { g: 3, pgn: "MP" },
    ]);
  });

  it("keeps a word's segments apart rather than flattening them", () => {
    // The whole point: the definite article and the noun it attaches to
    // are different segments carrying different features, and a single
    // row would be wrong about both.
    const rows = segmentFeatures(morphology, 2, 1, 1);
    expect(rows).toHaveLength(3);
    expect(rows.find((r) => r.definiteness)?.g).toBe(1);
    expect(rows.find((r) => r.case)?.g).toBe(2);
  });

  it("reads 0 as absent, not as the first value of the vocabulary", () => {
    const [row] = segmentFeatures(morphology, 2, 1, 2);
    expect(row).toEqual({ g: 1, case: "NOM", pgn: "3MS" });
    expect(row.mood).toBeUndefined();
    expect(row.definiteness).toBeUndefined();
  });

  it("returns nothing for a word the corpus marks no feature on", () => {
    expect(segmentFeatures(morphology, 9, 9, 9)).toEqual([]);
  });

  it("does not leak features from another verse or surah", () => {
    expect(segmentFeatures(morphology, 3, 1, 1)).toEqual([{ g: 1, mood: "SUBJ" }]);
  });
});

describe("excerptTokens", () => {
  it("cuts on a token boundary, never inside one", () => {
    // Tokens are sigil-prefixed: half a token renders as the wrong kind
    // of span, in the wrong script.
    const tokens = ["tabcdefghij", "aكتب", "eto write", "tmore prose"];
    const out = excerptTokens(tokens, 12);
    expect(out).toEqual(["tabcdefghij", "aكتب"]);
    expect(out.every((tok) => tokens.includes(tok))).toBe(true);
  });

  it("counts visible characters, not the sigils", () => {
    // Four tokens of 5 visible characters each: a 10-character budget
    // takes two of them.
    const tokens = ["tabcde", "tfghij", "tklmno", "tpqrst"];
    expect(excerptTokens(tokens, 10)).toHaveLength(2);
  });

  it("returns the whole article when it is shorter than the budget", () => {
    const tokens = ["tshort", "aكتب"];
    expect(excerptTokens(tokens, 500)).toEqual(tokens);
  });

  it("handles an empty article", () => {
    expect(excerptTokens([], 100)).toEqual([]);
  });
});

describe("rootKeynessInSurah", () => {
  // Surah 1 holds verses 0-1, surah 2 holds verses 2-3.
  const refs: VerseRef[] = [
    { s: 1, a: 1 },
    { s: 1, a: 2 },
    { s: 2, a: 1 },
    { s: 2, a: 2 },
  ];
  const verseRoots = [
    [
      [0, 1],
      [0, 2],
      [1, 3],
    ],
    [
      [0, 1],
      [2, 2],
    ],
    [
      [1, 1],
      [1, 2],
      [1, 3],
      [1, 4],
    ],
    [
      [1, 1],
      [2, 2],
    ],
  ] as unknown as readonly (readonly (readonly [number, number])[])[];

  it("compares this surah's rate against the rest of the corpus", () => {
    // root 0: 3 of surah 1's 5 occurrences, 0 of the other 6.
    const k = rootKeynessInSurah(verseRoots, refs, 1, 0);
    expect(k.overused).toBe(true);
    expect(k.rate).toBeCloseTo((3 / 5) * 10000, 6);
    expect(k.referenceRate).toBe(0);
    expect(k.g2).toBeGreaterThan(0);
  });

  it("reports under-use in the right direction", () => {
    // root 1: 1 of surah 1's 5, 5 of the other 6.
    const k = rootKeynessInSurah(verseRoots, refs, 1, 1);
    expect(k.overused).toBe(false);
    expect(k.logRatio).toBeLessThan(0);
  });

  it("agrees with the Compare tool's own numbers", () => {
    // Same contingency, computed the other way round: surah 2 is the
    // scope, so its rates and the reference swap.
    const inSurah1 = rootKeynessInSurah(verseRoots, refs, 1, 2);
    const inSurah2 = rootKeynessInSurah(verseRoots, refs, 2, 2);
    expect(inSurah1.g2).toBeCloseTo(inSurah2.g2, 12);
    expect(inSurah1.logRatio).toBeCloseTo(-inSurah2.logRatio, 12);
  });

  it("gives a root absent from the surah a zero rate rather than NaN", () => {
    const k = rootKeynessInSurah(verseRoots, refs, 2, 0);
    expect(k.rate).toBe(0);
    expect(Number.isFinite(k.g2)).toBe(true);
    expect(Number.isFinite(k.logRatio)).toBe(true);
    expect(k.logRatioEstimated).toBe(true);
  });
});
