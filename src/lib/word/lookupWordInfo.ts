import { getIndex, getMeta, getRoot, getVerseRoots } from "@/lib/data/loader";
import { refToGlobalId } from "@/lib/data/verseId";
import { findWordRootIdx, resolveWordInfo, type WordInfo } from "./wordInfo";

export type WordLookupResult = { status: "not-rooted" } | { status: "found"; info: WordInfo };

/**
 * Fetches whatever's needed (verse-roots.json, meta, index, then the
 * resolved root's own file) and resolves one word's full info. Shared by
 * WordInfoPanel (one word at a time) and the full-verse morphology table
 * (every word in a verse at once, via lookupVerseWordInfos below) so the
 * fetch/resolve logic lives in exactly one place.
 */
export async function lookupWordInfo(s: number, a: number, w: number): Promise<WordLookupResult> {
  const [verseRoots, meta, index] = await Promise.all([getVerseRoots(), getMeta(), getIndex()]);
  const globalId = refToGlobalId(meta, s, a);
  const rootIdx = globalId === null ? null : findWordRootIdx(verseRoots, globalId, w);
  if (rootIdx === null) return { status: "not-rooted" };

  const indexRootRow = index.roots[rootIdx];
  const rootFile = await getRoot(indexRootRow.ar);
  const info = resolveWordInfo(rootFile, indexRootRow, index, rootIdx, s, a, w);
  return info ? { status: "found", info } : { status: "not-rooted" };
}

/**
 * Resolves every word (1-based, 1..wordCount) of one verse at once, for the
 * full-verse morphology table. Fetches the shared verse-roots/meta/index
 * files only once, then resolves each word in parallel -- concurrent
 * `getRoot()` calls for the same root dedupe to a single fetch (the loader
 * caches the in-flight promise), so a verse using the same root twice never
 * fetches that root's file more than once.
 */
export async function lookupVerseWordInfos(s: number, a: number, wordCount: number): Promise<WordLookupResult[]> {
  const [verseRoots, meta, index] = await Promise.all([getVerseRoots(), getMeta(), getIndex()]);
  const globalId = refToGlobalId(meta, s, a);

  return Promise.all(
    Array.from({ length: wordCount }, (_, i) => i + 1).map(async (w): Promise<WordLookupResult> => {
      const rootIdx = globalId === null ? null : findWordRootIdx(verseRoots, globalId, w);
      if (rootIdx === null) return { status: "not-rooted" };

      const indexRootRow = index.roots[rootIdx];
      const rootFile = await getRoot(indexRootRow.ar);
      const info = resolveWordInfo(rootFile, indexRootRow, index, rootIdx, s, a, w);
      return info ? { status: "found", info } : { status: "not-rooted" };
    }),
  );
}
