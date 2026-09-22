import { executeQcql, packKey, unpackKey, type QcqlCorpus } from "@/lib/qcql/execute";
import { parseQcql } from "@/lib/qcql/parse";
import { needsMorphology, QcqlError, type Query, type QcqlMatch } from "@/lib/qcql/types";
import { applySetOp } from "./algebra";
import type { Study } from "./types";

export interface EvaluatedSet {
  keys: Set<number>;
  verseCount: number;
  error?: string;
}

function verseCountOf(keys: ReadonlySet<number>): number {
  const verses = new Set<number>();
  for (const key of keys) {
    const { s, a } = unpackKey(key);
    verses.add(s * 1000 + a);
  }
  return verses.size;
}

function runQuery(source: string, corpus: QcqlCorpus): EvaluatedSet {
  let query: Query;
  try {
    query = parseQcql(source);
  } catch (e) {
    return { keys: new Set(), verseCount: 0, error: e instanceof QcqlError ? e.message : "parse error" };
  }
  if (needsMorphology(query) && !corpus.morphology) {
    return { keys: new Set(), verseCount: 0, error: "needs morphology data" };
  }
  const { matches, verseCount } = executeQcql(query, corpus);
  return { keys: new Set(matches.map((m) => packKey(m.s, m.a, m.w))), verseCount };
}

/**
 * Evaluates every set in a study against a loaded corpus, resolving `op`
 * sets by recursing into their inputs.
 *
 * A set that fails -- a bad QCQL string, a missing dependency, or (only
 * reachable from a hand-edited or imported file; the UI cannot create one)
 * a reference cycle -- gets an `error` and an empty result rather than
 * aborting the whole study, so one broken set never hides the others.
 */
export function evaluateStudy(study: Study, corpus: QcqlCorpus): Map<string, EvaluatedSet> {
  const byId = new Map(study.sets.map((s) => [s.id, s]));
  const results = new Map<string, EvaluatedSet>();
  const visiting = new Set<string>();

  function resolve(id: string): EvaluatedSet {
    const cached = results.get(id);
    if (cached) return cached;

    const set = byId.get(id);
    if (!set) return { keys: new Set(), verseCount: 0, error: "missing set" };

    if (visiting.has(id)) {
      const result: EvaluatedSet = { keys: new Set(), verseCount: 0, error: "circular reference" };
      results.set(id, result);
      return result;
    }
    visiting.add(id);

    let result: EvaluatedSet;
    if (set.source.kind === "query") {
      result = runQuery(set.source.qcql, corpus);
    } else {
      const left = resolve(set.source.left);
      const right = resolve(set.source.right);
      if (left.error || right.error) {
        result = { keys: new Set(), verseCount: 0, error: left.error ?? right.error };
      } else {
        const keys = applySetOp(set.source.op, left.keys, right.keys);
        result = { keys, verseCount: verseCountOf(keys) };
      }
    }
    visiting.delete(id);
    results.set(id, result);
    return result;
  }

  for (const set of study.sets) resolve(set.id);
  return results;
}

/**
 * Whether any query-kind set in the study reads case, mood, definiteness or
 * person-gender-number -- decides whether the caller fetches morphology.json
 * before evaluating. Unparseable sources are ignored here; runQuery reports
 * their real error once evaluation actually runs.
 */
export function studyNeedsMorphology(study: Study): boolean {
  return study.sets.some((s) => {
    if (s.source.kind !== "query") return false;
    try {
      return needsMorphology(parseQcql(s.source.qcql));
    } catch {
      return false;
    }
  });
}

/** An evaluated set's members as matches, in corpus order. */
export function matchesOf(evaluated: EvaluatedSet): QcqlMatch[] {
  return [...evaluated.keys].sort((x, y) => x - y).map(unpackKey);
}
