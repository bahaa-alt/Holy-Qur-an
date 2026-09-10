const MS_PER_DAY = 86_400_000;

/**
 * The number of whole UTC calendar days since the Unix epoch, for `date`.
 * Used as a deterministic, ever-increasing index so "today's pick" is the
 * same for every visitor without any backend -- it only depends on the
 * clock, not on any per-user state. Defined in UTC (not the visitor's local
 * day) so it's unambiguous; a visitor near UTC midnight sees the pick
 * change at a different local hour than one far from it, which is an
 * accepted tradeoff for a no-backend "same for everyone" feature.
 */
export function daysSinceEpoch(date: Date): number {
  return Math.floor(date.getTime() / MS_PER_DAY);
}
