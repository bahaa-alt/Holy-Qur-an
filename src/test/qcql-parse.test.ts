import { describe, expect, it } from "vitest";
import { lex } from "@/lib/qcql/lex";
import { parseQcql } from "@/lib/qcql/parse";
import { QcqlError } from "@/lib/qcql/types";

const fail = (src: string) => {
  try {
    parseQcql(src);
  } catch (e) {
    if (e instanceof QcqlError) return e;
    throw e;
  }
  throw new Error(`Expected ${JSON.stringify(src)} to be rejected, but it parsed`);
};

describe("lex", () => {
  it("skips whitespace and ends with eof", () => {
    expect(lex("  [ ] ").map((t) => t.kind)).toEqual(["[", "]", "eof"]);
  });

  it("prefers the two-character operators over their prefixes", () => {
    // `!=` must not lex as `!` then `=`, and `::` must not be two colons.
    expect(lex("!=").map((t) => t.kind)).toEqual(["!=", "eof"]);
    expect(lex("::").map((t) => t.kind)).toEqual(["::", "eof"]);
    expect(lex("<=>=").map((t) => t.kind)).toEqual(["<=", ">=", "eof"]);
    expect(lex("! =").map((t) => t.kind)).toEqual(["!", "=", "eof"]);
  });

  it("reads Arabic as a single word", () => {
    const toks = lex("root=علم");
    expect(toks.map((t) => t.text)).toEqual(["root", "=", "علم", ""]);
  });

  it("keeps dots and digits inside a word, for cat=verb.perf and vf=4", () => {
    expect(lex("verb.perf")[0].text).toBe("verb.perf");
    expect(lex("11")[0].text).toBe("11");
  });

  it("records the offset of every token", () => {
    expect(lex("  [PASS]").map((t) => t.at)).toEqual([2, 3, 7, 8]);
  });

  it("names the character it could not read, and guesses at a lone colon", () => {
    expect(() => lex("[a] : b")).toThrow(/did you mean "::"/);
    expect(() => lex("a @ b")).toThrow(/Unexpected character "@"/);
  });
});

describe("parseQcql", () => {
  it("parses a single keyed predicate", () => {
    expect(parseQcql("[root=علم]")).toEqual({
      version: 1,
      term: { kind: "pred", pred: { kind: "root", value: "علم" } },
      filters: [],
    });
  });

  it("parses a bare syntax tag, case-insensitively", () => {
    for (const src of ["[PASS]", "[pass]", "[PaSs]"]) {
      expect(parseQcql(src).term).toEqual({ kind: "pred", pred: { kind: "tag", value: "PASS" } });
    }
  });

  it("binds & tighter than |", () => {
    const term = parseQcql("[PASS & COND | RES]").term;
    expect(term.kind).toBe("or");
    if (term.kind !== "or") throw new Error("unreachable");
    expect(term.left.kind).toBe("and");
    expect(term.right).toEqual({ kind: "pred", pred: { kind: "tag", value: "RES" } });
  });

  it("lets parentheses override that", () => {
    const term = parseQcql("[PASS & (COND | RES)]").term;
    expect(term.kind).toBe("and");
    if (term.kind !== "and") throw new Error("unreachable");
    expect(term.right.kind).toBe("or");
  });

  it("parses negation, including doubled", () => {
    expect(parseQcql("[!PASS]").term).toEqual({
      kind: "not",
      expr: { kind: "pred", pred: { kind: "tag", value: "PASS" } },
    });
    expect(parseQcql("[!!PASS]").term.kind).toBe("not");
  });

  it("parses filters after ::", () => {
    expect(parseQcql("[PASS] :: meccan").filters).toEqual([
      { kind: "revelation", value: "meccan" },
    ]);
    expect(parseQcql("[PASS] :: chrono > 5 & surah <= 20").filters).toEqual([
      { kind: "chrono", op: ">", value: 5 },
      { kind: "surah", op: "<=", value: 20 },
    ]);
    expect(parseQcql("[PASS] :: noldeke > 5").filters).toEqual([
      { kind: "noldeke", op: ">", value: 5 },
    ]);
  });

  it("accepts every comparison operator", () => {
    for (const op of ["=", "!=", "<", "<=", ">", ">="] as const) {
      expect(parseQcql(`[PASS] :: chrono ${op} 5`).filters[0]).toEqual({
        kind: "chrono",
        op,
        value: 5,
      });
    }
  });

  it("parses pos as sugar, and cat by its exact name", () => {
    expect(parseQcql("[pos=V]").term).toEqual({
      kind: "pred",
      pred: { kind: "pos", value: "V" },
    });
    expect(parseQcql("[cat=verb.perf]").term).toEqual({
      kind: "pred",
      pred: { kind: "cat", value: "verb.perf" },
    });
  });

  it("stamps the language version, so a permalink keeps its meaning", () => {
    expect(parseQcql("[PASS]").version).toBe(1);
  });
});

describe("parseQcql errors", () => {
  it("points at the offending text with an offset", () => {
    const e = fail("[root=علم & NOPE]");
    expect(e.text).toBe("NOPE");
    expect(e.at).toBe(12);
    expect(e.message).toMatch(/Unknown tag/);
  });

  it("rejects pos=P with the reason, not an empty result", () => {
    // The whole point: particles carry no root, so they are absent from
    // the occurrence index. Returning zero matches would read as a finding.
    const e = fail("[pos=P]");
    expect(e.message).toMatch(/particles carry no root/);
    expect(e.message).toMatch(/\[COND\]/);
  });

  it("tells a field apart from a tag when the value is missing", () => {
    expect(fail("[root]").message).toMatch(/needs a value, as in root=/);
  });

  it("lists the valid tags for a misspelling", () => {
    expect(fail("[CONDD]").message).toMatch(/COND/);
  });

  it("names the empty term rather than blaming the bracket", () => {
    expect(fail("[]").message).toMatch(/only meaningful in a sequence/);
  });

  it("rejects an unclosed term, an empty query, and trailing junk", () => {
    expect(fail("[PASS").message).toMatch(/Expected a closing \]/);
    expect(fail("").message).toMatch(/Empty query/);
    expect(fail("[PASS] junk").message).toMatch(/Unexpected "junk" after the query/);
  });

  it("rejects a verb form outside I-XI", () => {
    expect(fail("[vf=0]").message).toMatch(/1 to 11/);
    expect(fail("[vf=12]").message).toMatch(/1 to 11/);
    expect(fail("[vf=x]").message).toMatch(/1 to 11/);
  });

  it("rejects an out-of-range surah position", () => {
    expect(fail("[PASS] :: surah > 115").message).toMatch(/1 to 114/);
    expect(fail("[PASS] :: chrono > 0").message).toMatch(/1 to 114/);
  });

  it("rejects unknown fields, categories and filters by name", () => {
    expect(fail("[colour=red]").message).toMatch(/Unknown field "colour"/);
    expect(fail("[cat=sonnet]").message).toMatch(/Unknown category "sonnet"/);
    expect(fail("[PASS] :: springtime").message).toMatch(/Unknown filter "springtime"/);
  });

  it("requires a comparison after chrono", () => {
    expect(fail("[PASS] :: chrono 5").message).toMatch(/Expected a comparison after chrono/);
  });
});

describe("morphology predicates", () => {
  it("parses each feature, case-insensitively", () => {
    expect(parseQcql("[case=acc]").term).toEqual({
      kind: "pred",
      pred: { kind: "case", value: "ACC" },
    });
    expect(parseQcql("[mood=JUS]").term).toEqual({
      kind: "pred",
      pred: { kind: "mood", value: "JUS" },
    });
    expect(parseQcql("[def=Indef]").term).toEqual({
      kind: "pred",
      pred: { kind: "def", value: "INDEF" },
    });
    expect(parseQcql("[pgn=2fp]").term).toEqual({
      kind: "pred",
      pred: { kind: "pgn", value: "2FP" },
    });
  });

  it("accepts every person-gender-number shape the corpus writes", () => {
    for (const v of ["3ms", "2fp", "1p", "mp", "fs", "d", "3fd"]) {
      expect(() => parseQcql(`[pgn=${v}]`), v).not.toThrow();
    }
  });

  it("names the alternatives when a value is wrong", () => {
    expect(fail("[case=nominative]").message).toMatch(/nom, acc, gen/);
    expect(fail("[mood=optative]").message).toMatch(/ind, subj, jus/);
    expect(fail("[def=maybe]").message).toMatch(/det, indef/);
  });

  it("explains the shape of a person-gender-number rather than listing 24", () => {
    const e = fail("[pgn=plural]");
    expect(e.message).toMatch(/optional person/);
    expect(e.message).toMatch(/3MS/);
  });

  it("lists the new fields when one is misspelled", () => {
    expect(fail("[cse=acc]").message).toMatch(/case, mood, def, pgn/);
  });

  it("tells a bare field name from a tag", () => {
    expect(fail("[case]").message).toMatch(/needs a value, as in case=/);
  });
});
