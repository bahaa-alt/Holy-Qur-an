import type { SetOp } from "./types";

/**
 * Set algebra over packed QCQL word-position keys (see packKey in
 * lib/qcql/execute). Plain textbook operations -- the only one worth a
 * comment is subtract, because it is the only one of the three where
 * argument order changes the answer.
 */

export function setIntersect(a: ReadonlySet<number>, b: ReadonlySet<number>): Set<number> {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  const out = new Set<number>();
  for (const key of small) if (large.has(key)) out.add(key);
  return out;
}

export function setUnion(a: ReadonlySet<number>, b: ReadonlySet<number>): Set<number> {
  const out = new Set<number>(a);
  for (const key of b) out.add(key);
  return out;
}

/** Everything in `a` that is not in `b` -- i.e. a − b, not b − a. */
export function setSubtract(a: ReadonlySet<number>, b: ReadonlySet<number>): Set<number> {
  const out = new Set<number>();
  for (const key of a) if (!b.has(key)) out.add(key);
  return out;
}

export function applySetOp(
  op: SetOp,
  left: ReadonlySet<number>,
  right: ReadonlySet<number>,
): Set<number> {
  switch (op) {
    case "intersect":
      return setIntersect(left, right);
    case "union":
      return setUnion(left, right);
    case "subtract":
      return setSubtract(left, right);
  }
}
