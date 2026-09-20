import { CHRONOLOGICAL_ORDER_BY_SURAH } from "@/lib/data/chronologicalOrder";
import type {
  IndexFile,
  MorphologyIndexFile,
  OccurrenceIndexFile,
  SurahMeta,
  SyntaxIndexFile,
} from "@/lib/data/types";
import { MORPH_CASES, MORPH_DEFINITENESS, MORPH_MOODS } from "@/lib/morphology/morphFeatures";
import {
  POS_CATS,
  QcqlError,
  type CompareOp,
  type Expr,
  type Filter,
  type QcqlMatch,
  type Query,
} from "./types";

/** Everything a query needs, all of it already emitted by the build. */
export interface QcqlCorpus {
  occurrences: OccurrenceIndexFile;
  syntax: SyntaxIndexFile;
  index: IndexFile;
  surahs: SurahMeta[];
  /**
   * Optional, because it is 176 KB gzipped and most queries never touch it.
   * A caller checks `needsMorphology(query)` and fetches only when the
   * query names case, mood, definiteness or person-gender-number; the
   * executor throws rather than silently returning nothing if it is absent.
   */
  morphology?: MorphologyIndexFile;
}

/**
 * A word position key. Packs (s, a, w) into one integer so the working
 * sets are Set<number> rather than Set<string>: at 50,269 occurrences and
 * 17,014 tagged segments a query touches tens of thousands of keys, and
 * string keys cost several times the memory and hashing time for nothing.
 *
 * Bounds: s <= 114, a <= 286, w <= 129 in this corpus. 1,000 and 1,000 as
 * radices leave two orders of magnitude of headroom on each and keep the
 * result readable in a debugger (2:255:4 packs as 2_255_004).
 */
export function packKey(s: number, a: number, w: number): number {
  return (s * 1000 + a) * 1000 + w;
}

export function unpackKey(key: number): QcqlMatch {
  const w = key % 1000;
  const rest = (key - w) / 1000;
  return { s: (rest - (rest % 1000)) / 1000, a: rest % 1000, w };
}

/**
 * The set of word positions a query can match at all.
 *
 * Needed because `!` is set complement, and complement is only meaningful
 * against a stated universe. The universe here is every word position
 * either index knows about -- which is NOT every word in the Qur'an: a
 * word with no root and no syntactic tag (most pronouns, for one) appears
 * in neither index, so it can never be matched and is never in a negated
 * result either. That is a real limitation of what the build emits, and it
 * is stated in the UI rather than papered over.
 */
function buildUniverse(corpus: QcqlCorpus): Set<number> {
  const universe = new Set<number>();
  for (const row of corpus.occurrences.rows) universe.add(packKey(row[0], row[1], row[2]));
  const { s, a, w } = corpus.syntax;
  for (let i = 0; i < s.length; i++) universe.add(packKey(s[i], a[i], w[i]));
  if (corpus.morphology) {
    const m = corpus.morphology;
    for (let i = 0; i < m.s.length; i++) universe.add(packKey(m.s[i], m.a[i], m.w[i]));
  }
  return universe;
}

/** Lookup tables built once per execution, reused by every predicate. */
interface Resolved {
  rootIdx: Map<string, number>;
  lemmaIdx: Map<string, number>;
  catIdx: Map<string, number>;
  tagIdx: Map<string, number>;
}

function resolve(corpus: QcqlCorpus): Resolved {
  const rootIdx = new Map<string, number>();
  corpus.index.roots.forEach((r, i) => {
    rootIdx.set(r.ar, i);
    // `key` is the normalised spelling the search box already matches on,
    // so a query typed without hamza finds the root a reader saw in a URL.
    if (!rootIdx.has(r.key)) rootIdx.set(r.key, i);
  });

  const lemmaIdx = new Map<string, number>();
  corpus.index.lemmas.forEach((l, i) => {
    if (!lemmaIdx.has(l.lemma)) lemmaIdx.set(l.lemma, i);
    if (!lemmaIdx.has(l.key)) lemmaIdx.set(l.key, i);
  });

  const catIdx = new Map<string, number>();
  corpus.occurrences.cats.forEach((c, i) => catIdx.set(c, i));

  const tagIdx = new Map<string, number>();
  corpus.syntax.tags.forEach((t, i) => tagIdx.set(t, i));

  return { rootIdx, lemmaIdx, catIdx, tagIdx };
}

/**
 * Evaluates one predicate to the set of word positions satisfying it.
 *
 * Each predicate scans its index once. No attempt is made to push `and`
 * down into a single pass: measured on this corpus a full scan of
 * occurrences.json is ~50k rows and completes in low single-digit
 * milliseconds, so the clarity of "every predicate is a set, combined by
 * set algebra" is worth more than the saved scan.
 */
function evalPredicate(
  expr: Extract<Expr, { kind: "pred" }>,
  corpus: QcqlCorpus,
  r: Resolved,
): Set<number> {
  const pred = expr.pred;
  const out = new Set<number>();

  if (pred.kind === "tag") {
    const want = r.tagIdx.get(pred.value);
    if (want === undefined) {
      // The parser validates against SYNTAX_TAGS; reaching here means the
      // shipped index and the vocabulary have diverged, which is a build
      // problem and should be loud rather than an empty result set.
      throw new QcqlError(`Tag "${pred.value}" is not in the shipped syntax index`, 0, pred.value);
    }
    const { s, a, w, t } = corpus.syntax;
    for (let i = 0; i < t.length; i++) {
      if (t[i] === want) out.add(packKey(s[i], a[i], w[i]));
    }
    return out;
  }

  if (pred.kind === "case" || pred.kind === "mood" || pred.kind === "def" || pred.kind === "pgn") {
    const m = corpus.morphology;
    if (!m) {
      // A missing index must not read as "no matches" -- that would be a
      // false claim about the corpus. Callers gate the fetch on
      // needsMorphology(); reaching here means that gate was skipped.
      throw new QcqlError(
        `The query uses ${pred.kind}=, which needs the morphology index, and it was not loaded`,
        0,
        pred.kind,
      );
    }

    let column: number[];
    let want: number;
    if (pred.kind === "pgn") {
      column = m.p;
      want = m.pgnTags.indexOf(pred.value) + 1;
      if (want === 0) {
        throw new QcqlError(
          `No person-gender-number "${pred.value}" occurs in this corpus`,
          0,
          pred.value,
        );
      }
    } else {
      const vocab =
        pred.kind === "case"
          ? MORPH_CASES
          : pred.kind === "mood"
            ? MORPH_MOODS
            : MORPH_DEFINITENESS;
      column = pred.kind === "case" ? m.c : pred.kind === "mood" ? m.m : m.d;
      // The parser validated the value against the same vocabulary, so a
      // miss here means the shipped index and the vocabulary have diverged.
      want = (vocab as readonly string[]).indexOf(pred.value) + 1;
      if (want === 0) {
        throw new QcqlError(
          `"${pred.value}" is not in the shipped morphology vocabulary`,
          0,
          pred.value,
        );
      }
    }

    for (let i = 0; i < column.length; i++) {
      if (column[i] === want) out.add(packKey(m.s[i], m.a[i], m.w[i]));
    }
    return out;
  }

  // Everything else reads the occurrence index.
  let wantRoot = -1;
  let wantLemma = -1;
  let wantVf = -1;
  const wantCats = new Set<number>();

  switch (pred.kind) {
    case "root": {
      const idx = r.rootIdx.get(pred.value);
      // An unknown root is a typo, not a finding. Saying "no matches"
      // would let a misspelling read as a claim about the corpus.
      if (idx === undefined) {
        throw new QcqlError(`No root "${pred.value}" in this corpus`, 0, pred.value);
      }
      wantRoot = idx;
      break;
    }
    case "lemma": {
      const idx = r.lemmaIdx.get(pred.value);
      if (idx === undefined) {
        throw new QcqlError(`No lemma "${pred.value}" in this corpus`, 0, pred.value);
      }
      wantLemma = idx;
      break;
    }
    case "cat": {
      const idx = r.catIdx.get(pred.value);
      if (idx === undefined) {
        throw new QcqlError(`Category "${pred.value}" is not in the shipped index`, 0, pred.value);
      }
      wantCats.add(idx);
      break;
    }
    case "pos": {
      for (const cat of POS_CATS[pred.value]) {
        const idx = r.catIdx.get(cat);
        if (idx !== undefined) wantCats.add(idx);
      }
      break;
    }
    case "vf":
      wantVf = pred.value;
      break;
  }

  for (const row of corpus.occurrences.rows) {
    if (wantRoot !== -1 && row[3] !== wantRoot) continue;
    if (wantLemma !== -1 && row[4] !== wantLemma) continue;
    if (wantCats.size > 0 && !wantCats.has(row[5])) continue;
    if (wantVf !== -1 && row[6] !== wantVf) continue;
    out.add(packKey(row[0], row[1], row[2]));
  }
  return out;
}

function evalExpr(
  expr: Expr,
  corpus: QcqlCorpus,
  r: Resolved,
  universe: () => Set<number>,
): Set<number> {
  switch (expr.kind) {
    case "pred":
      return evalPredicate(expr, corpus, r);
    case "and": {
      const left = evalExpr(expr.left, corpus, r, universe);
      const right = evalExpr(expr.right, corpus, r, universe);
      // Iterate the smaller side; intersection is the hot operation.
      const [small, large] = left.size <= right.size ? [left, right] : [right, left];
      const out = new Set<number>();
      for (const k of small) if (large.has(k)) out.add(k);
      return out;
    }
    case "or": {
      const out = evalExpr(expr.left, corpus, r, universe);
      for (const k of evalExpr(expr.right, corpus, r, universe)) out.add(k);
      return out;
    }
    case "not": {
      const inner = evalExpr(expr.expr, corpus, r, universe);
      const out = new Set<number>();
      for (const k of universe()) if (!inner.has(k)) out.add(k);
      return out;
    }
  }
}

function compare(op: CompareOp, left: number, right: number): boolean {
  switch (op) {
    case "=":
      return left === right;
    case "!=":
      return left !== right;
    case "<":
      return left < right;
    case "<=":
      return left <= right;
    case ">":
      return left > right;
    case ">=":
      return left >= right;
  }
}

function passesFilters(s: number, filters: readonly Filter[], byNumber: Map<number, SurahMeta>) {
  for (const f of filters) {
    if (f.kind === "revelation") {
      if (byNumber.get(s)?.type !== f.value) return false;
    } else if (f.kind === "surah") {
      if (!compare(f.op, s, f.value)) return false;
    } else {
      // 0-based: the array is keyed by surah - 1 (see chronologicalOrder.ts).
      const chrono = CHRONOLOGICAL_ORDER_BY_SURAH[s - 1];
      if (chrono === undefined || !compare(f.op, chrono, f.value)) return false;
    }
  }
  return true;
}

export interface QcqlResult {
  matches: QcqlMatch[];
  /** distinct verses the matches fall in, for the count line */
  verseCount: number;
}

/**
 * Runs a parsed query against the corpus.
 *
 * Results come back in corpus order (surah, ayah, word) regardless of the
 * order predicates were evaluated in, so a query's output is stable and a
 * permalink shows the same first page to everyone.
 */
export function executeQcql(query: Query, corpus: QcqlCorpus): QcqlResult {
  const r = resolve(corpus);

  // Built lazily: `!` is the only operator that needs it, and building it
  // costs a scan of both indices.
  let cached: Set<number> | null = null;
  const universe = () => (cached ??= buildUniverse(corpus));

  const keys = evalExpr(query.term, corpus, r, universe);
  const byNumber = new Map(corpus.surahs.map((s) => [s.n, s]));

  const matches: QcqlMatch[] = [];
  const verses = new Set<number>();
  for (const key of [...keys].sort((x, y) => x - y)) {
    const m = unpackKey(key);
    if (!passesFilters(m.s, query.filters, byNumber)) continue;
    matches.push(m);
    verses.add(m.s * 1000 + m.a);
  }

  return { matches, verseCount: verses.size };
}
