/**
 * Keyness: is this word characteristic of THIS part of the corpus?
 *
 * WHY THIS EXISTS, AND WHAT IT REPLACES. The old /insights/ ranked a
 * surah's "distinctive vocabulary" by rate ratio alone -- local rate
 * divided by corpus rate, with a floor of three occurrences. A ratio says
 * how big a difference looks; it says nothing about whether the difference
 * is bigger than chance. Three occurrences in a twenty-word surah is a
 * ratio of thirty and evidence of nothing.
 *
 * So this module reports the pair that corpus linguistics settled on:
 *
 *   - LOG-LIKELIHOOD (G²) -- Dunning (1993), as used by Rayson & Garside
 *     (2000) and by every concordancer since. It answers "how surprising
 *     is this difference, given the amount of text involved". It is a
 *     significance measure, so it grows with corpus size: a huge G² on a
 *     tiny effect is real but may be uninteresting.
 *   - LOG RATIO -- Hardie (2014). It answers "how big is the difference",
 *     in doublings: +1 means twice as common here, +3 means eight times.
 *     It is an effect size, so it is independent of corpus size and is
 *     unstable on small counts.
 *
 * Neither is enough alone, which is the point of reporting both. A word
 * that is significant AND has a large effect is a finding; a word that is
 * significant with a log ratio of 0.2 is a rounding error the size of the
 * corpus made visible.
 */

/** The 2×2 contingency a keyness test is computed from. */
export interface KeynessInput {
  /** occurrences in the scope under study */
  a: number;
  /** occurrences in the reference (everything else) */
  b: number;
  /** total tokens in the scope */
  c: number;
  /** total tokens in the reference */
  d: number;
}

export interface Keyness {
  /** log-likelihood G², always ≥ 0; direction is in `overused` */
  g2: number;
  /** effect size in doublings: +1 = twice as common in the scope */
  logRatio: number;
  /** true when the scope's rate exceeds the reference's */
  overused: boolean;
  /** how many occurrences the scope's size would predict */
  expected: number;
  /** occurrences per 10,000 tokens, in the scope and in the reference */
  rate: number;
  referenceRate: number;
  /** 95% Wilson score interval on `rate`/`referenceRate`, same units (per 10,000 tokens) */
  rateCI: WilsonInterval;
  referenceRateCI: WilsonInterval;
  /** p-value for g2 at 1 degree of freedom */
  p: number;
  /**
   * True when a zero count was floored to 0.5 to keep the log ratio
   * finite (Hardie 2014). The G² is computed from the real counts, so
   * only the effect size is affected -- but it is an estimate, and a
   * caller that prints it should say so.
   */
  logRatioEstimated: boolean;
}

/** Counts below this are too small for the test to mean much; see the UI's floor. */
export const DEFAULT_MIN_COUNT = 5;

/**
 * Critical G² values at 1 degree of freedom, for the usual thresholds.
 * Reported so a reader can see where a row falls without reading a
 * p-value in scientific notation. Rounded UP, not to the nearest: a value
 * printed as "p < 0.05" has to actually be under 0.05, and 3.84 is not.
 */
export const G2_CRITICAL = {
  p05: 3.8415,
  p01: 6.6349,
  p001: 10.8276,
} as const;

/**
 * Log-likelihood G² for a 2×2 contingency table (Dunning 1993).
 *
 * Returned unsigned: it measures surprise, not direction. `keyness()`
 * pairs it with `overused`.
 */
export function logLikelihood({ a, b, c, d }: KeynessInput): number {
  if (c <= 0 || d <= 0) return 0;
  const total = c + d;
  const expectedA = (c * (a + b)) / total;
  const expectedB = (d * (a + b)) / total;
  let sum = 0;
  // A zero observed count contributes nothing: lim x→0 of x·ln(x/E) is 0.
  if (a > 0 && expectedA > 0) sum += a * Math.log(a / expectedA);
  if (b > 0 && expectedB > 0) sum += b * Math.log(b / expectedB);
  return 2 * sum;
}

/**
 * Log ratio (Hardie 2014): the difference in relative frequency, in
 * doublings. A zero count is floored to 0.5 so the value stays finite --
 * the alternative is an infinity that sorts to the top of every table.
 */
export function logRatio({ a, b, c, d }: KeynessInput): { value: number; estimated: boolean } {
  if (c <= 0 || d <= 0) return { value: 0, estimated: false };
  const estimated = a === 0 || b === 0;
  const safeA = a === 0 ? 0.5 : a;
  const safeB = b === 0 ? 0.5 : b;
  return { value: Math.log2(safeA / c / (safeB / d)), estimated };
}

export interface WilsonInterval {
  low: number;
  high: number;
}

/** z for a two-sided 95% interval (Φ⁻¹(0.975)), to full double precision. */
const Z_95 = 1.959963984540054;

/**
 * Wilson score interval (Wilson 1927) for a binomial proportion, at 95%
 * confidence. A rate on its own is a point estimate; a reader deciding
 * whether "312 per 10,000 here vs 180 elsewhere" is a real difference or
 * two overlapping ranges of uncertainty needs the interval, not just the
 * point.
 *
 * Preferred over the textbook normal ("Wald") interval because it stays
 * inside [0, 1] and keeps its stated coverage even for the small,
 * skewed counts a keyness table runs on -- exactly where the Wald
 * interval is known to fail (it can extend below 0 or above 1, and its
 * true coverage drifts well under 95% for small n or p near 0 or 1).
 */
export function wilsonInterval(successes: number, total: number, z: number = Z_95): WilsonInterval {
  if (total <= 0) return { low: 0, high: 0 };
  const p = successes / total;
  const z2 = z * z;
  const denom = 1 + z2 / total;
  const center = p + z2 / (2 * total);
  const margin = z * Math.sqrt(p * (1 - p) / total + z2 / (4 * total * total));
  return {
    low: Math.max(0, (center - margin) / denom),
    high: Math.min(1, (center + margin) / denom),
  };
}

/**
 * The complementary error function, Numerical Recipes' Chebyshev fit.
 * Fractional error below 1.2e-7 everywhere, which is far finer than any
 * p-value this page displays.
 */
function erfc(x: number): number {
  const z = Math.abs(x);
  const t = 2 / (2 + z);
  const ty = 4 * t - 2;
  const coeffs = [
    -1.3026537197817094, 6.4196979235649026e-1, 1.9476473204185836e-2, -9.561514786808631e-3,
    -9.46595344482036e-4, 3.66839497852761e-4, 4.2523324806907e-5, -2.0278578112534e-5,
    -1.624290004647e-6, 1.30365583558e-6, 1.5626441722e-8, -8.5238095915e-8, 6.529054439e-9,
    5.059343495e-9, -9.91364156e-10, -2.27365122e-10, 9.6467911e-11, 2.394038e-12, -6.886027e-12,
    8.94487e-13, 3.13092e-13, -1.12708e-13, 3.81e-16, 7.106e-15,
  ];
  let d = 0;
  let dd = 0;
  for (let j = coeffs.length - 1; j > 0; j--) {
    const tmp = d;
    d = ty * d - dd + coeffs[j];
    dd = tmp;
  }
  const ans = t * Math.exp(-z * z + 0.5 * (coeffs[0] + ty * d) - dd);
  return x >= 0 ? ans : 2 - ans;
}

/**
 * The p-value of a G² at 1 degree of freedom.
 *
 * For 1 df the chi-square survival function is exactly erfc(√(x/2)),
 * which avoids pulling in a gamma function for the one case this app
 * needs.
 */
export function chiSquarePValue1df(x: number): number {
  if (!(x > 0)) return 1;
  return erfc(Math.sqrt(x / 2));
}

/**
 * The Bonferroni-corrected threshold for `tests` simultaneous comparisons.
 *
 * A keyness table runs one test per root -- 1,651 of them. At p < 0.05,
 * 82 roots would clear the bar by chance alone. Showing that threshold is
 * the difference between a table of findings and a table of noise.
 */
export function bonferroniAlpha(tests: number, alpha = 0.05): number {
  return tests > 0 ? alpha / tests : alpha;
}

/** The full keyness picture for one item. See the module comment. */
export function keyness(input: KeynessInput): Keyness {
  const { a, b, c, d } = input;
  const g2 = logLikelihood(input);
  const lr = logRatio(input);
  const rate = c > 0 ? (a / c) * 10_000 : 0;
  const referenceRate = d > 0 ? (b / d) * 10_000 : 0;
  const rateCI = wilsonInterval(a, c);
  const referenceRateCI = wilsonInterval(b, d);
  return {
    g2,
    logRatio: lr.value,
    logRatioEstimated: lr.estimated,
    overused: rate >= referenceRate,
    expected: c + d > 0 ? (c * (a + b)) / (c + d) : 0,
    rate,
    referenceRate,
    rateCI: { low: rateCI.low * 10_000, high: rateCI.high * 10_000 },
    referenceRateCI: { low: referenceRateCI.low * 10_000, high: referenceRateCI.high * 10_000 },
    p: chiSquarePValue1df(g2),
  };
}

export interface FdrResult {
  /** Benjamini-Hochberg q-value per input p-value, same order as input */
  qValues: number[];
  /** whether each p-value is significant at `alpha` under BH, same order as input */
  significant: boolean[];
  /**
   * The largest raw p-value BH still calls significant (0 when none are).
   * BH significance turns out to be exactly "p <= this one number" once
   * computed, because p-values are tested in ascending order and the
   * per-rank threshold only grows -- so this can stand in for
   * `bonferroniAlpha` anywhere that wants a single cutoff to display
   * against (see CompareTab, which lets the reader pick either).
   */
  thresholdP: number;
}

/**
 * Benjamini-Hochberg (1995) false discovery rate control.
 *
 * Bonferroni bounds the probability of ANY false positive among all
 * tests -- exactly one error, anywhere, at the stated rate. That is the
 * right guarantee for a single make-or-break claim, but it is very
 * conservative across 1,651 simultaneous root comparisons: real,
 * moderate effects get buried along with the noise. BH instead bounds
 * the EXPECTED PROPORTION of false positives among the roots it calls
 * significant, which trades a small, known amount of that guarantee for
 * substantially more power to find real effects -- the field's current
 * default recommendation for a comparison at this scale.
 *
 * Standard step-up procedure: sort p-values ascending, find the largest
 * rank k with p(k) <= (k/m)*alpha, and call every p-value at or below
 * that rank significant. q-values (the smallest FDR at which a given
 * p-value would be called significant) are computed by the usual
 * running-minimum pass from the largest rank down, which keeps them
 * monotonic the way Benjamini & Hochberg's own definition requires.
 */
export function benjaminiHochberg(pValues: readonly number[], alpha = 0.05): FdrResult {
  const m = pValues.length;
  const indexed = pValues.map((p, i) => ({ p, i })).sort((x, y) => x.p - y.p);
  const qValues = new Array<number>(m);
  const significant = new Array<boolean>(m).fill(false);

  let largestSigRank = 0;
  for (let rank = m; rank >= 1; rank--) {
    if (indexed[rank - 1].p <= (rank / m) * alpha) {
      largestSigRank = rank;
      break;
    }
  }
  for (let rank = 1; rank <= largestSigRank; rank++) {
    significant[indexed[rank - 1].i] = true;
  }
  const thresholdP = largestSigRank > 0 ? indexed[largestSigRank - 1].p : 0;

  let runningMin = 1;
  for (let rank = m; rank >= 1; rank--) {
    const { p, i } = indexed[rank - 1];
    runningMin = Math.min(runningMin, (p * m) / rank);
    qValues[i] = runningMin;
  }

  return { qValues, significant, thresholdP };
}
