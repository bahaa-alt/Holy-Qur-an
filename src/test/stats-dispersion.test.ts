import { describe, expect, it } from "vitest";
import { dispersion, dispersionPermutationTest } from "@/lib/stats/dispersion";

describe("dispersion (Gries's DP)", () => {
  it("is 0 when occurrences follow the parts' sizes exactly", () => {
    const d = dispersion([10, 20, 30, 40], [100, 200, 300, 400]);
    expect(d.dp).toBeCloseTo(0, 12);
    expect(d.dpNorm).toBeCloseTo(0, 12);
    expect(d.range).toBe(4);
    expect(d.total).toBe(100);
  });

  it("reaches its ceiling when everything sits in one part", () => {
    // All 50 occurrences in the part holding 10% of the text: by the
    // closed form, DP = 1 - 0.1.
    const d = dispersion([50, 0, 0, 0], [100, 300, 300, 300]);
    expect(d.dp).toBeCloseTo(0.9, 12);
    expect(d.range).toBe(1);
    // dpNorm divides by 1 - min(expected) = 1 - 0.1, so this IS the max.
    expect(d.dpNorm).toBeCloseTo(1, 12);
  });

  it("separates the two distributions the old page could not tell apart", () => {
    const even = dispersion([25, 25, 25, 25], [1000, 1000, 1000, 1000]);
    const clumped = dispersion([97, 1, 1, 1], [1000, 1000, 1000, 1000]);
    expect(even.total).toBe(clumped.total);
    expect(even.dp).toBeLessThan(0.05);
    expect(clumped.dp).toBeGreaterThan(0.7);
  });

  it("is not fooled by range alone: one stray hit is not spread", () => {
    // Same range (4 parts) as a genuinely even word, very different DP.
    const stray = dispersion([97, 1, 1, 1], [1000, 1000, 1000, 1000]);
    const even = dispersion([25, 25, 25, 25], [1000, 1000, 1000, 1000]);
    expect(stray.range).toBe(even.range);
    expect(stray.dp).toBeGreaterThan(even.dp);
  });

  it("weights by part size, so a hit in a long part counts differently", () => {
    // 10 occurrences all in a part that is 90% of the corpus is nearly
    // proportional; the same 10 all in a 1% part is extreme.
    const inBigPart = dispersion([10, 0], [900, 100]);
    const inSmallPart = dispersion([0, 10], [900, 100]);
    expect(inBigPart.dp).toBeCloseTo(0.1, 12);
    expect(inSmallPart.dp).toBeCloseTo(0.9, 12);
  });

  it("ignores empty parts rather than letting them inflate every item", () => {
    expect(dispersion([10, 10, 0], [100, 100, 0]).dp).toBeCloseTo(0, 12);
  });

  it("returns zeroes for an item that never occurs", () => {
    expect(dispersion([0, 0], [100, 100])).toEqual({ dp: 0, dpNorm: 0, range: 0, total: 0 });
  });

  it("refuses mismatched inputs instead of silently misaligning parts", () => {
    expect(() => dispersion([1, 2], [100])).toThrow(/line up/);
  });
});

describe("dispersionPermutationTest", () => {
  it("gives a spread-proportionally item a p-value of exactly 1", () => {
    // Observed DP is 0, the minimum any permutation's DP can be (DP >= 0
    // always) -- so literally every permuted draw is "at least as
    // extreme", deterministically, regardless of the RNG's specific draws.
    const r = dispersionPermutationTest([10, 20, 30, 40], [100, 200, 300, 400], 50);
    expect(r.observedDp).toBeCloseTo(0, 12);
    expect(r.p).toBe(1);
  });

  it("gives an extremely concentrated item a small p-value", () => {
    // All 50 occurrences in a part holding only 10% of the text: under
    // the null, ~5 occurrences are expected there (sd ~2.1), so landing
    // all 50 is many standard deviations out -- no permutation should
    // reach that DP, making p the smoothed floor 1/(permutations+1).
    const r = dispersionPermutationTest([50, 0, 0, 0], [100, 300, 300, 300], 199);
    expect(r.observedDp).toBeCloseTo(0.9, 12);
    expect(r.p).toBeCloseTo(1 / 200, 12);
  });

  it("is reproducible: the same seed gives the same result", () => {
    const a = dispersionPermutationTest([97, 1, 1, 1], [1000, 1000, 1000, 1000], 99, 42);
    const b = dispersionPermutationTest([97, 1, 1, 1], [1000, 1000, 1000, 1000], 99, 42);
    expect(a).toEqual(b);
  });

  it("returns p=1 trivially for an item that never occurs, without dividing by zero", () => {
    const r = dispersionPermutationTest([0, 0], [100, 100], 50);
    expect(r).toEqual({ observedDp: 0, p: 1, permutations: 50 });
  });

  it("refuses mismatched inputs instead of silently misaligning parts", () => {
    expect(() => dispersionPermutationTest([1, 2], [100], 10)).toThrow(/line up/);
  });
});
