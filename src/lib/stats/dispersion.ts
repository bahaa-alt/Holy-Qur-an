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
