import type { VerseRootsFile } from "../../src/lib/data/types";
import type { RawWord } from "./parse-morphology";

/**
 * Builds a global, per-verse index of every rooted word (root + word
 * position), keyed by the same stable global verse id used throughout the
 * app (see src/lib/data/verseId.ts and EnIndexFile.postings). This is the
 * one piece of data no single RootFile can provide on its own: what OTHER
 * roots share a verse with this one. Powers collocations, adjacent-root
 * phrase search, and shared-root "related verses".
 *
 * `rootTextToGlobalIdx` and `globalIdOf` must be built beforehand (by
 * buildRoots() and the surah/verse enumeration in build-data.ts,
 * respectively) since both require the final, corpus-wide sort order.
 */
export function buildVerseRoots(
  words: readonly RawWord[],
  rootTextToGlobalIdx: ReadonlyMap<string, number>,
  globalIdOf: ReadonlyMap<string, number>,
): VerseRootsFile {
  const result: VerseRootsFile = Array.from({ length: globalIdOf.size }, () => []);

  for (const word of words) {
    for (const seg of word.segments) {
      if (seg.root === null) continue;
      const rootIdx = rootTextToGlobalIdx.get(seg.root);
      const globalId = globalIdOf.get(`${seg.s}:${seg.a}`);
      if (rootIdx === undefined || globalId === undefined) continue;
      // words/segments arrive in ascending (s,a,w,seg) order already, so
      // each verse's array is naturally built in ascending word order.
      result[globalId].push([rootIdx, seg.w]);
    }
  }

  return result;
}
