import { describe, expect, it } from "vitest";
import { parseMorphologyTSV } from "../../scripts/lib/parse-morphology";
import { buildRoots } from "../../scripts/lib/build-roots";
import { buildDistinctiveVocab } from "../../scripts/lib/build-distinctive-vocab";

/**
 * Three surahs, every word rooted (so rootedPerSurah == word count here),
 * built to demonstrate the exact failure mode this function used to have:
 * كتب (surah 1) is a strong, significant signal; عمر (surahs 2 and 3) is
 * the "evidence of nothing" case -- a ratio of 4.0x, on 3 occurrences,
 * that the OLD ratio-only method would have surfaced, but that does not
 * clear even an uncorrected p<0.05, let alone the per-surah
 * Bonferroni-corrected threshold this function now requires. ملك is a
 * boring filler present everywhere in roughly its average proportion, a
 * sanity check that being merely common and merely a MIN_LOCAL_COUNT-sized
 * presence never gets a root flagged.
 *
 * rootedPerSurah: surah 1 = 12, surah 2 = 6, surah 3 = 12 (total 30).
 * globalCount: كتب = 8 (all in surah 1), عمر = 6 (3 in surah 2, 3 in surah
 * 3), ملك = 16 (4 + 3 + 9).
 *
 * Expected values independently computed in Python (a from-scratch
 * reimplementation of the 2x2 G-test and its p-value, not copied from this
 * implementation):
 *   surah 1 كتب: a=8,b=0,c=12,d=18 -> g2=14.660652, p=0.000129 (significant
 *     at alpha=0.025, the 2-candidate Bonferroni threshold for this surah)
 *   surah 1 ملك: a=4,b=12,c=12,d=18 -> g2=1.595416, p=0.206554 (not significant)
 *   surah 2 عمر: a=3,b=3,c=6,d=24 -> g2=2.677723, p=0.101761, ratio=4.0
 *     (not significant -- the "evidence of nothing" case)
 *   surah 2 ملك: a=3,b=13,c=6,d=24 -> g2=0.015878, p=0.899727 (not significant)
 *   surah 3 عمر: a=3,b=3,c=12,d=18 -> g2=0.244932, p=0.620666 (not significant)
 *   surah 3 ملك: a=9,b=7,c=12,d=18 -> g2=1.714737, p=0.190372 (not significant)
 */
function rows(s: number, a: number, startW: number, root: string, count: number): string {
  return Array.from(
    { length: count },
    (_, i) => `${s}:${a}:${startW + i}:1\t${root}${i}\tN\tROOT:${root}|LEM:${root}${i}|M|NOM`,
  ).join("\n");
}

const SURAH_1_ROWS = [rows(1, 1, 1, "كتب", 8), rows(1, 2, 1, "ملك", 4)].join("\n");
const SURAH_2_ROWS = [rows(2, 1, 1, "عمر", 3), rows(2, 2, 1, "ملك", 3)].join("\n");
const SURAH_3_ROWS = [rows(3, 1, 1, "عمر", 3), rows(3, 2, 1, "ملك", 9)].join("\n");

function words() {
  return [
    ...parseMorphologyTSV(SURAH_1_ROWS),
    ...parseMorphologyTSV(SURAH_2_ROWS),
    ...parseMorphologyTSV(SURAH_3_ROWS),
  ];
}

describe("buildDistinctiveVocab", () => {
  const built = buildRoots(words(), {});
  const vocab = buildDistinctiveVocab(built.rootFiles, built.indexRoots, 3);

  it("surfaces a genuinely significant root, with its G², p-value, and ratio", () => {
    expect(vocab.bySurah[0]).toHaveLength(1);
    const row = vocab.bySurah[0][0];
    expect(row.ar).toBe("كتب");
    expect(row.localCount).toBe(8);
    expect(row.g2).toBeCloseTo(14.660652, 5);
    expect(row.p).toBeCloseTo(0.000129, 6);
    // b=0: the estimated (zero-floored) ratio, not a finite rate ÷ rate.
    expect(row.ratio).toBeGreaterThan(1);
  });

  it("excludes a root whose ratio looks big but whose significance does not clear the bar (the bug this replaced)", () => {
    // عمر's 4.0x ratio in surah 2 is exactly the shape of finding the old
    // ratio-only method surfaced and lib/stats/keyness.ts's own module
    // comment calls "evidence of nothing" -- it must not appear here.
    expect(vocab.bySurah[1].some((r) => r.ar === "عمر")).toBe(false);
  });

  it("does not flag a boring, evenly-distributed filler root anywhere", () => {
    expect(vocab.bySurah[0].some((r) => r.ar === "ملك")).toBe(false);
    expect(vocab.bySurah[1].some((r) => r.ar === "ملك")).toBe(false);
    expect(vocab.bySurah[2].some((r) => r.ar === "ملك")).toBe(false);
  });

  it("leaves a surah's list empty when nothing clears the significance bar", () => {
    // Neither عمر nor ملك is significant in surah 2 or surah 3 -- an empty
    // list is the correct, honest answer, not a forced top-N of noise.
    expect(vocab.bySurah[1]).toEqual([]);
    expect(vocab.bySurah[2]).toEqual([]);
  });

  it("has one entry per surah, up to totalSurahs", () => {
    expect(vocab.bySurah).toHaveLength(3);
  });
});
