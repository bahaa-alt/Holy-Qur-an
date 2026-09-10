import { describe, expect, it } from "vitest";
import { buildLemmaDeck, buildRootDeck } from "@/lib/flashcards/buildDeck";
import type { IndexLemmaRow, IndexRootRow } from "@/lib/data/types";

function makeRoot(ar: string): IndexRootRow {
  return { ar, key: ar, bw: ar, count: 1, lemmaCount: 1, verseCount: 1, glossShort: `gloss of ${ar}` };
}

const roots = [makeRoot("كتب"), makeRoot("رحم")];
const lemmas: IndexLemmaRow[] = [
  { lemma: "كَتَبَ", key: "كتب", rootIdx: 0, count: 10, cat: "verb.perf" },
  { lemma: "رَحْمَٰن", key: "رحمن", rootIdx: 1, count: 5, cat: "properNoun" },
  { lemma: "وَ", key: "و", rootIdx: -1, count: 100, cat: "other" },
];

describe("buildRootDeck", () => {
  it("builds one card per root, ided by root text", () => {
    const deck = buildRootDeck(roots);
    expect(deck).toEqual([
      { id: "root:كتب", kind: "roots", ar: "كتب", root: "كتب" },
      { id: "root:رحم", kind: "roots", ar: "رحم", root: "رحم" },
    ]);
  });
});

describe("buildLemmaDeck", () => {
  it("only includes rooted lemmas, resolving each to its root's Arabic text", () => {
    const deck = buildLemmaDeck(lemmas, roots);
    expect(deck).toEqual([
      { id: "lemma:كتب", kind: "lemmas", ar: "كَتَبَ", root: "كتب", lemmaKey: "كتب" },
      { id: "lemma:رحمن", kind: "lemmas", ar: "رَحْمَٰن", root: "رحم", lemmaKey: "رحمن" },
    ]);
  });

  it("excludes rootless lemmas", () => {
    const deck = buildLemmaDeck(lemmas, roots);
    expect(deck.some((c) => c.id === "lemma:و")).toBe(false);
  });
});
