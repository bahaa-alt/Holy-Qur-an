import { inScope, type Scope } from "./scope";
import { classifyRootShape, ROOT_SHAPE_ORDER, type RootShape } from "@/lib/morphology/rootShape";
import { CATEGORY_ORDER } from "@/lib/data/types";
import type { Cat, OccurrenceIndexFile } from "@/lib/data/types";

/**
 * Patterns' whole-Qur'an figures (PatternsFile) are precomputed aggregates
 * with no per-occurrence refs, the same situation Cooccurrence was in --
 * so scoping this means recomputing it, from occurrences.json
 * (OccurrenceIndexFile), which carries every rooted occurrence's own
 * s/a/w/root/lemma/category/verbForm.
 *
 * TWO THINGS THAT LOOK LIKE THE OBVIOUS APPROACH AND AREN'T -- READ
 * BEFORE CHANGING THIS FILE, both found by cross-checking a scope window
 * covering the entire Qur'an against the shipped whole-Qur'an figures.
 *
 * 1. verbForm > 0 does NOT mean "this occurrence is a verb". The
 *    corpus's VF: tag marks which Form (I-XI) a word DERIVES from, and
 *    that includes a Form's active/passive participle and verbal noun,
 *    not only its finite verb -- e.g. مُنذِر (a Form IV active
 *    participle) carries VF:4 the same as a Form IV verb does. Trusting
 *    verbForm alone (first attempt at this file) overcounted every Form
 *    by thousands of rows, pulling in participles and verbal nouns.
 *    build-patterns.ts avoids this by gating on `seg.pos === "V"` --
 *    finite verb or nothing -- before ever looking at Form.
 *
 * 2. occurrences.json's `catIdx` is NOT per-occurrence category, unlike
 *    verbForm. build-roots.ts assigns it from the occurrence's WORD-
 *    FORM's dominant category (the most common category among every
 *    occurrence of that root+form pair), not this specific occurrence's
 *    own tag -- different from patterns.json's own build, which
 *    classifies every occurrence directly from its tags. This is the
 *    closest per-occurrence "is this a verb" signal this file ships,
 *    though, so it is what gates verbForm here too (there is no raw POS
 *    column to gate on the way build-patterns.ts does).
 *
 * NET EFFECT: gating on `cat` being one of the three verb categories,
 * then reading verbForm (defaulting an untagged occurrence to Form I)
 * reproduces the shipped whole-Qur'an figures closely -- within 1% on
 * every Form in that cross-check -- because the dominant-category
 * approximation is usually right. `categories` inherits the same
 * approximation directly and less accurately (up to ~13% on one category
 * in that check, since there `cat` is the entire answer, not a yes/no
 * gate). Root shapes (root-text-based, untouched by category) are exact.
 * The caller documents this once scope narrows past "quran", where the
 * shipped exact figures are used as-is.
 */

const VERB_CATS: ReadonlySet<Cat> = new Set(["verb.perf", "verb.impf", "verb.impv"]);

export interface ScopedStat<K> {
  key: K;
  count: number;
  rootCount: number;
}

export interface ScopedVerbFormStat extends ScopedStat<number> {
  lemmaCount: number;
}

export interface ScopedShapeRoot {
  rootIdx: number;
  count: number;
}

export interface ScopedPatterns {
  verbForms: ScopedVerbFormStat[];
  categories: ScopedStat<Cat>[];
  rootShapes: ScopedStat<RootShape>[];
  /** shape -> the roots of that shape occurring in scope, with their scoped count, sorted desc */
  shapeRoots: Map<RootShape, ScopedShapeRoot[]>;
}

export function scopedPatterns(
  occurrences: OccurrenceIndexFile,
  scope: Scope,
  rootNames: readonly string[],
): ScopedPatterns {
  const verbFormAgg = new Map<number, { count: number; roots: Set<number>; lemmas: Set<string> }>();
  const catAgg = new Map<Cat, { count: number; roots: Set<number> }>();
  const shapeAgg = new Map<RootShape, { count: number; roots: Map<number, number> }>();

  for (const row of occurrences.rows) {
    const [s, a, , rootIdx, lemmaIdx, catIdx, verbForm] = row;
    if (!inScope(scope, { s, a })) continue;

    const cat = occurrences.cats[catIdx];
    let c = catAgg.get(cat);
    if (!c) {
      c = { count: 0, roots: new Set() };
      catAgg.set(cat, c);
    }
    c.count++;
    c.roots.add(rootIdx);

    const shape = classifyRootShape(rootNames[rootIdx]);
    let sh = shapeAgg.get(shape);
    if (!sh) {
      sh = { count: 0, roots: new Map() };
      shapeAgg.set(shape, sh);
    }
    sh.count++;
    sh.roots.set(rootIdx, (sh.roots.get(rootIdx) ?? 0) + 1);

    // See the file doc comment: `cat` (not verbForm) decides whether this
    // occurrence is a finite verb at all -- verbForm alone cannot, since
    // a participle or verbal noun derived from a Form carries the same
    // VF: tag its finite verb does.
    if (VERB_CATS.has(cat)) {
      const formNum = verbForm > 0 ? verbForm : 1;
      let v = verbFormAgg.get(formNum);
      if (!v) {
        v = { count: 0, roots: new Set(), lemmas: new Set() };
        verbFormAgg.set(formNum, v);
      }
      v.count++;
      v.roots.add(rootIdx);
      v.lemmas.add(`${rootIdx}:${lemmaIdx}`);
    }
  }

  const verbForms: ScopedVerbFormStat[] = [...verbFormAgg.entries()]
    .sort(([a], [b]) => a - b)
    .map(([form, agg]) => ({
      key: form,
      count: agg.count,
      rootCount: agg.roots.size,
      lemmaCount: agg.lemmas.size,
    }));

  const categories: ScopedStat<Cat>[] = CATEGORY_ORDER.filter((cat) => catAgg.has(cat)).map(
    (cat) => {
      const agg = catAgg.get(cat)!;
      return { key: cat, count: agg.count, rootCount: agg.roots.size };
    },
  );

  const rootShapes: ScopedStat<RootShape>[] = ROOT_SHAPE_ORDER.filter((shape) =>
    shapeAgg.has(shape),
  ).map((shape) => {
    const agg = shapeAgg.get(shape)!;
    return { key: shape, count: agg.count, rootCount: agg.roots.size };
  });

  const shapeRoots = new Map<RootShape, ScopedShapeRoot[]>();
  for (const [shape, agg] of shapeAgg) {
    shapeRoots.set(
      shape,
      [...agg.roots.entries()]
        .map(([rootIdx, count]) => ({ rootIdx, count }))
        .sort((x, y) => y.count - x.count),
    );
  }

  return { verbForms, categories, rootShapes, shapeRoots };
}
