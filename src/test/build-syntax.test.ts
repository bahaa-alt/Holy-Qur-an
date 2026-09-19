import { describe, expect, it } from "vitest";
import { parseMorphologyTSV } from "../../scripts/lib/parse-morphology";
import { SYNTAX_TAGS, buildSyntax } from "../../scripts/lib/build-syntax";

/** 2:2:1 — ذَٰلِكَ (DEM, not a syntax tag) then كِتَٰبُ (rooted, no syntax tag). */
const NO_SYNTAX_ROWS = [
  "2:2:1:1\tذَٰلِكَ\tN\tDEM|LEM:ذا|MS",
  "2:2:2:2\tكِتَٰبُ\tN\tROOT:كتب|LEM:كِتاب|M|NOM",
].join("\n");

/** A rootless resumption particle (REM) and a rootless negation (NEG). */
const ROOTLESS_ROWS = ["2:3:1:1\tوَ\tP\tREM|LEM:و", "2:3:2:1\tلَا\tP\tNEG|LEM:لا"].join("\n");

/** A rooted PASSIVE verb — rooted, so it is also an "occurrence", but indexed here for voice. */
const PASSIVE_ROW = "2:4:1:1\tقُتِلَ\tV\tPERF|PASS|ROOT:قتل|LEM:قَتَلَ|3MS";

/** A restriction particle (RES, ḥaṣr) — the rhetorical tag with the most research value. */
const RES_ROW = "2:5:1:1\tإِنَّمَا\tP\tRES|LEM:إِنَّما";

function build(tsv: string) {
  return buildSyntax(parseMorphologyTSV(tsv));
}

describe("SYNTAX_TAGS", () => {
  it("is sorted, deduped and non-empty, so tag ids are stable across builds", () => {
    expect(SYNTAX_TAGS.length).toBeGreaterThan(0);
    expect([...SYNTAX_TAGS]).toEqual([...new Set(SYNTAX_TAGS)].sort());
  });

  it("covers the rhetorical tags this layer exists to expose", () => {
    for (const tag of ["RES", "COND", "CIRC", "REM", "NEG", "PRO", "VOC", "EMPH", "INTG", "PASS"]) {
      expect(SYNTAX_TAGS).toContain(tag);
    }
  });

  it("excludes pure morphology — case, gender/number/person, mood and bare POS", () => {
    for (const tag of [
      "NOM",
      "ACC",
      "GEN",
      "3MS",
      "2FP",
      "PERF",
      "IMPF",
      "N",
      "V",
      "DET",
      "PREF",
    ]) {
      expect(SYNTAX_TAGS).not.toContain(tag);
    }
  });
});

describe("buildSyntax", () => {
  it("emits nothing for segments carrying no syntactic tag", () => {
    const idx = build(NO_SYNTAX_ROWS);
    expect(idx.s).toHaveLength(0);
    expect(idx.t).toHaveLength(0);
  });

  it("indexes rootless particles, which never appear in the occurrence index", () => {
    const idx = build(ROOTLESS_ROWS);
    expect(idx.s).toEqual([2, 2]);
    expect(idx.a).toEqual([3, 3]);
    expect(idx.w).toEqual([1, 2]);
    expect(idx.g).toEqual([1, 1]);
    expect(idx.t.map((i) => idx.tags[i])).toEqual(["REM", "NEG"]);
  });

  it("indexes passive voice on a rooted verb without disturbing its category", () => {
    const idx = build(PASSIVE_ROW);
    expect(idx.t.map((i) => idx.tags[i])).toEqual(["PASS"]);
    // (s, a, w) is the join key back to occurrences.json, which still
    // classifies this verb as verb.perf — voice is orthogonal to aspect.
    expect([idx.s[0], idx.a[0], idx.w[0]]).toEqual([2, 4, 1]);
  });

  it("indexes a restriction particle", () => {
    const idx = build(RES_ROW);
    expect(idx.t.map((i) => idx.tags[i])).toEqual(["RES"]);
  });

  it("keeps every column the same length", () => {
    const idx = build([NO_SYNTAX_ROWS, ROOTLESS_ROWS, PASSIVE_ROW, RES_ROW].join("\n"));
    const n = idx.s.length;
    expect(idx.a).toHaveLength(n);
    expect(idx.w).toHaveLength(n);
    expect(idx.g).toHaveLength(n);
    expect(idx.t).toHaveLength(n);
    expect(n).toBe(4);
  });

  it("emits rows in corpus order", () => {
    const idx = build([RES_ROW, ROOTLESS_ROWS].join("\n"));
    // parseMorphologyTSV preserves file order; buildSyntax must not re-sort.
    expect(idx.a).toEqual([5, 3, 3]);
  });

  it("only ever emits tag ids that index into its own vocabulary", () => {
    const idx = build([ROOTLESS_ROWS, PASSIVE_ROW, RES_ROW].join("\n"));
    for (const i of idx.t) {
      expect(idx.tags[i]).toBeDefined();
    }
  });

  it("throws if a segment carries two syntactic tags, rather than silently dropping one", () => {
    // No such segment exists in the real corpus — the encoding depends on
    // that, so a future corpus that breaks it must fail the build loudly.
    const twoTags = "2:6:1:1\tفَلَا\tP\tREM|NEG|LEM:فلا";
    expect(() => build(twoTags)).toThrow(/two syntactic tags|REM|NEG/);
  });
});
