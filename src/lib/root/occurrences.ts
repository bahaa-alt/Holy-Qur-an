import type { Cat, RootFile } from "@/lib/data/types";

export interface OccRow {
  s: number;
  a: number;
  w: number;
  form: string;
  formKey: string;
  lemma: string;
  lemmaKey: string;
  cat: Cat;
  tagsJoined: string;
}

/** Flattens a RootFile's occurrence tuples into display-ready rows, in Quran order. */
export function buildOccurrenceRows(file: RootFile): OccRow[] {
  return file.occ.map(([s, a, w, , formIdx, featIdx]) => {
    const form = file.forms[formIdx];
    const lemma = file.lemmas[form.lemmaIdx];
    return {
      s,
      a,
      w,
      form: form.form,
      formKey: form.key,
      lemma: lemma.lemma,
      lemmaKey: lemma.key,
      cat: form.cat,
      tagsJoined: file.feats[featIdx] ?? "",
    };
  });
}

/**
 * Maps every (surah, ayah) touched by this root to the sorted list of word
 * indices where it occurs in that verse -- used to highlight every
 * occurrence of the root within a rendered verse, not just the one row
 * currently being displayed.
 */
export function buildVerseWordIndex(file: RootFile): Map<string, number[]> {
  const map = new Map<string, number[]>();
  for (const [s, a, w] of file.occ) {
    const key = `${s}:${a}`;
    let list = map.get(key);
    if (!list) {
      list = [];
      map.set(key, list);
    }
    list.push(w);
  }
  for (const list of map.values()) list.sort((a, b) => a - b);
  return map;
}

export interface RowFilters {
  cat?: Cat;
  lemmaKey?: string;
  formKey?: string;
  surah?: number;
}

export function filterRows(rows: readonly OccRow[], filters: RowFilters): OccRow[] {
  return rows.filter((r) => {
    if (filters.cat && r.cat !== filters.cat) return false;
    if (filters.lemmaKey && r.lemmaKey !== filters.lemmaKey) return false;
    if (filters.formKey && r.formKey !== filters.formKey) return false;
    if (filters.surah && r.s !== filters.surah) return false;
    return true;
  });
}
