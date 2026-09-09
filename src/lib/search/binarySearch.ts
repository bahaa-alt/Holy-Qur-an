/**
 * Finds the [start, end) range of indices in a key-sorted array whose key
 * starts with `prefix`, via binary search for the range boundaries. `keyOf`
 * extracts the comparison key from each element. Returns [0, 0] (empty
 * range) when nothing matches.
 */
export function prefixRange<T>(sorted: readonly T[], prefix: string, keyOf: (item: T) => string): [number, number] {
  if (prefix === "") return [0, sorted.length];

  const start = lowerBound(sorted, prefix, keyOf);
  // upper bound: first index whose key does not start with `prefix` and
  // sorts after every key that does. Since keys are sorted lexicographically,
  // this is the lower bound of the prefix incremented at its last character.
  const upperBoundKey = incrementString(prefix);
  const end = upperBoundKey === null ? sorted.length : lowerBound(sorted, upperBoundKey, keyOf);

  // lowerBound(start) may land on an element that doesn't actually start
  // with prefix (if nothing matches); verify and shrink to empty range.
  if (start >= sorted.length || !keyOf(sorted[start]).startsWith(prefix)) {
    return [start, start];
  }
  return [start, end];
}

/** First index i such that keyOf(sorted[i]) >= target. */
function lowerBound<T>(sorted: readonly T[], target: string, keyOf: (item: T) => string): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (keyOf(sorted[mid]) < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Returns the lexicographically smallest string that is greater than every
 * string starting with `s`, by incrementing the last character's code
 * point. Returns null if `s` is empty (no such bound needed).
 */
function incrementString(s: string): string | null {
  if (s.length === 0) return null;
  const chars = [...s];
  const last = chars.pop()!;
  const incremented = String.fromCodePoint(last.codePointAt(0)! + 1);
  return chars.join("") + incremented;
}
