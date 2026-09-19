import { describe, expect, it } from "vitest";
import { PRUNABLE_BASENAMES, isPrunable } from "../../scripts/lib/prune-export";

describe("isPrunable", () => {
  it("prunes the one segment-cache artifact nothing requests", () => {
    expect(isPrunable("__next._full.txt")).toBe(true);
  });

  it("never prunes the two segment-cache files the client actually fetches", () => {
    // _tree is fetched by next/dist/client/components/segment-cache/cache.js;
    // __PAGE__ appears in the shipped bundle. Deleting either breaks soft
    // navigation, so this is the assertion that guards the whole script.
    expect(isPrunable("__next._tree.txt")).toBe(false);
    expect(isPrunable("__next.1b.__PAGE__.txt")).toBe(false);
    expect(isPrunable("__next.abc123.__PAGE__.txt")).toBe(false);
  });

  it("never prunes the page itself or its navigation payload", () => {
    expect(isPrunable("index.html")).toBe(false);
    expect(isPrunable("index.txt")).toBe(false);
  });

  it("never prunes app data or assets that merely look similar", () => {
    for (const name of [
      "manifest.json",
      "syntax.json",
      "corpus.csv",
      "sw.js",
      "_full.txt",
      "__next._full.txt.bak",
      "my__next._full.txt",
    ]) {
      expect(isPrunable(name), name).toBe(false);
    }
  });

  it("matches exactly, not by prefix or glob", () => {
    // The whole point of an exact list: a pattern like `__next.*` would take
    // the two live files with it, which is the failure this guards against.
    expect(isPrunable("__next.")).toBe(false);
    expect(isPrunable("__next")).toBe(false);
  });

  it("keeps the list minimal, so adding to it is a deliberate act", () => {
    expect(PRUNABLE_BASENAMES).toEqual(["__next._full.txt"]);
  });
});
