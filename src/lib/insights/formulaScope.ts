import { inScope, type Scope } from "./scope";
import type { FormulaRow } from "@/lib/data/types";

export interface ScopedFormulaRow extends FormulaRow {
  /** this phrase's occurrence count restricted to `scope`; equals `count` when scope is the whole Qur'an */
  scopedCount: number;
}

/**
 * Formula-phrase counts restricted to a scope, from the refs each row
 * already ships uncapped (see FormulaRow) -- no data or build change
 * needed, the same as Collocations.
 *
 * UNLIKE COLLOCATIONS, THIS CANNOT SURFACE A PHRASE A SCOPE MADE
 * FORMULAIC. build-formulas.ts keeps only each length's top 25 phrases
 * by WHOLE-QUR'AN count (after its own per-length minimum), so a phrase
 * common within one surah but too rare corpus-wide to clear that cut is
 * not in `rows` at any scope -- there is no per-scope recomputation of
 * which phrases exist, only of how often an already-listed one recurs
 * in the chosen scope. The caller says so.
 *
 * Rows with zero occurrences in scope are dropped -- a phrase cannot
 * rank if it never happened here.
 */
export function scopedFormulaRows(rows: readonly FormulaRow[], scope: Scope): ScopedFormulaRow[] {
  return rows
    .map((row) => ({ ...row, scopedCount: row.refs.filter((ref) => inScope(scope, ref)).length }))
    .filter((row) => row.scopedCount > 0);
}
