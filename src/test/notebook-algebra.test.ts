import { describe, expect, it } from "vitest";
import { applySetOp, setIntersect, setSubtract, setUnion } from "@/lib/notebook/algebra";

const A = new Set([1, 2, 3]);
const B = new Set([2, 3, 4]);

describe("setIntersect", () => {
  it("keeps only members common to both", () => {
    expect(setIntersect(A, B)).toEqual(new Set([2, 3]));
  });

  it("is symmetric", () => {
    expect(setIntersect(A, B)).toEqual(setIntersect(B, A));
  });

  it("is empty for disjoint sets", () => {
    expect(setIntersect(new Set([1]), new Set([2]))).toEqual(new Set());
  });
});

describe("setUnion", () => {
  it("combines members from both, deduplicated", () => {
    expect(setUnion(A, B)).toEqual(new Set([1, 2, 3, 4]));
  });

  it("is symmetric", () => {
    expect(setUnion(A, B)).toEqual(setUnion(B, A));
  });

  it("does not mutate either input", () => {
    const a = new Set([1]);
    const b = new Set([2]);
    setUnion(a, b);
    expect(a).toEqual(new Set([1]));
    expect(b).toEqual(new Set([2]));
  });
});

describe("setSubtract", () => {
  it("keeps members of a that are not in b", () => {
    expect(setSubtract(A, B)).toEqual(new Set([1]));
  });

  it("is order-sensitive, unlike ∩ and ∪", () => {
    expect(setSubtract(A, B)).not.toEqual(setSubtract(B, A));
    expect(setSubtract(B, A)).toEqual(new Set([4]));
  });

  it("subtracting everything leaves nothing", () => {
    expect(setSubtract(A, A)).toEqual(new Set());
  });

  it("subtracting nothing leaves everything unchanged", () => {
    expect(setSubtract(A, new Set())).toEqual(A);
  });
});

describe("applySetOp", () => {
  it("dispatches to the operation named by `op`", () => {
    expect(applySetOp("intersect", A, B)).toEqual(setIntersect(A, B));
    expect(applySetOp("union", A, B)).toEqual(setUnion(A, B));
    expect(applySetOp("subtract", A, B)).toEqual(setSubtract(A, B));
  });
});
