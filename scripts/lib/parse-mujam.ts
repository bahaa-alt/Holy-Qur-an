/**
 * Turns one classical Arabic dictionary article into a token stream.
 *
 * The three works this handles (Maqāyīs, Mufradāt, al-Ṣiḥāḥ) are plain
 * vocalised Arabic prose carrying four inline conventions, which differ per
 * work only in which bracket the source uses:
 *
 *   {...}  ﴿...﴾   a Qur'anic quotation
 *   [al-Baqara: 2]  the reference that follows one
 *   «...»           a quoted ḥadīth or dictum
 *   |  and newline  a sense or paragraph break
 *   [[...]]         the modern editor's footnote
 *
 * Counted across the three works: Maqāyīs uses `{}` (593) with 579 refs,
 * Mufradāt uses `﴿﴾` (8,278) with 8,523 refs, and only Mufradāt carries
 * footnotes (2,857). Nothing here is HTML or XML -- unlike Lane's TEI, the
 * source is already prose -- so the tokens exist to let the UI mark a
 * Qur'anic quotation as a quotation rather than to reconstruct structure.
 *
 * `[[...]]` footnotes are DROPPED. They are the 20th-century editor's
 * apparatus (ḥadīth sourcing, variant readings), not the author's text: the
 * part of a printed edition that carries its own claim to protection, and
 * the part a reader of a root page did not ask for. Everything kept here is
 * the classical author's own words.
 */
export type MujamToken =
  | { t: "t"; v: string }
  /** a Qur'anic quotation, rendered in the Qur'anic type */
  | { t: "q"; v: string }
  /** the sūra:āya reference printed after a quotation */
  | { t: "r"; v: string }
  /** a quoted ḥadīth or dictum */
  | { t: "h"; v: string }
  /** a sense or paragraph break */
  | { t: "b" };

/** Editorial footnote: `[[ ... ]]`, possibly nested one level. */
const FOOTNOTE = /\[\[[^[\]]*(?:\[[^\]]*\][^[\]]*)*\]\]/g;

/**
 * One inline span. Ordered so the two quotation brackets are tried before
 * the reference, because a reference is only meaningful after a quotation
 * and the two are adjacent in the source.
 */
const SPAN = /([{﴿])([^}﴾]*)([}﴾])|«([^»]*)»|\[([^\]]*)\]/g;

/**
 * Whether a `[...]` is a verse reference rather than an editorial insertion.
 *
 * Both shapes occur -- `[عبس: 31]` alongside `[قَالَ النَّابِغَةُ]` -- and
 * only the first is a citation. Requiring a trailing number is what
 * separates them; an insertion never ends in one.
 */
function isVerseRef(inner: string): boolean {
  return /:\s*\d+\s*$/.test(inner.trim());
}

const WS = /[ \t\u00A0]+/g;

/**
 * A sense break: `|` or a newline, with any whitespace around it, repeated.
 *
 * The repetition matters. These sources write `| \n |` where one break is
 * meant, and matching a single separator at a time would emit one break
 * token per character and render the article as a column of dots.
 */
const BREAK = /(?:\s*[|\n]\s*)+/;

/** Parses one article body into tokens, in source order. */
export function parseMujamEntry(body: string): MujamToken[] {
  const cleaned = body.replace(FOOTNOTE, " ");
  const out: MujamToken[] = [];

  // Prose accumulates in a buffer rather than being pushed per fragment, so
  // that text either side of a dropped footnote or an editorial insertion
  // comes out as ONE token. Those interruptions sit mid-sentence; splitting
  // there would both fragment the sentence and cost a token per aside.
  let buf = "";

  const flush = () => {
    const text = buf.replace(WS, " ").trim();
    if (text) out.push({ t: "t", v: text });
    buf = "";
  };

  const addText = (raw: string) => {
    raw.split(BREAK).forEach((part, i) => {
      if (i > 0) {
        flush();
        if (out.length && out[out.length - 1].t !== "b") out.push({ t: "b" });
      }
      buf += part;
    });
  };

  let last = 0;
  for (const m of cleaned.matchAll(SPAN)) {
    addText(cleaned.slice(last, m.index));
    last = m.index + m[0].length;

    if (m[2] !== undefined) {
      const v = m[2].replace(WS, " ").trim();
      if (v) {
        flush();
        out.push({ t: "q", v });
      }
    } else if (m[4] !== undefined) {
      const v = m[4].replace(WS, " ").trim();
      if (v) {
        flush();
        out.push({ t: "h", v });
      }
    } else if (m[5] !== undefined) {
      const inner = m[5].replace(WS, " ").trim();
      if (!inner) continue;
      if (isVerseRef(inner)) {
        flush();
        out.push({ t: "r", v: inner });
      } else {
        // An editorial insertion stays prose, brackets and all: it is part
        // of the printed text, not a citation the UI should set apart.
        addText(` [${inner}] `);
      }
    }
  }

  addText(cleaned.slice(last));
  flush();

  // A break carries nothing at either end of an article.
  while (out.length && out[0].t === "b") out.shift();
  while (out.length && out[out.length - 1].t === "b") out.pop();
  return out;
}

/**
 * Encodes a token as a single sigil-prefixed string.
 *
 * Same trade-off as LaneRootFile's tokens, for the same reason: `{t,v}`
 * objects cost roughly half again as many bytes across a corpus this size,
 * and the sigil is one character.
 */
export function encodeMujamToken(tok: MujamToken): string {
  return tok.t === "b" ? "b" : `${tok.t}${tok.v}`;
}
