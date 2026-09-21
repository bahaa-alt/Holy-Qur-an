import { buildVerseRefs, inScope, type Scope, type VerseRef } from "./scope";
import type { MetaFile } from "@/lib/data/types";

/**
 * Resolves a scope, plus the letters tab's own extra "narrow to a single
 * ayah" refinement (meaningful only when scope.kind === "surah" -- see
 * LetterFrequencyExplorer's doc comment for why that refinement exists
 * outside the shared Scope type), to the exact verse refs it covers. The
 * caller fetches whichever surahs those refs touch and keeps only the
 * matching verses -- one path for every scope kind, a juz' mid-surah split
 * included, since inScope() already handles that.
 */
export function letterFrequencyRefs(
  meta: MetaFile,
  scope: Scope,
  ayahNum: number | null,
): VerseRef[] {
  if (ayahNum !== null && scope.kind === "surah") {
    return [{ s: scope.n, a: ayahNum }];
  }
  return buildVerseRefs(meta).filter((r) => inScope(scope, r));
}
