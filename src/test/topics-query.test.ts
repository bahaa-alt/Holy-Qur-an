import { describe, expect, it } from "vitest";
import { decodeTopicsQuery, encodeTopicsQuery } from "@/lib/topics/query";

describe("encodeTopicsQuery / decodeTopicsQuery", () => {
  it("round-trips a list of real topic slugs", () => {
    const slugs = ["paradise-and-gardens", "jinn", "hajj-and-pilgrimage"];
    expect(decodeTopicsQuery(encodeTopicsQuery(slugs))).toEqual(slugs);
  });

  it("decodes null and empty-string input as an empty list", () => {
    expect(decodeTopicsQuery(null)).toEqual([]);
    expect(decodeTopicsQuery("")).toEqual([]);
  });

  it("encodes an empty list as an empty string", () => {
    expect(encodeTopicsQuery([])).toBe("");
  });
});
