import { inScope, type Scope, type VerseRef } from "./scope";

/**
 * A similarity pair already IS two verse identities (VerseSimilarityPair's
 * `a`/`b`), unlike every other Insights tool scoped so far -- there is no
 * count to restrict, only a membership question: does this pair belong to
 * the chosen scope at all? Two different questions answer to "belong":
 *
 * - "both": internal parallelism -- does this passage echo ITSELF? Every
 *   pair where both verses fall inside the scope.
 * - "either": external echo -- does anything in this passage recall a
 *   verse ELSEWHERE in the Qur'an? Every pair touching the scope at all.
 *
 * VerseSimilarityFile is not truncated to a top-N the way Formulas is
 * (every pair clearing the shared-root/Jaccard floor ships, ~1,000
 * pairs), and Jaccard is a property of the pair itself, not a
 * corpus-wide rate like Collocations' PMI -- so unlike those two tools,
 * scoping this has no caveat to document: what a scope shows here is
 * exactly what exists in that scope, nothing is hidden or approximated.
 */
export type SimilarityScopeMode = "both" | "either";

export function pairInScope(
  scope: Scope,
  refA: VerseRef,
  refB: VerseRef,
  mode: SimilarityScopeMode,
): boolean {
  const aIn = inScope(scope, refA);
  const bIn = inScope(scope, refB);
  return mode === "both" ? aIn && bIn : aIn || bIn;
}
