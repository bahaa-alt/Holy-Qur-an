import { describe, expect, it } from "vitest";
import { decodeRootsQuery, encodeRootsQuery } from "@/lib/compare/query";

describe("encodeRootsQuery / decodeRootsQuery", () => {
  it("round-trips a list of real roots", () => {
    const roots = ["كتب", "رحم", "قول"];
    expect(decodeRootsQuery(encodeRootsQuery(roots))).toEqual(roots);
  });

  it("round-trips a root containing a hamza losslessly", () => {
    const roots = ["أمن"];
    expect(decodeRootsQuery(encodeRootsQuery(roots))).toEqual(roots);
  });

  it("decodes null and empty-string input as an empty list", () => {
    expect(decodeRootsQuery(null)).toEqual([]);
    expect(decodeRootsQuery("")).toEqual([]);
  });

  it("encodes an empty list as an empty string", () => {
    expect(encodeRootsQuery([])).toBe("");
  });
});
