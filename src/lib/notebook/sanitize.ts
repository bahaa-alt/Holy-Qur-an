import type { SetOp, StudySet } from "./types";

/**
 * Defends `importStudyJson` against a hand-edited or malicious .qstudy.json.
 *
 * A study's `op` sets reference other sets by id, which makes the set list
 * a graph, not just an array -- so importing one has two failure modes a
 * plain shape check misses: a reference to an id that was never defined
 * (dangling), and a reference cycle (A built from B built from A). Both are
 * impossible to create through this app's own UI, which only ever combines
 * two EXISTING sets into a new one, but an imported file is untrusted input
 * and might contain either. Rather than reject the whole study, drop only
 * the sets that are actually broken -- everything valid still imports.
 */

const OPS: readonly SetOp[] = ["intersect", "union", "subtract"];

function isValidSetShape(value: unknown): value is StudySet {
  if (typeof value !== "object" || value === null) return false;
  const s = value as Record<string, unknown>;
  if (typeof s.id !== "string" || s.id === "") return false;
  if (typeof s.label !== "string") return false;
  if (typeof s.note !== "string") return false;
  const src = s.source;
  if (typeof src !== "object" || src === null) return false;
  const source = src as Record<string, unknown>;
  if (source.kind === "query") return typeof source.qcql === "string";
  if (source.kind === "op") {
    return (
      OPS.includes(source.op as SetOp) &&
      typeof source.left === "string" &&
      typeof source.right === "string"
    );
  }
  return false;
}

function pruneDangling(sets: readonly StudySet[]): StudySet[] {
  let current = sets;
  for (;;) {
    const ids = new Set(current.map((s) => s.id));
    const next = current.filter(
      (s) => s.source.kind !== "op" || (ids.has(s.source.left) && ids.has(s.source.right)),
    );
    if (next.length === current.length) return next;
    current = next;
  }
}

/** Ids that sit on a reference cycle, found by DFS with an explicit path/stack. */
function findCyclicIds(sets: readonly StudySet[]): Set<string> {
  const byId = new Map(sets.map((s) => [s.id, s]));
  const state = new Map<string, "visiting" | "done">();
  const cyclic = new Set<string>();

  function visit(id: string, stack: readonly string[]): void {
    if (state.get(id) === "done") return;
    if (state.get(id) === "visiting") {
      const start = stack.indexOf(id);
      for (const onPath of stack.slice(start)) cyclic.add(onPath);
      return;
    }
    const set = byId.get(id);
    if (!set) return; // dangling refs are pruneDangling's job, not this one's
    state.set(id, "visiting");
    if (set.source.kind === "op") {
      visit(set.source.left, [...stack, id]);
      visit(set.source.right, [...stack, id]);
    }
    state.set(id, "done");
  }

  for (const s of sets) visit(s.id, []);
  return cyclic;
}

export function sanitizeStudySets(raw: unknown): StudySet[] {
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const structurallyValid: StudySet[] = [];
  for (const candidate of raw) {
    if (!isValidSetShape(candidate) || seen.has(candidate.id)) continue;
    seen.add(candidate.id);
    structurallyValid.push(candidate);
  }

  let sets = pruneDangling(structurallyValid);
  const cyclic = findCyclicIds(sets);
  if (cyclic.size > 0) {
    sets = pruneDangling(sets.filter((s) => !cyclic.has(s.id)));
  }
  return sets;
}
