import { normalize, normalizeRootKey } from "@/lib/arabic/normalize";
import { prefixRange } from "./binarySearch";
import type { FormsEntry, IndexFile } from "@/lib/data/types";

export type SuggestionKind = "root" | "lemma" | "verse";

export interface Suggestion {
  kind: SuggestionKind;
  /** stable React key */
  key: string;
  /** main display text */
  primary: string;
  /** secondary line, e.g. a gloss, "root: كتب", or a translation snippet */
  secondary?: string;
  count?: number;
  href: string;
}

export function rootHref(root: string): string {
  return `/root/${encodeURIComponent(root)}/`;
}

export function wordHref(globalLemmaIdx: number): string {
  return `/word/${globalLemmaIdx}/`;
}

export function verseHref(s: number, a: number): string {
  return `/surah/${s}/?ayah=${a}`;
}

/**
 * Builds root/lemma/word suggestions for an Arabic-script query: exact and
 * prefix matches against roots (by root key), lemmas (by lemma key), and
 * surface forms (by form key, resolved to their owning lemma -- a matched
 * inflected form is shown as its dictionary lemma, since that's the useful
 * navigation target, not the literal typed string).
 */
export function buildArabicSuggestions(
  query: string,
  index: IndexFile,
  forms: readonly FormsEntry[],
  limitEach = 6,
): Suggestion[] {
  const qRootKey = normalizeRootKey(query);
  const qKey = normalize(query);
  if (qKey === "") return [];

  const results: Suggestion[] = [];
  const seenLemmaIdx = new Set<number>();

  const [rs, re] = prefixRange(index.roots, qRootKey, (r) => r.key);
  const rootMatches = [...index.roots.slice(rs, re)].sort((a, b) => b.count - a.count).slice(0, limitEach);
  for (const r of rootMatches) {
    results.push({
      kind: "root",
      key: `root-${r.ar}`,
      primary: r.ar,
      secondary: r.glossShort || undefined,
      count: r.count,
      href: rootHref(r.ar),
    });
  }

  const [ls, le] = prefixRange(index.lemmas, qKey, (l) => l.key);
  const lemmaMatches = index.lemmas
    .map((l, i) => ({ l, i }))
    .slice(ls, le)
    .sort((a, b) => b.l.count - a.l.count)
    .slice(0, limitEach);
  for (const { l, i } of lemmaMatches) {
    if (seenLemmaIdx.has(i)) continue;
    seenLemmaIdx.add(i);
    const rootAr = l.rootIdx !== -1 ? index.roots[l.rootIdx].ar : null;
    results.push({
      kind: "lemma",
      key: `lemma-${i}`,
      primary: l.lemma,
      secondary: rootAr ? `root ${rootAr}` : undefined,
      count: l.count,
      href: wordHref(i),
    });
  }

  const [fs, fe] = prefixRange(forms, qKey, (f) => f.key);
  const formMatches = [...forms.slice(fs, fe)].sort((a, b) => b.count - a.count).slice(0, limitEach);
  for (const f of formMatches) {
    if (seenLemmaIdx.has(f.lemmaIdx)) continue;
    seenLemmaIdx.add(f.lemmaIdx);
    const l = index.lemmas[f.lemmaIdx];
    if (!l) continue;
    const rootAr = l.rootIdx !== -1 ? index.roots[l.rootIdx].ar : null;
    results.push({
      kind: "lemma",
      key: `form-${f.lemmaIdx}`,
      primary: l.lemma,
      secondary: rootAr ? `root ${rootAr}` : undefined,
      count: l.count,
      href: wordHref(f.lemmaIdx),
    });
  }

  return results;
}

/** Roots whose Buckwalter transliteration starts with the (Latin) query. */
export function buildBuckwalterSuggestions(query: string, index: IndexFile, limit = 5): Suggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];
  return index.roots
    .filter((r) => r.bw && r.bw.toLowerCase().startsWith(q))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((r) => ({
      kind: "root" as const,
      key: `bw-${r.ar}`,
      primary: r.ar,
      secondary: r.glossShort || r.bw,
      count: r.count,
      href: rootHref(r.ar),
    }));
}
