/**
 * Bar-chart width percentage (0-100) for a value that can be negative
 * (e.g. PMI), scaled across `values`'s own min/max -- a plain ratio
 * against a single positive max (the pattern used everywhere else a Bar
 * renders a count) breaks down for a metric that can go negative: a
 * negative value over a positive max, or any value when the max itself is
 * negative, no longer produces a sensible width. Falls back to a small
 * fixed minimum so a bar is never invisible.
 */
export function metricBarPct(value: number, values: readonly number[]): number {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return Math.max(((value - min) / range) * 100, 2);
}
