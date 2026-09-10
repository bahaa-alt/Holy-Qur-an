import { daysSinceEpoch } from "./dayIndex";
import { globalIdToRef } from "@/lib/data/verseId";
import type { IndexFile, IndexRootRow, MetaFile } from "@/lib/data/types";

/**
 * Picks today's featured root, deterministically: every visitor on the same
 * calendar day (UTC) and the same data build sees the same root, without any
 * backend. `index.roots` is in a stable order per deployed build (sorted by
 * normalized root key in build-roots.ts), so this is reproducible.
 */
export function pickRootOfDay(index: IndexFile, date: Date): IndexRootRow {
  const i = daysSinceEpoch(date) % index.roots.length;
  return index.roots[i];
}

/**
 * Picks today's featured verse, deterministically, the same way as
 * {@link pickRootOfDay}: a stable index into the whole corpus (Quran order),
 * wrapped into a (surah, ayah) reference via the existing global-id/verse-id
 * conversion -- no new verse-numbering logic.
 */
export function pickVerseOfDay(meta: MetaFile, date: Date): { s: number; a: number } {
  const totalVerses = meta.surahs.reduce((sum, s) => sum + s.ayahs, 0);
  const globalId = daysSinceEpoch(date) % totalVerses;
  // totalVerses > 0 and globalId is always in [0, totalVerses), so this
  // always resolves -- the non-null assertion documents that invariant.
  return globalIdToRef(meta, globalId)!;
}
