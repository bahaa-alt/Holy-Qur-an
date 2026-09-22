/**
 * The Notebook: named collections of QCQL result sets, combined by set
 * algebra and written up together.
 *
 * A saved query (see lib/notes) is a single result a researcher can come
 * back to. A study is the next unit up: "root X but not root Y", built from
 * two saved queries with one click, annotated, and grouped with the other
 * queries and sets that make up one line of inquiry -- so the unit exported
 * and cited is the investigation, not one query at a time.
 */

export type SetOp = "intersect" | "union" | "subtract";

/**
 * What a set's members are. A `query` set runs QCQL directly; an `op` set
 * is derived from two other sets IN THE SAME STUDY, named by their `id`.
 * Keeping `left`/`right` as ids rather than embedding the sets themselves
 * means a study is always a DAG over a flat list, which is what makes it
 * possible to detect a cycle in imported (untrusted) data before evaluating
 * anything.
 */
export type SetSource =
  | { kind: "query"; qcql: string }
  | { kind: "op"; op: SetOp; left: string; right: string };

export interface StudySet {
  id: string;
  label: string;
  note: string;
  source: SetSource;
}

export interface Study {
  id: string;
  title: string;
  /** free-text write-up for the study as a whole, separate from each set's own note */
  notes: string;
  sets: StudySet[];
  createdAt: string;
  updatedAt: string;
}

/** The format tag written into every exported .qstudy.json, checked on import. */
export const STUDY_FORMAT = "qrr-study-v1";

export const SET_OP_SYMBOL: Record<SetOp, string> = { intersect: "∩", union: "∪", subtract: "−" };

/**
 * What defines a set, as one line: the QCQL source for a query set, or
 * `A ∩ B` (by the referenced sets' own labels) for a derived one. Used both
 * in the UI and in exports, so the two never drift apart.
 */
export function describeSetSource(set: StudySet, allSets: readonly StudySet[]): string {
  if (set.source.kind === "query") return set.source.qcql;
  const byId = new Map(allSets.map((s) => [s.id, s.label]));
  const left = byId.get(set.source.left) ?? "?";
  const right = byId.get(set.source.right) ?? "?";
  return `${left} ${SET_OP_SYMBOL[set.source.op]} ${right}`;
}
