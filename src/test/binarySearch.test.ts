import { describe, expect, it } from "vitest";
import { prefixRange } from "@/lib/search/binarySearch";

describe("prefixRange", () => {
  const words = ["apple", "application", "apply", "banana", "band", "bandana", "cat"].sort();

  it("finds the exact range of a matching prefix", () => {
    const [start, end] = prefixRange(words, "app", (w) => w);
    expect(words.slice(start, end)).toEqual(["apple", "application", "apply"]);
  });

  it("finds a narrower prefix match", () => {
    const [start, end] = prefixRange(words, "ban", (w) => w);
    expect(words.slice(start, end)).toEqual(["banana", "band", "bandana"]);
  });

  it("returns an empty range for a prefix with no matches", () => {
    const [start, end] = prefixRange(words, "xyz", (w) => w);
    expect(start).toBe(end);
  });

  it("returns the whole array for an empty prefix", () => {
    const [start, end] = prefixRange(words, "", (w) => w);
    expect(end - start).toBe(words.length);
  });

  it("matches a single exact full-word entry", () => {
    const [start, end] = prefixRange(words, "cat", (w) => w);
    expect(words.slice(start, end)).toEqual(["cat"]);
  });

  it("handles a prefix matching everything up to the array end", () => {
    const [start, end] = prefixRange(words, "cat", (w) => w);
    expect(end).toBe(words.length);
    expect(start).toBeLessThan(words.length);
  });

  it("works on Arabic keys", () => {
    const roots = ["أله", "أمن", "بني", "رحم", "كتب", "كون"].sort((a, b) => a.localeCompare(b));
    const [start, end] = prefixRange(roots, "كت", (r) => r);
    expect(roots.slice(start, end)).toEqual(["كتب"]);
  });

  it("uses a custom key extractor", () => {
    const items = [{ key: "a", v: 1 }, { key: "ab", v: 2 }, { key: "b", v: 3 }];
    const [start, end] = prefixRange(items, "a", (i) => i.key);
    expect(items.slice(start, end).map((i) => i.v)).toEqual([1, 2]);
  });

  it("handles an empty array", () => {
    expect(prefixRange([], "x", (w: string) => w)).toEqual([0, 0]);
  });
});
