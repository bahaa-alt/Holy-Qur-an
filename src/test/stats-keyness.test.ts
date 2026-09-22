import { describe, expect, it } from "vitest";
import {
  benjaminiHochberg,
  bonferroniAlpha,
  chiSquarePValue1df,
  contingencyG2,
  G2_CRITICAL,
  keyness,
  logLikelihood,
  logRatio,
  logRatioCI,
  wilsonInterval,
} from "@/lib/stats/keyness";

/**
 * Expected values computed independently (Python, math.log / math.erfc)
 * rather than from this implementation, so the test can fail.
 */
describe("logLikelihood", () => {
  it("matches the worked example: 100/1,000 against 200/10,000", () => {
    expect(logLikelihood({ a: 100, b: 200, c: 1000, d: 10000 })).toBeCloseTo(135.79462550451632, 9);
  });

  it("is zero when the two rates are identical", () => {
    expect(logLikelihood({ a: 100, b: 1000, c: 1000, d: 10000 })).toBeCloseTo(0, 12);
  });

  it("handles an item absent from the reference", () => {
    expect(logLikelihood({ a: 10, b: 0, c: 1000, d: 10000 })).toBeCloseTo(47.95790545596741, 9);
  });

  it("is unsigned: under-use is as surprising as over-use", () => {
    // 2 per 1,000 against 200 per 10,000 -- four times RARER here.
    expect(logLikelihood({ a: 2, b: 200, c: 1000, d: 10000 })).toBeCloseTo(25.275038604291186, 9);
  });

  it("returns 0 rather than NaN for an empty corpus", () => {
    expect(logLikelihood({ a: 0, b: 0, c: 0, d: 0 })).toBe(0);
    expect(logLikelihood({ a: 5, b: 5, c: 100, d: 0 })).toBe(0);
  });
});

describe("logRatio", () => {
  it("counts doublings", () => {
    // 10 per 1,000 vs 20 per 10,000 = five times as common = log2(5).
    expect(logRatio({ a: 100, b: 200, c: 1000, d: 10000 })).toEqual({
      value: 2.321928094887362,
      estimated: false,
    });
    expect(logRatio({ a: 2, b: 200, c: 1000, d: 10000 }).value).toBeCloseTo(-3.321928094887362, 12);
  });

  it("floors a zero count to 0.5 and says that it did", () => {
    const r = logRatio({ a: 10, b: 0, c: 1000, d: 10000 });
    expect(r.estimated).toBe(true);
    expect(r.value).toBeCloseTo(7.643856189774724, 9);
  });

  it("is independent of corpus size, unlike G²", () => {
    const small = logRatio({ a: 10, b: 20, c: 100, d: 1000 }).value;
    const big = logRatio({ a: 1000, b: 2000, c: 10000, d: 100000 }).value;
    expect(small).toBeCloseTo(big, 12);
    // ... whereas the significance measure grows with the evidence.
    expect(logLikelihood({ a: 1000, b: 2000, c: 10000, d: 100000 })).toBeGreaterThan(
      logLikelihood({ a: 10, b: 20, c: 100, d: 1000 }),
    );
  });
});

describe("contingencyG2", () => {
  /**
   * Expected values independently computed in Python (a from-scratch
   * reimplementation of the standard 2x2 G-test of independence, not
   * copied from this module) so the test can fail.
   */
  it("matches an independently computed worked example with a real association", () => {
    expect(contingencyG2({ both: 10, onlyFirst: 90, onlySecond: 40, neither: 860 })).toBeCloseTo(
      4.737383864602785,
      9,
    );
  });

  it("is zero when the two items are perfectly independent (proportional cells)", () => {
    expect(contingencyG2({ both: 50, onlyFirst: 50, onlySecond: 50, neither: 50 })).toBeCloseTo(0, 9);
  });

  it("matches an independently computed small-count example", () => {
    expect(contingencyG2({ both: 2, onlyFirst: 8, onlySecond: 3, neither: 87 })).toBeCloseTo(
      3.3889459168692744,
      9,
    );
  });

  it("handles a zero cell without producing NaN", () => {
    expect(contingencyG2({ both: 0, onlyFirst: 100, onlySecond: 50, neither: 850 })).toBeCloseTo(
      10.824007374215904,
      9,
    );
  });

  it("returns 0 rather than NaN for an empty table", () => {
    expect(contingencyG2({ both: 0, onlyFirst: 0, onlySecond: 0, neither: 0 })).toBe(0);
  });

  it("grows with the strength of association, holding marginals fixed", () => {
    // Row/col totals fixed at 60/40 and 60/40 out of 100 throughout (the
    // independence point is both=36); moving `both` further above that
    // point in the same direction must only increase G².
    const atIndependence = contingencyG2({ both: 36, onlyFirst: 24, onlySecond: 24, neither: 16 });
    const weak = contingencyG2({ both: 40, onlyFirst: 20, onlySecond: 20, neither: 20 });
    const strong = contingencyG2({ both: 50, onlyFirst: 10, onlySecond: 10, neither: 30 });
    expect(atIndependence).toBeCloseTo(0, 9);
    expect(strong).toBeGreaterThan(weak);
    expect(weak).toBeGreaterThan(atIndependence);
  });
});

describe("logRatioCI", () => {
  /**
   * Expected values independently computed in Python (math.log/math.sqrt),
   * written from the Katz (1978) formula directly rather than copied from
   * this implementation, so the test can actually fail.
   */
  it("brackets the point estimate for the standard fixture (a=100,b=200,c=1000,d=10000)", () => {
    const ci = logRatioCI({ a: 100, b: 200, c: 1000, d: 10000 });
    expect(ci.low).toBeCloseTo(1.9885553966745007, 9);
    expect(ci.high).toBeCloseTo(2.6553007931002237, 9);
    expect(ci.estimated).toBe(false);
    const point = logRatio({ a: 100, b: 200, c: 1000, d: 10000 }).value;
    expect(ci.low).toBeLessThan(point);
    expect(ci.high).toBeGreaterThan(point);
  });

  it("floors a zero count and marks the interval as estimated", () => {
    const ci = logRatioCI({ a: 0, b: 200, c: 1000, d: 10000 });
    expect(ci.low).toBeCloseTo(-9.324698246420919, 9);
    expect(ci.high).toBeCloseTo(-1.3191579433538068, 9);
    expect(ci.estimated).toBe(true);
  });

  it("is symmetric around zero when the two rates are equal", () => {
    const ci = logRatioCI({ a: 20, b: 20, c: 1000, d: 1000 });
    expect(ci.low).toBeCloseTo(-0.8851883057620608, 9);
    expect(ci.high).toBeCloseTo(0.8851883057620608, 9);
  });

  it("narrows as counts grow, for the same underlying rates", () => {
    const small = logRatioCI({ a: 100, b: 200, c: 1000, d: 10000 });
    const big = logRatioCI({ a: 1000, b: 2000, c: 10000, d: 100000 });
    expect(big.high).toBeCloseTo(2.427349798494221, 9);
    expect(big.low).toBeCloseTo(2.2165063912805034, 9);
    expect(big.high - big.low).toBeLessThan(small.high - small.low);
  });

  it("returns a degenerate interval for an empty corpus rather than dividing by zero", () => {
    expect(logRatioCI({ a: 0, b: 0, c: 0, d: 0 })).toEqual({ low: 0, high: 0, estimated: false });
  });
});

describe("chiSquarePValue1df", () => {
  it("reproduces the textbook critical values", () => {
    expect(chiSquarePValue1df(3.841459)).toBeCloseTo(0.05, 6);
    expect(chiSquarePValue1df(6.634897)).toBeCloseTo(0.01, 6);
    expect(chiSquarePValue1df(10.827566)).toBeCloseTo(0.001, 6);
  });

  it("agrees with the thresholds the UI prints", () => {
    expect(chiSquarePValue1df(G2_CRITICAL.p05)).toBeLessThan(0.05);
    expect(chiSquarePValue1df(G2_CRITICAL.p01)).toBeLessThan(0.01);
    expect(chiSquarePValue1df(G2_CRITICAL.p001)).toBeLessThan(0.001);
  });

  it("is 1 at zero and tiny for a large statistic", () => {
    expect(chiSquarePValue1df(0)).toBe(1);
    expect(chiSquarePValue1df(-1)).toBe(1);
    expect(chiSquarePValue1df(135.79462550451632)).toBeLessThan(1e-30);
  });
});

describe("bonferroniAlpha", () => {
  it("divides the error budget across the tests actually run", () => {
    // One test per root: at plain p<0.05, ~82 of 1,651 roots would clear
    // the bar by chance. That is the whole reason this is shown.
    expect(bonferroniAlpha(1651)).toBeCloseTo(0.05 / 1651, 12);
    expect(bonferroniAlpha(0)).toBe(0.05);
  });
});

describe("wilsonInterval", () => {
  it("matches the textbook n=100, p=0.5 example", () => {
    // Independently computed from the textbook formula (Newcombe 1998),
    // written from scratch rather than copied from this implementation:
    // roughly [0.404, 0.596], symmetric around 0.5 as this case must be.
    const ci = wilsonInterval(50, 100);
    expect(ci.low).toBeCloseTo(0.40383153036599567, 12);
    expect(ci.high).toBeCloseTo(0.59616846963400438, 12);
    expect(ci.low + ci.high).toBeCloseTo(1, 12);
  });

  it("narrows as the sample grows, centered on the same rate", () => {
    const small = wilsonInterval(10, 100);
    const big = wilsonInterval(100, 1000);
    expect(small.high - small.low).toBeGreaterThan(big.high - big.low);
  });

  it("stays inside [0, 1] even at the extremes, unlike the normal approximation", () => {
    const zero = wilsonInterval(0, 20);
    expect(zero.low).toBe(0);
    expect(zero.high).toBeGreaterThan(0);
    expect(zero.high).toBeLessThan(1);

    const all = wilsonInterval(20, 20);
    expect(all.high).toBe(1);
    expect(all.low).toBeLessThan(1);
    expect(all.low).toBeGreaterThan(0);
  });

  it("returns a degenerate interval for an empty sample rather than dividing by zero", () => {
    expect(wilsonInterval(0, 0)).toEqual({ low: 0, high: 0 });
  });
});

describe("benjaminiHochberg", () => {
  it("matches the textbook worked example", () => {
    // p = [0.01, 0.02, 0.03, 0.04, 0.9], alpha = 0.05: thresholds are
    // (rank/5)*0.05 = [0.01, 0.02, 0.03, 0.04, 0.05]. Every p up through
    // rank 4 sits exactly on its threshold; rank 5 (0.9) blows through.
    const r = benjaminiHochberg([0.01, 0.02, 0.03, 0.04, 0.9]);
    expect(r.significant).toEqual([true, true, true, true, false]);
    expect(r.thresholdP).toBeCloseTo(0.04, 12);
    // q-values computed by hand from the running-minimum pass: the first
    // four all resolve to 0.05 (each row's raw m*p/rank is exactly 0.05),
    // the last is its own raw value, 0.9.
    expect(r.qValues[0]).toBeCloseTo(0.05, 12);
    expect(r.qValues[3]).toBeCloseTo(0.05, 12);
    expect(r.qValues[4]).toBeCloseTo(0.9, 12);
  });

  it("has more power than Bonferroni on the same batch of moderate p-values", () => {
    // 20 tests, 5 of them genuinely small (0.001-0.005), the rest noise
    // near 1. Bonferroni's flat 0.05/20 = 0.0025 catches only the very
    // smallest; BH's rank-dependent threshold should catch more of them.
    const real = [0.001, 0.002, 0.003, 0.004, 0.005];
    const noise = Array.from({ length: 15 }, (_, i) => 0.5 + i * 0.03);
    const pValues = [...real, ...noise];
    const bonferroniAlphaHere = bonferroniAlpha(pValues.length);
    const bonferroniHits = pValues.filter((p) => p < bonferroniAlphaHere).length;
    const bh = benjaminiHochberg(pValues);
    const bhHits = bh.significant.filter(Boolean).length;
    expect(bhHits).toBeGreaterThanOrEqual(bonferroniHits);
    // Every real effect survives BH; none of the noise does.
    expect(bh.significant.slice(0, 5).every(Boolean)).toBe(true);
    expect(bh.significant.slice(5).some(Boolean)).toBe(false);
  });

  it("is monotonic: the smallest p-value never gets a larger q-value than a bigger one", () => {
    const r = benjaminiHochberg([0.2, 0.001, 0.15, 0.04, 0.3]);
    const sorted = [...r.qValues].sort((a, b) => a - b);
    // q-values, re-sorted, must line up with p-values re-sorted the same way.
    const byP = [0.001, 0.04, 0.15, 0.2, 0.3].map(
      (p) => r.qValues[[0.2, 0.001, 0.15, 0.04, 0.3].indexOf(p)],
    );
    expect(byP).toEqual(sorted);
  });

  it("calls nothing significant when nothing survives, without crashing on an empty input", () => {
    expect(benjaminiHochberg([]).significant).toEqual([]);
    expect(benjaminiHochberg([]).thresholdP).toBe(0);
    const r = benjaminiHochberg([0.9, 0.8, 0.99]);
    expect(r.significant).toEqual([false, false, false]);
    expect(r.thresholdP).toBe(0);
  });
});

describe("keyness", () => {
  it("reports significance, effect size and direction together", () => {
    const k = keyness({ a: 100, b: 200, c: 1000, d: 10000 });
    expect(k.g2).toBeCloseTo(135.79462550451632, 9);
    expect(k.logRatio).toBeCloseTo(2.321928094887362, 12);
    expect(k.overused).toBe(true);
    expect(k.rate).toBeCloseTo(1000, 9); // per 10,000 tokens
    expect(k.referenceRate).toBeCloseTo(200, 9);
    expect(k.expected).toBeCloseTo(27.272727272727273, 9);
    expect(k.p).toBeLessThan(1e-30);
  });

  it("reports a 95% confidence interval on the log ratio, bracketing the point estimate", () => {
    const k = keyness({ a: 100, b: 200, c: 1000, d: 10000 });
    const raw = logRatioCI({ a: 100, b: 200, c: 1000, d: 10000 });
    expect(k.logRatioCI).toEqual({ low: raw.low, high: raw.high });
    expect(k.logRatioCI.low).toBeLessThan(k.logRatio);
    expect(k.logRatioCI.high).toBeGreaterThan(k.logRatio);
  });

  it("reports a 95% Wilson interval on the rate, in the same per-10k units", () => {
    const k = keyness({ a: 100, b: 200, c: 1000, d: 10000 });
    // rate is 1000 per 10k (a/c = 100/1000); the interval should bracket it
    // and match wilsonInterval(100, 1000) scaled by 10,000.
    const raw = wilsonInterval(100, 1000);
    expect(k.rateCI.low).toBeCloseTo(raw.low * 10_000, 9);
    expect(k.rateCI.high).toBeCloseTo(raw.high * 10_000, 9);
    expect(k.rateCI.low).toBeLessThan(k.rate);
    expect(k.rateCI.high).toBeGreaterThan(k.rate);
  });

  it("marks under-use, where the ratio is negative and the rate lower", () => {
    const k = keyness({ a: 2, b: 200, c: 1000, d: 10000 });
    expect(k.overused).toBe(false);
    expect(k.logRatio).toBeLessThan(0);
    expect(k.g2).toBeGreaterThan(G2_CRITICAL.p001);
  });

  it("separates a big effect from a significant one", () => {
    // Tiny corpus, huge ratio, not significant.
    const loud = keyness({ a: 3, b: 1, c: 20, d: 1000 });
    // Large corpus, small ratio, overwhelmingly significant.
    const solid = keyness({ a: 1200, b: 10000, c: 100000, d: 1000000 });
    expect(loud.logRatio).toBeGreaterThan(solid.logRatio);
    expect(loud.g2).toBeLessThan(solid.g2);
  });
});
