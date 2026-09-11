import type { IndexFile, IndexLemmaRow, IndexRootRow } from "@/lib/data/types";

/** A hapax lemma row, carrying its position in IndexFile.lemmas -- the
 *  argument wordHref() needs, which a plain filter() would otherwise
 *  discard since it isn't part of IndexLemmaRow itself. */
export interface HapaxLemmaRow extends IndexLemmaRow {
  wordIdx: number;
}

/**
 * Every root occurring exactly once anywhere in the Qur'an -- the same
 * definition InsightsFile.hapaxRootCount uses (build-insights.ts), kept
 * here so the client-side "view the list" feature can't silently drift
 * from the number it's a breakdown of.
 */
export function getHapaxRoots(index: IndexFile): IndexRootRow[] {
  return index.roots.filter((r) => r.count === 1);
}

/** Every lemma (rooted or rootless) occurring exactly once -- same
 *  definition as InsightsFile.hapaxLemmaCount. */
export function getHapaxLemmas(index: IndexFile): HapaxLemmaRow[] {
  const hapax: HapaxLemmaRow[] = [];
  index.lemmas.forEach((lemma, wordIdx) => {
    if (lemma.count === 1) hapax.push({ ...lemma, wordIdx });
  });
  return hapax;
}
