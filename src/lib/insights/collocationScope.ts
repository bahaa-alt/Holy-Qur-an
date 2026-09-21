import { inScope, type Scope } from "./scope";
import type { VerbPrepositionRow } from "@/lib/data/types";

export interface ScopedCollocationRow extends VerbPrepositionRow {
  /** this combo's occurrence count restricted to `scope`; equals `count` when scope is the whole Qur'an */
  scopedCount: number;
}

/**
 * Verb+preposition counts restricted to a scope, from the refs the build
 * already stores per combo (see CollocationsFile) -- no data or build
 * change needed, since every occurrence already carries its own s/a.
 *
 * PMI IS DELIBERATELY NOT RECOMPUTED HERE. build-collocations.ts defines
 * it over "the space of tracked-verb occurrences that have any following
 * word", a quantity this file does not ship per combo -- only the
 * combo's own refs are here, not the denominator's. Approximating PMI
 * from combo refs alone would silently mean something different at every
 * scope (a narrower, non-comparable "space"), which is worse than simply
 * not showing a number: a researcher would take it for the same
 * statistic the whole-Qur'an figure names. The caller shows PMI only at
 * whole-Qur'an scope and shows this scoped count everywhere.
 *
 * Rows with zero occurrences in scope are dropped -- a combo cannot rank
 * if it never happened here.
 */
export function scopedCollocationRows(
  rows: readonly VerbPrepositionRow[],
  scope: Scope,
): ScopedCollocationRow[] {
  return rows
    .map((row) => ({ ...row, scopedCount: row.refs.filter((ref) => inScope(scope, ref)).length }))
    .filter((row) => row.scopedCount > 0);
}
