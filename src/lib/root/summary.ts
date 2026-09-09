import { CATEGORY_ORDER } from "@/lib/data/types";
import type { Cat, RootFile } from "@/lib/data/types";

export interface CategoryCount {
  cat: Cat;
  count: number;
}

export interface LemmaCount {
  lemma: string;
  key: string;
  cat: Cat;
  count: number;
}

export interface RootSummary {
  root: string | null;
  bw?: string;
  glossFull?: string;
  glossShort?: string;
  total: number;
  lemmaCount: number;
  formCount: number;
  verseCount: number;
  surahCount: number;
  /** category breakdown, ordered per CATEGORY_ORDER, zero counts omitted */
  byCategory: CategoryCount[];
  /** per-lemma breakdown, sorted by count desc */
  byLemma: LemmaCount[];
}

/** Derives the static, render-ready summary shown on a root/word page header and charts. */
export function buildRootSummary(file: RootFile): RootSummary {
  const verseSet = new Set<string>();
  const surahSet = new Set<number>();
  for (const [s, a] of file.occ) {
    verseSet.add(`${s}:${a}`);
    surahSet.add(s);
  }

  const categoryCounts = new Map<Cat, number>();
  for (const form of file.forms) {
    categoryCounts.set(form.cat, (categoryCounts.get(form.cat) ?? 0) + form.count);
  }
  const byCategory: CategoryCount[] = CATEGORY_ORDER.filter((c) => (categoryCounts.get(c) ?? 0) > 0).map(
    (cat) => ({ cat, count: categoryCounts.get(cat)! }),
  );

  const byLemma: LemmaCount[] = [...file.lemmas]
    .map((l) => ({
      lemma: l.lemma,
      key: l.key,
      cat: dominantLemmaCategory(l.cats),
      count: l.count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    root: file.root,
    bw: file.bw,
    glossFull: file.gloss?.en,
    glossShort: file.gloss?.short,
    total: file.total,
    lemmaCount: file.lemmas.length,
    formCount: file.forms.length,
    verseCount: verseSet.size,
    surahCount: surahSet.size,
    byCategory,
    byLemma,
  };
}

function dominantLemmaCategory(cats: Partial<Record<Cat, number>>): Cat {
  let best: Cat = "other";
  let bestCount = -1;
  for (const [cat, count] of Object.entries(cats) as [Cat, number][]) {
    if (count > bestCount) {
      best = cat;
      bestCount = count;
    }
  }
  return best;
}
