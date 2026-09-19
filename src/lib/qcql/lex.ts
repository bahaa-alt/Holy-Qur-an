import { QcqlError } from "./types";

/**
 * Token kinds. `word` covers identifiers, Arabic, and numbers alike --
 * deciding what a bare run of characters means is the parser's job, because
 * the same shape is a tag in one position (`PASS`) and a value in another
 * (`cat=noun`).
 */
export type TokenKind =
  | "["
  | "]"
  | "("
  | ")"
  | "&"
  | "|"
  | "!"
  | "="
  | "!="
  | "<"
  | "<="
  | ">"
  | ">="
  | "::"
  | "word"
  | "eof";

export interface Token {
  kind: TokenKind;
  /** the exact source text, for error messages and for `word` values */
  text: string;
  /** 0-based offset of the token's first character */
  at: number;
}

/**
 * Characters that can appear inside a bare word.
 *
 * Arabic (؀-ۿ) is in, because roots and lemmas are the values
 * this language exists to ask about and quoting them would be friction on
 * the common case. `.` is in for `cat=verb.perf`, `_` and `-` for tag names
 * that might gain them, digits for `vf=4` and `chrono > 5`.
 */
const WORD_CHAR = /[A-Za-z0-9_.\-؀-ۿݐ-ݿ]/;

const PUNCT: readonly (readonly [string, TokenKind])[] = [
  ["::", "::"],
  ["!=", "!="],
  ["<=", "<="],
  [">=", ">="],
  ["[", "["],
  ["]", "]"],
  ["(", "("],
  [")", ")"],
  ["&", "&"],
  ["|", "|"],
  ["!", "!"],
  ["=", "="],
  ["<", "<"],
  [">", ">"],
];

/**
 * Splits QCQL source into tokens.
 *
 * Two-character operators are listed before their one-character prefixes in
 * PUNCT and matched in order, so `!=` never lexes as `!` followed by `=`
 * and `::` never as two unknown colons.
 */
export function lex(source: string): Token[] {
  const out: Token[] = [];
  let i = 0;

  while (i < source.length) {
    const ch = source[i];

    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }

    const punct = PUNCT.find((p) => source.startsWith(p[0], i));
    if (punct) {
      out.push({ kind: punct[1], text: punct[0], at: i });
      i += punct[0].length;
      continue;
    }

    if (WORD_CHAR.test(ch)) {
      const start = i;
      while (i < source.length && WORD_CHAR.test(source[i])) i += 1;
      out.push({ kind: "word", text: source.slice(start, i), at: start });
      continue;
    }

    // A lone `:` is the most likely typo for `::`, so say so rather than
    // reporting an anonymous bad character.
    const hint = ch === ":" ? ' (did you mean "::"?)' : "";
    throw new QcqlError(`Unexpected character "${ch}"${hint}`, i, ch);
  }

  out.push({ kind: "eof", text: "", at: source.length });
  return out;
}
