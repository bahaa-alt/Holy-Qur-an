import type { CardDef } from "./types";
import type { IndexLemmaRow, IndexRootRow } from "@/lib/data/types";

export function buildRootDeck(roots: readonly IndexRootRow[]): CardDef[] {
  return roots.map((r) => ({ id: `root:${r.ar}`, kind: "roots" as const, ar: r.ar, root: r.ar }));
}

/**
 * Only rooted lemmas are eligible -- a rootless particle (و، من، هل...) has
 * no root file to resolve a meaning/example verses from, same filter as the
 * lemma-root matching game.
 */
export function buildLemmaDeck(lemmas: readonly IndexLemmaRow[], roots: readonly IndexRootRow[]): CardDef[] {
  return lemmas
    .filter((l) => l.rootIdx >= 0 && l.rootIdx < roots.length)
    .map((l) => ({
      id: `lemma:${l.key}`,
      kind: "lemmas" as const,
      ar: l.lemma,
      root: roots[l.rootIdx].ar,
      lemmaKey: l.key,
    }));
}
