import { describe, expect, it } from "vitest";
import type { QcqlCorpus } from "@/lib/qcql/execute";
import { evaluateStudy, matchesOf, studyNeedsMorphology } from "@/lib/notebook/evaluate";
import type { Study, StudySet } from "@/lib/notebook/types";
import type { Cat, OccurrenceIndexRow } from "@/lib/data/types";

/**
 * Same hand-built, hermetic corpus as qcql-execute.test.ts -- see its
 * comment for why. Evaluating a study is mostly "run QCQL, then do set
 * algebra on the results", both already covered elsewhere; what is new
 * here is the graph-walking (derived sets, missing dependencies, cycles).
 */
const CATS: Cat[] = ["verb.perf", "verb.impf", "noun", "properNoun"];
const ROOTS = ["علم", "كتب"];
const LEMMAS = ["عَلِمَ", "كِتاب"];
const ROOT = Object.fromEntries(ROOTS.map((r, i) => [r, i]));
const CAT = Object.fromEntries(CATS.map((c, i) => [c, i]));

/** [s, a, w, rootIdx, lemmaIdx, catIdx, verbForm] */
const OCC: OccurrenceIndexRow[] = [
  [1, 1, 1, ROOT["علم"], 0, CAT["verb.perf"], 1],
  [1, 1, 2, ROOT["كتب"], 1, CAT["noun"], 0],
  [1, 2, 1, ROOT["علم"], 0, CAT["verb.impf"], 4],
  [2, 1, 1, ROOT["علم"], 0, CAT["verb.perf"], 1],
];

const corpus: QcqlCorpus = {
  occurrences: { cats: CATS, rows: OCC },
  syntax: { tags: [], s: [], a: [], w: [], g: [], t: [] },
  index: {
    roots: ROOTS.map((ar, i) => ({
      ar,
      key: `k${i}`,
      bw: "",
      count: 0,
      lemmaCount: 0,
      verseCount: 0,
      glossShort: "",
    })),
    lemmas: LEMMAS.map((lemma, i) => ({ lemma, key: `lk${i}`, rootIdx: i, count: 0, cat: "noun" as Cat })),
  },
  surahs: [
    { n: 1, nameAr: "", nameEn: "", translit: "", type: "meccan", ayahs: 7 },
    { n: 2, nameAr: "", nameEn: "", translit: "", type: "medinan", ayahs: 286 },
  ],
};

// root=علم matches 1:1:1, 1:2:1, 2:1:1
// cat=verb.perf matches 1:1:1, 2:1:1
// root=كتب matches 1:1:2

function study(sets: StudySet[]): Study {
  return { id: "s", title: "S", notes: "", sets, createdAt: "", updatedAt: "" };
}

const at = (keys: ReadonlySet<number>) =>
  [...keys]
    .map((k) => {
      const w = k % 1000;
      const rest = (k - w) / 1000;
      return `${(rest - (rest % 1000)) / 1000}:${rest % 1000}:${w}`;
    })
    .sort();

describe("evaluateStudy -- query sets", () => {
  it("evaluates a base query set", () => {
    const s = study([{ id: "a", label: "A", note: "", source: { kind: "query", qcql: "[root=علم]" } }]);
    const result = evaluateStudy(s, corpus).get("a")!;
    expect(at(result.keys)).toEqual(["1:1:1", "1:2:1", "2:1:1"]);
    expect(result.verseCount).toBe(3);
    expect(result.error).toBeUndefined();
  });

  it("reports a parse error instead of throwing", () => {
    const s = study([{ id: "a", label: "bad", note: "", source: { kind: "query", qcql: "[root=" } }]);
    const result = evaluateStudy(s, corpus).get("a")!;
    expect(result.error).toBeTruthy();
    expect(result.keys.size).toBe(0);
  });
});

describe("evaluateStudy -- derived sets", () => {
  const base: StudySet[] = [
    { id: "a", label: "root علم", note: "", source: { kind: "query", qcql: "[root=علم]" } },
    { id: "b", label: "perfect verbs", note: "", source: { kind: "query", qcql: "[cat=verb.perf]" } },
  ];

  it("intersects two sets", () => {
    const s = study([...base, { id: "c", label: "A∩B", note: "", source: { kind: "op", op: "intersect", left: "a", right: "b" } }]);
    expect(at(evaluateStudy(s, corpus).get("c")!.keys)).toEqual(["1:1:1", "2:1:1"]);
  });

  it("unions two sets", () => {
    const s = study([...base, { id: "c", label: "A∪B", note: "", source: { kind: "op", op: "union", left: "a", right: "b" } }]);
    expect(at(evaluateStudy(s, corpus).get("c")!.keys)).toEqual(["1:1:1", "1:2:1", "2:1:1"]);
  });

  it("subtracts, and is order-sensitive", () => {
    const s = study([
      ...base,
      { id: "c", label: "A-B", note: "", source: { kind: "op", op: "subtract", left: "a", right: "b" } },
      { id: "d", label: "B-A", note: "", source: { kind: "op", op: "subtract", left: "b", right: "a" } },
    ]);
    const evaluated = evaluateStudy(s, corpus);
    expect(at(evaluated.get("c")!.keys)).toEqual(["1:2:1"]);
    expect(at(evaluated.get("d")!.keys)).toEqual([]);
  });

  it("chains through more than one derived set", () => {
    const s = study([
      ...base,
      { id: "c", label: "A∩B", note: "", source: { kind: "op", op: "intersect", left: "a", right: "b" } },
      {
        id: "d",
        label: "كتب",
        note: "",
        source: { kind: "query", qcql: "[root=كتب]" },
      },
      { id: "e", label: "C∪D", note: "", source: { kind: "op", op: "union", left: "c", right: "d" } },
    ]);
    expect(at(evaluateStudy(s, corpus).get("e")!.keys)).toEqual(["1:1:1", "1:1:2", "2:1:1"]);
  });
});

describe("evaluateStudy -- defensive cases (unreachable through the UI, possible via a hand-edited Study)", () => {
  it("reports a missing dependency rather than crashing", () => {
    const s = study([{ id: "c", label: "bad", note: "", source: { kind: "op", op: "union", left: "a", right: "b" } }]);
    const result = evaluateStudy(s, corpus).get("c")!;
    expect(result.error).toBeTruthy();
    expect(result.keys.size).toBe(0);
  });

  it("reports a circular reference rather than recursing forever", () => {
    const s = study([
      { id: "a", label: "A", note: "", source: { kind: "op", op: "union", left: "b", right: "b" } },
      { id: "b", label: "B", note: "", source: { kind: "op", op: "union", left: "a", right: "a" } },
    ]);
    const evaluated = evaluateStudy(s, corpus);
    expect(evaluated.get("a")!.error).toBeTruthy();
    expect(evaluated.get("b")!.error).toBeTruthy();
  });
});

describe("studyNeedsMorphology", () => {
  it("is false when no set reads case/mood/definiteness/pgn", () => {
    expect(
      studyNeedsMorphology(
        study([{ id: "a", label: "A", note: "", source: { kind: "query", qcql: "[root=علم]" } }]),
      ),
    ).toBe(false);
  });

  it("is true when any query set does, even a derived one's ancestor", () => {
    expect(
      studyNeedsMorphology(
        study([{ id: "a", label: "A", note: "", source: { kind: "query", qcql: "[mood=jus]" } }]),
      ),
    ).toBe(true);
  });
});

describe("matchesOf", () => {
  it("returns matches in corpus order", () => {
    const s = study([{ id: "a", label: "A", note: "", source: { kind: "query", qcql: "[root=علم]" } }]);
    const result = evaluateStudy(s, corpus).get("a")!;
    expect(matchesOf(result)).toEqual([
      { s: 1, a: 1, w: 1 },
      { s: 1, a: 2, w: 1 },
      { s: 2, a: 1, w: 1 },
    ]);
  });
});
