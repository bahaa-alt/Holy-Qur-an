import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CHRONOLOGICAL_ORDER_BY_SURAH } from "@/lib/data/chronologicalOrder";
import { executeQcql, packKey, unpackKey, type QcqlCorpus } from "@/lib/qcql/execute";
import { parseQcql } from "@/lib/qcql/parse";
import { QcqlError } from "@/lib/qcql/types";

/**
 * Executed against the REAL corpus, not a fixture.
 *
 * A fixture would prove the set algebra and nothing about whether the
 * language answers questions correctly, which is the only thing that
 * matters here. The counts asserted below were derived independently from
 * the shipped indices, not read off this implementation's output.
 */
const DATA = join(process.cwd(), "public", "data", "v1");
const read = (f: string) => JSON.parse(readFileSync(join(DATA, f), "utf8"));

const corpus: QcqlCorpus = {
  occurrences: read("occurrences.json"),
  syntax: read("syntax.json"),
  index: read("index.json"),
  surahs: read("meta.json").surahs,
};

const run = (src: string) => executeQcql(parseQcql(src), corpus);
const count = (src: string) => run(src).matches.length;

describe("packKey / unpackKey", () => {
  it("round-trips every position the corpus actually contains", () => {
    for (const row of corpus.occurrences.rows) {
      const [s, a, w] = row;
      expect(unpackKey(packKey(s, a, w))).toEqual({ s, a, w });
    }
  });

  it("sorts in corpus order", () => {
    expect(packKey(2, 255, 1)).toBeLessThan(packKey(2, 255, 2));
    expect(packKey(2, 255, 99)).toBeLessThan(packKey(2, 256, 1));
    expect(packKey(2, 286, 99)).toBeLessThan(packKey(3, 1, 1));
  });
});

describe("executeQcql over the real corpus", () => {
  it("counts a root exactly as the root index does", () => {
    // index.json's own count for علم, derived by a different code path.
    const expected = corpus.index.roots.find((r) => r.ar === "علم")!.count;
    expect(count("[root=علم]")).toBe(expected);
  });

  it("finds the documented 1,151 passive segments", () => {
    expect(count("[PASS]")).toBe(1151);
  });

  it("matches rootless particles, which the occurrence index cannot hold", () => {
    // The reason the syntax layer exists: 1,029 conditional particles, most
    // of them carrying no root at all.
    expect(count("[COND]")).toBe(1029);
  });

  it("returns matches in corpus order", () => {
    const keys = run("[root=علم]").matches.map((m) => packKey(m.s, m.a, m.w));
    expect(keys).toEqual([...keys].sort((a, b) => a - b));
  });

  it("counts distinct verses alongside matches", () => {
    const res = run("[root=علم]");
    const verses = new Set(res.matches.map((m) => `${m.s}:${m.a}`));
    expect(res.verseCount).toBe(verses.size);
    expect(res.verseCount).toBeLessThanOrEqual(res.matches.length);
  });
});

describe("set algebra", () => {
  it("intersects", () => {
    const both = count("[root=علم & cat=verb.perf]");
    expect(both).toBeGreaterThan(0);
    expect(both).toBeLessThanOrEqual(Math.min(count("[root=علم]"), count("[cat=verb.perf]")));
  });

  it("unions without double-counting an overlap", () => {
    const a = count("[cat=verb.perf]");
    const b = count("[cat=verb.impf]");
    // Disjoint categories, so the union is exactly the sum.
    expect(count("[cat=verb.perf | cat=verb.impf]")).toBe(a + b);
  });

  it("makes | idempotent and & self-absorbing", () => {
    expect(count("[PASS | PASS]")).toBe(count("[PASS]"));
    expect(count("[PASS & PASS]")).toBe(count("[PASS]"));
  });

  it("negates against the stated universe, and double negation is identity", () => {
    const universe = count("[PASS | !PASS]");
    expect(count("[!PASS]")).toBe(universe - count("[PASS]"));
    expect(count("[!!PASS]")).toBe(count("[PASS]"));
  });

  it("obeys De Morgan", () => {
    expect(count("[!(PASS | COND)]")).toBe(count("[!PASS & !COND]"));
    expect(count("[!(PASS & COND)]")).toBe(count("[!PASS | !COND]"));
  });

  it("gives & higher precedence than |, and parentheses override it", () => {
    expect(count("[PASS & COND | RES]")).toBe(count("[(PASS & COND) | RES]"));
    expect(count("[PASS & (COND | RES)]")).not.toBe(count("[(PASS & COND) | RES]"));
  });

  it("treats pos=V as exactly its three verb categories", () => {
    expect(count("[pos=V]")).toBe(count("[cat=verb.perf | cat=verb.impf | cat=verb.impv]"));
  });
});

describe("the one word in the corpus carrying two roots", () => {
  // 20:94:2 is يَبْنَؤُمَّ, "O son of my mother" -- a single orthographic
  // word built from بني and أمم. It is the only position in 50,269 where
  // word-granularity matching is observable, so it is the test that proves
  // the model does what the doc comment on QCQL_VERSION claims.
  it("is matched by either of its roots", () => {
    const at = (src: string) => run(src).matches.some((m) => m.s === 20 && m.a === 94 && m.w === 2);
    expect(at("[root=بني]")).toBe(true);
    expect(at("[root=أمم]")).toBe(true);
  });

  it("is the only position where an & of two different roots matches", () => {
    const both = run("[root=بني & root=أمم]").matches;
    expect(both).toEqual([{ s: 20, a: 94, w: 2 }]);
  });
});

describe("filters", () => {
  const meccan = new Set(corpus.surahs.filter((s) => s.type === "meccan").map((s) => s.n));

  it("keeps only Meccan surahs, and meccan + medinan partition the result", () => {
    expect(run("[PASS] :: meccan").matches.every((m) => meccan.has(m.s))).toBe(true);
    expect(count("[PASS] :: meccan") + count("[PASS] :: medinan")).toBe(count("[PASS]"));
  });

  it("filters by surah number", () => {
    expect(run("[PASS] :: surah = 2").matches.every((m) => m.s === 2)).toBe(true);
    expect(run("[PASS] :: surah <= 5").matches.every((m) => m.s <= 5)).toBe(true);
    expect(count("[PASS] :: surah != 2")).toBe(count("[PASS]") - count("[PASS] :: surah = 2"));
  });

  it("filters by revelation position, indexed correctly", () => {
    // The array is keyed surah - 1; getting that wrong shifts every
    // chronological result by one surah and nothing else would notice.
    expect(CHRONOLOGICAL_ORDER_BY_SURAH[96 - 1]).toBe(1);
    expect(run("[PASS] :: chrono = 1").matches.every((m) => m.s === 96)).toBe(true);
    expect(
      run("[PASS] :: chrono > 5").matches.every((m) => CHRONOLOGICAL_ORDER_BY_SURAH[m.s - 1] > 5),
    ).toBe(true);
  });

  it("applies several filters conjunctively", () => {
    const res = run("[PASS] :: meccan & surah <= 20");
    expect(res.matches.every((m) => meccan.has(m.s) && m.s <= 20)).toBe(true);
  });

  it("never lets a filter add matches", () => {
    expect(count("[PASS] :: meccan")).toBeLessThanOrEqual(count("[PASS]"));
  });
});

describe("errors that would otherwise read as findings", () => {
  it("rejects an unknown root rather than returning zero matches", () => {
    // A misspelled root silently returning nothing is a false claim about
    // the corpus, which is worse than a failed query.
    expect(() => run("[root=زززز]")).toThrow(QcqlError);
    expect(() => run("[root=زززز]")).toThrow(/No root/);
  });

  it("rejects an unknown lemma the same way", () => {
    expect(() => run("[lemma=زززز]")).toThrow(/No lemma/);
  });

  it("accepts a root by its normalised key as well as its spelling", () => {
    const row = corpus.index.roots.find((r) => r.ar !== r.key)!;
    expect(count(`[root=${row.key}]`)).toBe(count(`[root=${row.ar}]`));
  });
});
