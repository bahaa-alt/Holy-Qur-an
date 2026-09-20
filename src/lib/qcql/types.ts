import type { Cat } from "@/lib/data/types";
import type { MorphCase, MorphDefiniteness, MorphMood } from "@/lib/morphology/morphFeatures";

/**
 * QCQL v1 — a small query language over this corpus.
 *
 * The facet checkboxes on /search/advanced are a fixed set of questions
 * someone anticipated. This is the open-ended successor: the researcher
 * writes the question. Everything here compiles to a scan over indices the
 * build already emits (occurrences.json, syntax.json) and runs in the
 * browser -- no server, no new runtime dependency.
 *
 *   [root=علم & cat=verb.perf]        every perfect verb from علم
 *   [mood=jus]                        every jussive
 *   [case=acc & def=indef]            every accusative indefinite
 *   [pgn=2fp & cat=verb.impf]         2nd-person feminine plural imperfect
 *   [root=علم & PASS]                 ...in the passive
 *   [RES]                             every restriction particle
 *   [pos=V & !PASS] :: meccan         active verbs in Meccan surahs
 *   [COND] :: chrono > 5              conditionals, excluding the first
 *                                     five surahs revealed
 *
 * THE UNIT OF RESULT IS A WORD POSITION (s, a, w), not a segment.
 *
 * That is forced by the data and is the one thing to understand about this
 * language. `occurrences.json` is keyed (s, a, w) and holds only ROOTED
 * segments -- this app's documented definition of an occurrence.
 * `syntax.json` is keyed (s, a, w, seg) and is dominated by ROOTLESS
 * particles. A language that queried only the first could never ask about
 * conditionals; one that queried only the second could never ask about
 * roots. Matching at word granularity lets a single query span both: an
 * occurrence predicate holds if the word has a rooted occurrence
 * satisfying it, and a tag predicate holds if any segment of that word
 * carries the tag.
 *
 * The cost is that `[root=علم & COND]` means "a word that is both from علم
 * and carries a conditional tag somewhere", not necessarily on the same
 * segment. In this corpus that distinction is almost always empty, because
 * the tags that co-occur with a root are the ones that mark the rooted
 * segment itself. Sequence queries (v2) will need real segment positions.
 */
export const QCQL_VERSION = 1;

/** Part of speech, as sugar over sets of Cat. See POS_CATS. */
export type Pos = "V" | "N";

export type CompareOp = "=" | "!=" | "<" | "<=" | ">" | ">=";

/**
 * A test on one word position.
 *
 * `root`, `lemma`, `cat` and `vf` read the occurrence index; `tag` reads
 * the syntax index. Which index a predicate reads is an implementation
 * detail of the executor, not something the writer of a query has to know.
 */
export type Predicate =
  | { kind: "root"; value: string }
  | { kind: "lemma"; value: string }
  | { kind: "cat"; value: Cat }
  | { kind: "pos"; value: Pos }
  | { kind: "vf"; value: number }
  | { kind: "tag"; value: string }
  /** case, mood, definiteness and person-gender-number read morphology.json */
  | { kind: "case"; value: MorphCase }
  | { kind: "mood"; value: MorphMood }
  | { kind: "def"; value: MorphDefiniteness }
  | { kind: "pgn"; value: string };

export type Expr =
  | { kind: "pred"; pred: Predicate }
  | { kind: "and"; left: Expr; right: Expr }
  | { kind: "or"; left: Expr; right: Expr }
  | { kind: "not"; expr: Expr };

/**
 * A condition on the surah a match sits in, applied after the term.
 *
 * Separate from the term because it is a different kind of question: the
 * term describes a word, a filter describes where in the book to look.
 * Keeping them apart is also what makes `[X] :: meccan` readable.
 */
export type Filter =
  | { kind: "revelation"; value: "meccan" | "medinan" }
  | { kind: "chrono"; op: CompareOp; value: number }
  | { kind: "surah"; op: CompareOp; value: number };

export interface Query {
  /** in the permalink, so a saved query keeps meaning what it meant */
  version: typeof QCQL_VERSION;
  term: Expr;
  filters: Filter[];
}

/**
 * `pos` as a documented alias for a set of `cat` values.
 *
 * Only two entries, and the omission is deliberate: PARTICLES ARE ROOTLESS,
 * so they never appear in the occurrence index and `pos=P` could only ever
 * return nothing. The parser rejects it with that explanation rather than
 * returning an empty result that looks like a finding. Particles are
 * queried through the tag predicates instead -- that is what the syntax
 * layer is for.
 */
export const POS_CATS: Record<Pos, readonly Cat[]> = {
  V: ["verb.perf", "verb.impf", "verb.impv"],
  N: ["noun", "actPcpl", "passPcpl", "verbalNoun", "adj", "properNoun"],
};

/** A match: one word position, with the surah context a filter needs. */
export interface QcqlMatch {
  s: number;
  a: number;
  w: number;
}

export class QcqlError extends Error {
  constructor(
    message: string,
    /** 0-based offset into the source, for pointing at the offending text */
    readonly at: number,
    /** the offending text itself, when there is one */
    readonly text?: string,
  ) {
    super(message);
    this.name = "QcqlError";
  }
}

/** Whether a query reads morphology.json, so a caller can skip fetching it. */
export function needsMorphology(query: Query): boolean {
  const walk = (e: Expr): boolean => {
    switch (e.kind) {
      case "pred":
        return ["case", "mood", "def", "pgn"].includes(e.pred.kind);
      case "not":
        return walk(e.expr);
      default:
        return walk(e.left) || walk(e.right);
    }
  };
  return walk(query.term);
}
