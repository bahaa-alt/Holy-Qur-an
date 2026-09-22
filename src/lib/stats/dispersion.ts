/**
 * Dispersion: is this word spread through the book, or piled in one place?
 *
 * THE NUMBER THE OLD /insights/ WAS MISSING. A root occurring 300 times
 * across eighty surahs and a root occurring 300 times inside one passage
 * were indistinguishable everywhere in this app: both read "300". They
 * are not the same fact about the Qur'an. One is part of the book's
 * ordinary vocabulary; the other belongs to a single subject, and its
 * count is really a fact about that passage.
 *
 * The page previously approximated this with "how many surahs does this
 * root appear in", as a top-fifteen list. Range is a start, but it counts
 * a single stray occurrence in a surah the same as a hundred, and it
 * ignores that surahs differ in length by two orders of magnitude.
 *
 * DP (Gries 2008, "Dispersions and adjusted frequencies in corpora")
 * fixes both: it compares how the occurrences are actually distributed
 * across parts against how the parts' SIZES say they should be.
 */

export interface Dispersion {
  /**
   * Deviation of proportions, 0 to 1 − min(expected).
   * 0 = spread exactly in proportion to the parts' sizes.
   * High = concentrated in few parts.
   */
  dp: number;
  /**
   * DP scaled onto 0..1 by its own maximum, so values are comparable
   * between corpora with differently-sized parts (Gries's DPnorm). With
   * 114 surahs of very unequal length the two differ little, but the
   * unnormalized figure has no fixed ceiling and invites false precision.
   */
  dpNorm: number;
  /** how many parts the item occurs in at all */
  range: number;
  /** total occurrences, for convenience */
  total: number;
}

/**
 * DP for one item.
 *
 * @param counts      occurrences in each part, in part order
 * @param partSizes   the size of each part, same order and length
 *
 * Parts of size zero are skipped: they can neither expect nor receive
 * occurrences, and including them would inflate every item's DP equally.
 */
export function dispersion(counts: readonly number[], partSizes: readonly number[]): Dispersion {
  if (counts.length !== partSizes.length) {
    throw new Error(
      `dispersion: ${counts.length} counts but ${partSizes.length} part sizes; they must line up`,
    );
  }

  let total = 0;
  let sizeTotal = 0;
  let range = 0;
  for (let i = 0; i < counts.length; i++) {
    if (partSizes[i] <= 0) continue;
    total += counts[i];
    sizeTotal += partSizes[i];
    if (counts[i] > 0) range += 1;
  }
  if (total === 0 || sizeTotal === 0) return { dp: 0, dpNorm: 0, range: 0, total: 0 };

  let sum = 0;
  let minExpected = 1;
  for (let i = 0; i < counts.length; i++) {
    if (partSizes[i] <= 0) continue;
    const expected = partSizes[i] / sizeTotal;
    const observed = counts[i] / total;
    sum += Math.abs(observed - expected);
    if (expected < minExpected) minExpected = expected;
  }

  const dp = sum / 2;
  // The ceiling: everything in the smallest part. Guard the degenerate
  // single-part case, where no dispersion is measurable at all.
  const max = 1 - minExpected;
  return { dp, dpNorm: max > 0 ? Math.min(dp / max, 1) : 0, range, total };
}

/** A tiny deterministic PRNG (mulberry32), so re-running the same test with
 *  the same seed reproduces the same p-value rather than drifting with
 *  Math.random() -- a permutation test whose result changes on refresh
 *  would undermine exactly the reproducibility this tool is for. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface PermutationTestResult {
  observedDp: number;
  /** Monte Carlo p-value: how often the null process alone produces a DP
   *  at least this high, add-one smoothed (North et al. 2002) so it is
   *  never reported as exactly 0. */
  p: number;
  permutations: number;
}

/**
 * A permutation (Monte Carlo) significance test for DP.
 *
 * DP on its own is descriptive: it says how far the observed spread is
 * from proportional to each part's size, but not whether that gap is
 * bigger than what pure chance would produce anyway -- a root occurring
 * only a handful of times can "concentrate" in one surah by luck alone.
 * This simulates the null hypothesis directly, `permutations` times:
 * place `total` occurrences one at a time, each independently landing in
 * a part with probability equal to that part's share of the text --
 * exactly what DP=0 assumes -- recompute DP for that simulated draw, and
 * report how often the null alone reaches a DP at least as high as what
 * was actually observed. A small p means the observed concentration is
 * unlikely to be a coincidence of where a rare word happened to land.
 *
 * Deliberately scoped to one root at a time rather than the whole table:
 * a root's `total` occurrences dominate the cost (one draw per
 * occurrence per permutation), so this is meant to be run on demand for
 * a row a reader is actually looking at, not eagerly for every row in a
 * ranked list.
 */
export function dispersionPermutationTest(
  counts: readonly number[],
  partSizes: readonly number[],
  permutations = 199,
  seed = 1,
): PermutationTestResult {
  if (counts.length !== partSizes.length) {
    throw new Error(
      `dispersionPermutationTest: ${counts.length} counts but ${partSizes.length} part sizes; they must line up`,
    );
  }
  const observed = dispersion(counts, partSizes);
  if (observed.total === 0) return { observedDp: 0, p: 1, permutations };

  // Null-hypothesis cumulative distribution: each occurrence lands in
  // part i with probability proportional to that part's size, matching
  // dispersion()'s own treatment of zero-size parts (probability 0).
  let sizeTotal = 0;
  for (const s of partSizes) if (s > 0) sizeTotal += s;
  const cumulative = new Array<number>(partSizes.length);
  let running = 0;
  for (let i = 0; i < partSizes.length; i++) {
    running += partSizes[i] > 0 ? partSizes[i] / sizeTotal : 0;
    cumulative[i] = running;
  }

  const rand = mulberry32(seed);
  const nullCounts = new Array<number>(counts.length);
  let atLeastAsExtreme = 0;
  for (let perm = 0; perm < permutations; perm++) {
    nullCounts.fill(0);
    for (let occ = 0; occ < observed.total; occ++) {
      const r = rand();
      let lo = 0;
      let hi = cumulative.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (cumulative[mid] < r) lo = mid + 1;
        else hi = mid;
      }
      nullCounts[lo]++;
    }
    if (dispersion(nullCounts, partSizes).dp >= observed.dp) atLeastAsExtreme++;
  }

  return { observedDp: observed.dp, p: (atLeastAsExtreme + 1) / (permutations + 1), permutations };
}
