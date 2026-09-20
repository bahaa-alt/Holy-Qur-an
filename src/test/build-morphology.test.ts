import { describe, expect, it } from "vitest";
import { buildMorphology } from "../../scripts/lib/build-morphology";
import {
  MORPH_CASES,
  MORPH_DEFINITENESS,
  MORPH_MOODS,
  PGN_PATTERN,
} from "@/lib/morphology/morphFeatures";
import type { RawWord } from "../../scripts/lib/parse-morphology";

const seg = (s: number, a: number, w: number, g: number, tags: string[], root: string | null = null) => ({
  s,
  a,
  w,
  seg: g,
  form: "x",
  pos: "N",
  root,
  lemma: null,
  tags,
});

const word = (s: number, a: number, w: number, segments: ReturnType<typeof seg>[]): RawWord => ({
  s,
  a,
  w,
  text: "x",
  segments,
});

describe("PGN_PATTERN", () => {
  it("matches the shapes the corpus actually writes", () => {
    for (const t of ["3MS", "2FP", "1P", "1S", "MP", "FS", "D", "P", "3FD"]) {
      expect(PGN_PATTERN.test(t), t).toBe(true);
    }
  });

  it("is anchored, so it cannot swallow part of a longer tag", () => {
    // The failure this prevents: PASS ends in S, ACC_PCPL contains P.
    for (const t of ["PASS", "ACT_PCPL", "PASS_PCPL", "PREF", "SUFF", "PRON", "DET", "INDEF"]) {
      expect(PGN_PATTERN.test(t), t).toBe(false);
    }
  });

  it("requires a number, so a bare gender is not a PGN", () => {
    expect(PGN_PATTERN.test("M")).toBe(false);
    expect(PGN_PATTERN.test("F")).toBe(false);
  });
});

describe("buildMorphology", () => {
  it("records each feature as a 1-based id into its vocabulary", () => {
    const idx = buildMorphology([
      word(1, 1, 1, [seg(1, 1, 1, 1, ["ACC", "MOOD:JUS", "INDEF", "3MS"])]),
    ]);
    expect(idx.c[0]).toBe(MORPH_CASES.indexOf("ACC") + 1);
    expect(idx.m[0]).toBe(MORPH_MOODS.indexOf("JUS") + 1);
    expect(idx.d[0]).toBe(MORPH_DEFINITENESS.indexOf("INDEF") + 1);
    expect(idx.pgnTags[idx.p[0] - 1]).toBe("3MS");
  });

  it("uses 0 for a feature the segment does not carry", () => {
    // Not missing data: a perfect verb genuinely has no mood, and saying
    // "indicative by default" would invent 9,153 of them.
    const idx = buildMorphology([word(1, 1, 1, [seg(1, 1, 1, 1, ["PERF", "3MS"])])]);
    expect(idx.c[0]).toBe(0);
    expect(idx.m[0]).toBe(0);
    expect(idx.d[0]).toBe(0);
    expect(idx.p[0]).toBeGreaterThan(0);
  });

  it("skips a segment carrying none of the four", () => {
    const idx = buildMorphology([word(1, 1, 1, [seg(1, 1, 1, 1, ["CONJ", "PREF"])])]);
    expect(idx.s).toEqual([]);
  });

  it("keeps ROOTLESS segments, which definiteness depends on", () => {
    // DET sits on the ال prefix, which has no root. Dropping rootless
    // segments would make "every definite noun" unanswerable.
    const idx = buildMorphology([
      word(2, 1, 1, [seg(2, 1, 1, 1, ["DET"], null), seg(2, 1, 1, 2, ["GEN"], "كتب")]),
    ]);
    expect(idx.s).toHaveLength(2);
    expect(idx.d[0]).toBe(MORPH_DEFINITENESS.indexOf("DET") + 1);
  });

  it("emits rows in corpus order, with full coordinates", () => {
    const idx = buildMorphology([
      word(1, 1, 1, [seg(1, 1, 1, 1, ["NOM"]), seg(1, 1, 1, 2, ["GEN"])]),
      word(1, 2, 3, [seg(1, 2, 3, 1, ["ACC"])]),
    ]);
    expect(idx.s).toEqual([1, 1, 1]);
    expect(idx.a).toEqual([1, 1, 2]);
    expect(idx.w).toEqual([1, 1, 3]);
    expect(idx.g).toEqual([1, 2, 1]);
  });

  it("keeps every column the same length as the others", () => {
    const idx = buildMorphology([
      word(1, 1, 1, [seg(1, 1, 1, 1, ["NOM", "3MS"]), seg(1, 1, 1, 2, ["MOOD:IND"])]),
    ]);
    const n = idx.s.length;
    for (const col of [idx.a, idx.w, idx.g, idx.c, idx.m, idx.d, idx.p]) {
      expect(col).toHaveLength(n);
    }
  });

  it("sorts the PGN vocabulary and remaps the ids to match", () => {
    // Stability across builds: a tag's id must not depend on which verse
    // happened to use it first.
    const idx = buildMorphology([
      word(1, 1, 1, [seg(1, 1, 1, 1, ["3MS"])]),
      word(1, 1, 2, [seg(1, 1, 2, 1, ["1P"])]),
    ]);
    expect(idx.pgnTags).toEqual(["1P", "3MS"]);
    expect(idx.pgnTags[idx.p[0] - 1]).toBe("3MS");
    expect(idx.pgnTags[idx.p[1] - 1]).toBe("1P");
  });

  it("takes only the first value when a segment somehow carries two", () => {
    const idx = buildMorphology([word(1, 1, 1, [seg(1, 1, 1, 1, ["ACC", "GEN"])])]);
    expect(idx.c[0]).toBe(MORPH_CASES.indexOf("NOM") + 2); // ACC, the earlier of the two
  });
});
