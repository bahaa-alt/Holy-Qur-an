import { describe, expect, it } from "vitest";
import { executeQcql, packKey, unpackKey, type QcqlCorpus } from "@/lib/qcql/execute";
import { parseQcql } from "@/lib/qcql/parse";
import { QcqlError } from "@/lib/qcql/types";
import type { Cat, OccurrenceIndexRow } from "@/lib/data/types";

/**
 * Hermetic: a hand-built corpus, not public/data/v1.
 *
 * These tests are about the LANGUAGE -- set algebra, precedence, negation
 * against a stated universe, filters -- none of which needs 50,269 real
 * rows to exercise, and all of which is clearer against a corpus small
 * enough to read. It also follows this repo's rule, stated in
 * topicDefinitions.test.ts: a unit test should not depend on the data
 * pipeline having run, which is exactly what broke this file in CI first
 * time round.
 *
 * The claims that DO need the real corpus -- that PASS is 1,151 rows, that
 * 20:94:2 is the only word carrying two roots -- are asserted in
 * scripts/build-data.ts against the built corpus, where every other corpus
 * fact in this project is already asserted. That is the stronger place for
 * them: they run on every data build, not only when someone happens to
 * have built the data before running tests.
 */

const CATS: Cat[] = ["verb.perf", "verb.impf", "noun", "properNoun"];
const TAGS = ["COND", "PASS", "RES"];

const ROOTS = ["علم", "كتب", "بني", "أمم"];
const LEMMAS = ["عَلِمَ", "كِتاب", "ابْن", "أُمّ"];

const ROOT = Object.fromEntries(ROOTS.map((r, i) => [r, i]));
const CAT = Object.fromEntries(CATS.map((c, i) => [c, i]));
const TAG = Object.fromEntries(TAGS.map((t, i) => [t, i]));

/** [s, a, w, rootIdx, lemmaIdx, catIdx, verbForm] */
const OCC: OccurrenceIndexRow[] = [
  // Surah 1 (Meccan, revelation position 5)
  [1, 1, 1, ROOT["علم"], 0, CAT["verb.perf"], 1],
  [1, 1, 2, ROOT["كتب"], 1, CAT["noun"], 0],
  [1, 2, 1, ROOT["علم"], 0, CAT["verb.impf"], 4],
  // Surah 2 (Medinan, revelation position 87)
  [2, 1, 1, ROOT["علم"], 0, CAT["verb.perf"], 1],
  [2, 1, 3, ROOT["كتب"], 1, CAT["properNoun"], 0],
  // One WORD carrying two roots, the shape 20:94:2 has in the real corpus.
  [2, 5, 2, ROOT["بني"], 2, CAT["noun"], 0],
  [2, 5, 2, ROOT["أمم"], 3, CAT["noun"], 0],
];

/** Columnar, like the shipped syntax index. Includes rootless positions. */
const SYN = {
  tags: TAGS,
  //      1:1:1  1:3:1  2:1:1  2:9:4
  s: [1, 1, 2, 2],
  a: [1, 3, 1, 9],
  w: [1, 1, 1, 4],
  g: [1, 1, 1, 1],
  t: [TAG["PASS"], TAG["COND"], TAG["RES"], TAG["COND"]],
};

const corpus: QcqlCorpus = {
  occurrences: { cats: CATS, rows: OCC },
  syntax: SYN,
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
    lemmas: LEMMAS.map((lemma, i) => ({
      lemma,
      key: `lk${i}`,
      rootIdx: i,
      count: 0,
      cat: "noun" as Cat,
    })),
  },
  // Surah 1 is 5th by revelation, surah 2 is 87th -- matching the real
  // order, so the chrono tests below assert against true positions.
  surahs: [
    { n: 1, nameAr: "", nameEn: "", translit: "", type: "meccan", ayahs: 7 },
    { n: 2, nameAr: "", nameEn: "", translit: "", type: "medinan", ayahs: 286 },
  ],
};

const run = (src: string) => executeQcql(parseQcql(src), corpus);
const at = (src: string) => run(src).matches.map((m) => `${m.s}:${m.a}:${m.w}`);
const count = (src: string) => run(src).matches.length;

describe("packKey / unpackKey", () => {
  it("round-trips, including the corpus's largest real coordinates", () => {
    for (const [s, a, w] of [
      [1, 1, 1],
      [2, 255, 4],
      [114, 6, 3],
      [2, 286, 129],
    ]) {
      expect(unpackKey(packKey(s, a, w))).toEqual({ s, a, w });
    }
  });

  it("sorts in corpus order", () => {
    expect(packKey(2, 255, 1)).toBeLessThan(packKey(2, 255, 2));
    expect(packKey(2, 255, 99)).toBeLessThan(packKey(2, 256, 1));
    expect(packKey(2, 286, 99)).toBeLessThan(packKey(3, 1, 1));
  });
});

describe("predicates", () => {
  it("matches a root", () => {
    expect(at("[root=علم]")).toEqual(["1:1:1", "1:2:1", "2:1:1"]);
  });

  it("matches a category, and pos as its set of categories", () => {
    expect(at("[cat=verb.perf]")).toEqual(["1:1:1", "2:1:1"]);
    expect(at("[pos=V]")).toEqual(["1:1:1", "1:2:1", "2:1:1"]);
    expect(count("[pos=V]")).toBe(count("[cat=verb.perf | cat=verb.impf]"));
  });

  it("matches a verb form", () => {
    expect(at("[vf=4]")).toEqual(["1:2:1"]);
  });

  it("matches a lemma", () => {
    expect(at("[lemma=كِتاب]")).toEqual(["1:1:2", "2:1:3"]);
  });

  it("matches a tag on a ROOTLESS position, which the occurrence index lacks", () => {
    // 1:3:1 and 2:9:4 appear in no occurrence row. The whole reason the
    // syntax layer is queried separately.
    expect(at("[COND]")).toEqual(["1:3:1", "2:9:4"]);
  });

  it("returns matches in corpus order regardless of evaluation order", () => {
    expect(at("[COND | root=علم]")).toEqual(["1:1:1", "1:2:1", "1:3:1", "2:1:1", "2:9:4"]);
  });

  it("counts distinct verses", () => {
    const res = run("[root=علم]");
    expect(res.matches.length).toBe(3);
    expect(res.verseCount).toBe(3);
    expect(run("[root=بني | root=أمم]").verseCount).toBe(1);
  });
});

describe("set algebra", () => {
  it("intersects, including across the two indices", () => {
    // 1:1:1 is both a perfect verb from علم and a PASS-tagged position.
    expect(at("[root=علم & PASS]")).toEqual(["1:1:1"]);
  });

  it("unions without double-counting", () => {
    expect(count("[cat=verb.perf | cat=verb.impf]")).toBe(3);
    expect(count("[root=علم | cat=verb.perf]")).toBe(3);
  });

  it("is idempotent under | and &", () => {
    expect(at("[PASS | PASS]")).toEqual(at("[PASS]"));
    expect(at("[PASS & PASS]")).toEqual(at("[PASS]"));
  });

  it("negates against the universe of both indices, not the whole Qur'an", () => {
    const universe = count("[PASS | !PASS]");
    // Eight distinct word positions across both indices: the occurrence
    // index contributes six (2:5:2 is one position carrying two rows) and
    // the syntax index adds two more that carry no root at all.
    expect(universe).toBe(8);
    expect(count("[!PASS]")).toBe(universe - count("[PASS]"));
    expect(at("[!!PASS]")).toEqual(at("[PASS]"));
  });

  it("obeys De Morgan", () => {
    expect(at("[!(PASS | COND)]")).toEqual(at("[!PASS & !COND]"));
    expect(at("[!(PASS & COND)]")).toEqual(at("[!PASS | !COND]"));
  });

  it("binds & tighter than |, and parentheses override it", () => {
    expect(at("[root=علم & PASS | COND]")).toEqual(at("[(root=علم & PASS) | COND]"));
    expect(at("[root=علم & (PASS | COND)]")).toEqual(["1:1:1"]);
    expect(at("[root=علم & PASS | COND]")).not.toEqual(at("[root=علم & (PASS | COND)]"));
  });
});

describe("a word carrying two roots", () => {
  // The real corpus has exactly one, 20:94:2 (يَبْنَؤُمَّ, from بني and
  // أمم); build-data.ts asserts that. This is the same shape, testing what
  // the word-granularity model does with it.
  it("is matched by either root", () => {
    expect(at("[root=بني]")).toEqual(["2:5:2"]);
    expect(at("[root=أمم]")).toEqual(["2:5:2"]);
  });

  it("is matched by an & of both, which no single-rooted word can be", () => {
    expect(at("[root=بني & root=أمم]")).toEqual(["2:5:2"]);
    expect(at("[root=علم & root=كتب]")).toEqual([]);
  });

  it("counts once, not twice", () => {
    expect(count("[root=بني | root=أمم]")).toBe(1);
  });
});

describe("filters", () => {
  it("keeps one revelation type, and the two partition the result", () => {
    expect(at("[root=علم] :: meccan")).toEqual(["1:1:1", "1:2:1"]);
    expect(at("[root=علم] :: medinan")).toEqual(["2:1:1"]);
    expect(count("[root=علم] :: meccan") + count("[root=علم] :: medinan")).toBe(
      count("[root=علم]"),
    );
  });

  it("compares surah numbers with every operator", () => {
    expect(at("[root=علم] :: surah = 1")).toEqual(["1:1:1", "1:2:1"]);
    expect(at("[root=علم] :: surah != 1")).toEqual(["2:1:1"]);
    expect(at("[root=علم] :: surah >= 2")).toEqual(["2:1:1"]);
    expect(at("[root=علم] :: surah < 2")).toEqual(["1:1:1", "1:2:1"]);
  });

  it("compares revelation position, which is not surah order", () => {
    // Surah 1 is 5th revealed and surah 2 is 87th, so `chrono < 10` keeps
    // surah 1 and drops surah 2 -- the opposite of what surah order would
    // give for `< 10`, which is the point of having the filter at all.
    expect(at("[root=علم] :: chrono < 10")).toEqual(["1:1:1", "1:2:1"]);
    expect(at("[root=علم] :: chrono = 5")).toEqual(["1:1:1", "1:2:1"]);
    expect(at("[root=علم] :: chrono > 10")).toEqual(["2:1:1"]);
  });

  it("applies several filters conjunctively", () => {
    expect(at("[root=علم] :: meccan & surah = 1")).toEqual(["1:1:1", "1:2:1"]);
    expect(at("[root=علم] :: meccan & surah = 2")).toEqual([]);
  });

  it("never adds matches", () => {
    expect(count("[root=علم] :: meccan")).toBeLessThanOrEqual(count("[root=علم]"));
  });
});

describe("errors that would otherwise read as findings", () => {
  it("rejects an unknown root rather than returning zero matches", () => {
    // A misspelling silently returning nothing is a false claim about the
    // corpus, which is worse than a failed query.
    expect(() => run("[root=زززز]")).toThrow(QcqlError);
    expect(() => run("[root=زززز]")).toThrow(/No root/);
  });

  it("rejects an unknown lemma the same way", () => {
    expect(() => run("[lemma=زززز]")).toThrow(/No lemma/);
  });

  it("accepts a root by its normalised key as well as its spelling", () => {
    expect(at("[root=k0]")).toEqual(at("[root=علم]"));
  });
});
