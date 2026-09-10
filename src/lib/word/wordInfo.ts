import type { Cat, IndexFile, IndexRootRow, RootFile, VerseRootsFile } from "@/lib/data/types";

/**
 * Finds the root a specific word (1-based index, matching Occurrence's `w`)
 * in a specific verse belongs to, using the already-shipped global
 * per-verse rooted-word index -- no new data needed. Returns null for a
 * word with no root in this corpus (particles, pronouns, clitics -- see
 * the About page's "How counts are computed" section for why those never
 * carry a root here).
 */
export function findWordRootIdx(verseRoots: VerseRootsFile, globalId: number, w: number): number | null {
  const entries = verseRoots[globalId] ?? [];
  const match = entries.find(([, entryW]) => entryW === w);
  return match ? match[0] : null;
}

export interface WordInfo {
  rootAr: string;
  rootBw?: string;
  rootGlossShort: string;
  /** total occurrences of this root across the whole Qur'an */
  rootTotal: number;
  lemma: string;
  lemmaKey: string;
  /** total occurrences of this specific lemma across the whole Qur'an */
  lemmaCount: number;
  /** index into IndexFile.lemmas, i.e. the /word/{idx}/ page for this lemma */
  globalLemmaIdx: number;
  cat: Cat;
  /** total occurrences of this exact surface form across the whole Qur'an */
  formCount: number;
  /** this occurrence's raw pipe-delimited grammar tags (e.g. "IMPF|VF:1|3MP|MOOD:IND"), for describeTags() */
  tagsJoined: string;
}

/**
 * Resolves the full lemma/root detail for one word occurrence, given the
 * root's own file (as returned by getRoot/readRootFile) and its row in the
 * global index. Returns null if the occurrence isn't actually present in
 * that root's file (shouldn't happen if `rootIdx` came from
 * `findWordRootIdx` against the same data build, but data can never be
 * trusted blindly across an async boundary).
 */
export function resolveWordInfo(
  rootFile: RootFile,
  indexRootRow: IndexRootRow,
  index: IndexFile,
  rootIdx: number,
  s: number,
  a: number,
  w: number,
): WordInfo | null {
  const occEntry = rootFile.occ.find(([os, oa, ow]) => os === s && oa === a && ow === w);
  if (!occEntry) return null;
  const [, , , , formIdx, featIdx] = occEntry;
  const form = rootFile.forms[formIdx];
  if (!form) return null;
  const lemma = rootFile.lemmas[form.lemmaIdx];
  if (!lemma) return null;

  const globalLemmaIdx = index.lemmas.findIndex((l) => l.rootIdx === rootIdx && l.key === lemma.key);

  return {
    rootAr: indexRootRow.ar,
    rootBw: rootFile.bw,
    rootGlossShort: indexRootRow.glossShort,
    rootTotal: indexRootRow.count,
    lemma: lemma.lemma,
    lemmaKey: lemma.key,
    lemmaCount: lemma.count,
    globalLemmaIdx,
    cat: form.cat,
    formCount: form.count,
    tagsJoined: rootFile.feats[featIdx] ?? "",
  };
}
