import { CATEGORY_LABELS, type Cat } from "@/lib/data/types";
import { SYNTAX_TAGS } from "@/lib/morphology/syntaxTags";
import {
  MORPH_CASES,
  MORPH_DEFINITENESS,
  MORPH_MOODS,
  PGN_PATTERN,
} from "@/lib/morphology/morphFeatures";
import { lex, type Token } from "./lex";
import {
  QCQL_VERSION,
  QcqlError,
  type CompareOp,
  type Expr,
  type Filter,
  type Predicate,
  type Query,
} from "./types";

const CATS = Object.keys(CATEGORY_LABELS) as Cat[];
const COMPARE_OPS: readonly CompareOp[] = ["=", "!=", "<", "<=", ">", ">="];

/**
 * Recursive-descent parser for QCQL v1.
 *
 *   query   := term ( "::" filters )?
 *   term    := "[" expr "]"
 *   expr    := or
 *   or      := and ( "|" and )*
 *   and     := unary ( "&" unary )*
 *   unary   := "!" unary | atom
 *   atom    := "(" expr ")" | predicate
 *   filters := filter ( "&" filter )*
 *
 * `&` binds tighter than `|`, as in every language that has both, so
 * `[a & b | c]` is `(a & b) | c`. Parenthesise to say otherwise.
 *
 * Errors carry the offset and the offending text so the query box can point
 * at the character rather than saying "invalid query" -- a query language
 * nobody can debug is a query language nobody uses.
 */
class Parser {
  private pos = 0;

  constructor(private readonly tokens: Token[]) {}

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private next(): Token {
    return this.tokens[this.pos++];
  }

  private expect(kind: Token["kind"], what: string): Token {
    const tok = this.peek();
    if (tok.kind !== kind) {
      const found = tok.kind === "eof" ? "end of query" : `"${tok.text}"`;
      throw new QcqlError(`Expected ${what}, found ${found}`, tok.at, tok.text);
    }
    return this.next();
  }

  parseQuery(): Query {
    const term = this.parseTerm();
    const filters: Filter[] = [];

    if (this.peek().kind === "::") {
      this.next();
      filters.push(this.parseFilter());
      while (this.peek().kind === "&") {
        this.next();
        filters.push(this.parseFilter());
      }
    }

    const tail = this.peek();
    if (tail.kind !== "eof") {
      throw new QcqlError(`Unexpected "${tail.text}" after the query`, tail.at, tail.text);
    }
    return { version: QCQL_VERSION, term, filters };
  }

  private parseTerm(): Expr {
    this.expect("[", "a term, starting with [");
    if (this.peek().kind === "]") {
      // `[]` is the v2 "any word" wildcard used in sequences. Naming it
      // beats "expected a predicate", which would not hint that the empty
      // bracket is meaningful at all.
      throw new QcqlError(
        "An empty term [] matches any word, which is only meaningful in a sequence. Sequences are not in QCQL v1.",
        this.peek().at,
        "[]",
      );
    }
    const expr = this.parseExpr();
    this.expect("]", "a closing ]");
    return expr;
  }

  private parseExpr(): Expr {
    let left = this.parseAnd();
    while (this.peek().kind === "|") {
      this.next();
      left = { kind: "or", left, right: this.parseAnd() };
    }
    return left;
  }

  private parseAnd(): Expr {
    let left = this.parseUnary();
    while (this.peek().kind === "&") {
      this.next();
      left = { kind: "and", left, right: this.parseUnary() };
    }
    return left;
  }

  private parseUnary(): Expr {
    if (this.peek().kind === "!") {
      this.next();
      return { kind: "not", expr: this.parseUnary() };
    }
    return this.parseAtom();
  }

  private parseAtom(): Expr {
    if (this.peek().kind === "(") {
      this.next();
      const expr = this.parseExpr();
      this.expect(")", "a closing )");
      return expr;
    }
    return { kind: "pred", pred: this.parsePredicate() };
  }

  private parsePredicate(): Predicate {
    const tok = this.expect("word", "a predicate");

    if (this.peek().kind !== "=") return this.bareTag(tok);
    this.next();
    const valueTok = this.expect("word", `a value for ${tok.text}`);
    return this.keyed(tok, valueTok);
  }

  /** A word with no `=` after it: the only valid form is a syntax tag. */
  private bareTag(tok: Token): Predicate {
    const upper = tok.text.toUpperCase();
    if (SYNTAX_TAGS.includes(upper)) return { kind: "tag", value: upper };

    const key = tok.text.toLowerCase();
    if (["root", "lemma", "cat", "pos", "vf", "case", "mood", "def", "pgn"].includes(key)) {
      throw new QcqlError(`"${tok.text}" needs a value, as in ${key}=…`, tok.at, tok.text);
    }
    throw new QcqlError(
      `Unknown tag "${tok.text}". Tags are: ${SYNTAX_TAGS.join(", ")}`,
      tok.at,
      tok.text,
    );
  }

  private keyed(keyTok: Token, valueTok: Token): Predicate {
    const key = keyTok.text.toLowerCase();
    const value = valueTok.text;

    switch (key) {
      case "root":
        return { kind: "root", value };
      case "lemma":
        return { kind: "lemma", value };

      case "cat": {
        const cat = CATS.find((c) => c.toLowerCase() === value.toLowerCase());
        if (!cat) {
          throw new QcqlError(
            `Unknown category "${value}". Categories are: ${CATS.join(", ")}`,
            valueTok.at,
            value,
          );
        }
        return { kind: "cat", value: cat };
      }

      case "pos": {
        const pos = value.toUpperCase();
        if (pos === "V" || pos === "N") return { kind: "pos", value: pos };
        if (pos === "P") {
          // Not an oversight. Particles carry no root, so they are absent
          // from the occurrence index entirely and pos=P could only ever
          // return nothing -- an empty result that reads like a finding.
          throw new QcqlError(
            "pos=P has no matches by construction: particles carry no root, so they are not in the occurrence index. Query them by their function tag instead, e.g. [COND] or [NEG].",
            valueTok.at,
            value,
          );
        }
        throw new QcqlError(`Unknown part of speech "${value}". Use V or N.`, valueTok.at, value);
      }

      case "vf": {
        const n = Number(value);
        if (!Number.isInteger(n) || n < 1 || n > 11) {
          throw new QcqlError(
            `Verb form must be a whole number from 1 to 11 (Form I-XI), not "${value}"`,
            valueTok.at,
            value,
          );
        }
        return { kind: "vf", value: n };
      }

      case "case":
        return { kind: "case", value: oneOf(MORPH_CASES, value, valueTok, "case") };
      case "mood":
        return { kind: "mood", value: oneOf(MORPH_MOODS, value, valueTok, "mood") };
      case "def":
        return {
          kind: "def",
          value: oneOf(MORPH_DEFINITENESS, value, valueTok, "definiteness"),
        };

      case "pgn": {
        const pgn = value.toUpperCase();
        if (!PGN_PATTERN.test(pgn)) {
          throw new QcqlError(
            `"${value}" is not a person-gender-number. Write an optional person (1-3), an optional gender (M/F) and a number (S/D/P) -- for example 3MS, 2FP, 1P or MP.`,
            valueTok.at,
            value,
          );
        }
        return { kind: "pgn", value: pgn };
      }

      default:
        throw new QcqlError(
          `Unknown field "${keyTok.text}". Fields are: root, lemma, cat, pos, vf, case, mood, def, pgn — or a bare tag such as PASS.`,
          keyTok.at,
          keyTok.text,
        );
    }
  }

  private parseFilter(): Filter {
    const tok = this.expect("word", "a filter");
    const key = tok.text.toLowerCase();

    if (key === "meccan" || key === "medinan") return { kind: "revelation", value: key };

    if (key === "chrono" || key === "surah") {
      const opTok = this.next();
      const op = COMPARE_OPS.find((o) => o === opTok.kind);
      if (!op) {
        throw new QcqlError(
          `Expected a comparison after ${key} (=, !=, <, <=, >, >=)`,
          opTok.at,
          opTok.text,
        );
      }
      const valueTok = this.expect("word", `a number for ${key}`);
      const n = Number(valueTok.text);
      if (!Number.isInteger(n) || n < 1 || n > 114) {
        throw new QcqlError(
          `${key} takes a surah position from 1 to 114, not "${valueTok.text}"`,
          valueTok.at,
          valueTok.text,
        );
      }
      return { kind: key, op, value: n };
    }

    throw new QcqlError(
      `Unknown filter "${tok.text}". Filters are: meccan, medinan, chrono, surah.`,
      tok.at,
      tok.text,
    );
  }
}

/**
 * Resolves a value against a closed vocabulary, case-insensitively.
 *
 * Names the alternatives on failure rather than saying "invalid": the
 * vocabularies are short and a reader who mistypes `case=nominative` should
 * be told it is `nom` rather than sent to read the source.
 */
function oneOf<T extends string>(
  vocabulary: readonly T[],
  value: string,
  tok: Token,
  what: string,
): T {
  const hit = vocabulary.find((v) => v.toLowerCase() === value.toLowerCase());
  if (!hit) {
    throw new QcqlError(
      `Unknown ${what} "${value}". Values are: ${vocabulary.join(", ").toLowerCase()}`,
      tok.at,
      value,
    );
  }
  return hit;
}

/** Parses QCQL source, throwing QcqlError with a source offset on failure. */
export function parseQcql(source: string): Query {
  if (source.trim() === "") throw new QcqlError("Empty query", 0);
  return new Parser(lex(source)).parseQuery();
}
