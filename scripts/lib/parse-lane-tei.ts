/**
 * Converts one Lane's Lexicon TEI `<entryFree>` fragment into a flat token
 * stream.
 *
 * Tokens, not HTML. The entries mix English prose with Arabic spans,
 * cross-references and Lane's own editorial marks, and emitting an HTML
 * string would mean rendering it with dangerouslySetInnerHTML -- injecting
 * markup from a 253 MB third-party database into the page. A token stream
 * renders through ordinary React elements instead, and lets the Arabic
 * spans carry dir/lang properly rather than inheriting the paragraph's
 * direction.
 *
 * The tag vocabulary is bounded and was enumerated from the whole database
 * rather than guessed -- 21 tags over 47,919 entries, of which these carry
 * meaning:
 *
 *   foreign lang="ar"  617,930   an Arabic word or phrase inside English prose
 *   orth    lang="ar"  222,272   a headword / orthographic form
 *   hi      rend=...   715,702   emphasis
 *   sense   n=...      106,960   a numbered sense division
 *   ref     target=... 36,001    a cross-reference to another entry
 *   itype              28,372    inflection type
 *   tropical           23,350    Lane's mark for a tropical (figurative) usage
 *   pb      n=...      3,042     a page break in the printed lexicon
 *
 * Everything else (form, quote, L, cell, row, ptr, anchor, note, G, H,
 * Table, lb) is structural or vanishingly rare, and is unwrapped: its text
 * is kept, its tag dropped. Unwrapping rather than discarding matters --
 * dropping `form` would silently delete headwords.
 */

export type LaneToken =
  /** English prose */
  | { t: "t"; v: string }
  /** Arabic span (foreign / orth / ref target) */
  | { t: "a"; v: string }
  /** emphasised prose */
  | { t: "e"; v: string }
  /** a numbered sense division */
  | { t: "s"; n: string }
  /** Lane's tropical-usage mark */
  | { t: "trop" }
  /** page number in the printed lexicon */
  | { t: "pb"; v: string };

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, body: string) => {
    if (body.startsWith("#x") || body.startsWith("#X")) {
      const code = Number.parseInt(body.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    if (body.startsWith("#")) {
      const code = Number.parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    return ENTITIES[body] ?? whole;
  });
}

function attr(raw: string, name: string): string | null {
  const m = new RegExp(`${name}\\s*=\\s*"([^"]*)"`).exec(raw);
  return m ? decodeEntities(m[1]) : null;
}

/** Collapses runs of whitespace; the source is pretty-printed across lines. */
function squash(s: string): string {
  return s.replace(/\s+/g, " ");
}

const TAG = /<(\/?)([A-Za-z][\w:.-]*)((?:[^>"]|"[^"]*")*)(\/?)>/g;

export function parseLaneEntry(xml: string): LaneToken[] {
  const out: LaneToken[] = [];
  // The stack of language-bearing elements we are inside. `foreign`/`orth`
  // push their language; `hi` can nest within either, so this must be a
  // stack rather than a flag. The INNERMOST entry decides: a non-Arabic
  // `foreign` (e.g. lang="grc") nested anywhere must not be read as Arabic,
  // so depth alone is not the test.
  const langStack: boolean[] = [];
  const inArabic = () => langStack.length > 0 && langStack[langStack.length - 1];
  let emph = 0;

  const pushText = (raw: string) => {
    const v = squash(decodeEntities(raw));
    if (v.trim() === "") {
      // Keep a single separating space, but never emit whitespace-only
      // tokens that would render as stray gaps.
      const last = out[out.length - 1];
      if (v === " " && last && last.t === "t" && !last.v.endsWith(" ")) last.v += " ";
      return;
    }
    if (inArabic()) out.push({ t: "a", v: v.trim() });
    else if (emph > 0) out.push({ t: "e", v });
    else {
      const last = out[out.length - 1];
      if (last && last.t === "t") last.v += v;
      else out.push({ t: "t", v });
    }
  };

  let cursor = 0;
  TAG.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TAG.exec(xml)) !== null) {
    if (m.index > cursor) pushText(xml.slice(cursor, m.index));
    cursor = TAG.lastIndex;

    const [, closing, name, rawAttrs, selfClose] = m;
    const tag = name.toLowerCase();
    const isClose = closing === "/";
    const isSelf = selfClose === "/";

    if (tag === "pb") {
      const n = attr(rawAttrs, "n");
      if (n) out.push({ t: "pb", v: n });
      continue;
    }
    if (tag === "tropical" || tag === "assumedtropical") {
      if (!isClose) out.push({ t: "trop" });
      continue;
    }
    if (tag === "ref") {
      // Self-closing, and its Arabic lives in the `target` attribute rather
      // than in text -- dropping the tag would lose the cross-reference.
      const target = attr(rawAttrs, "target");
      if (!isClose && target) out.push({ t: "a", v: target });
      continue;
    }
    if (tag === "sense") {
      if (!isClose) {
        const n = attr(rawAttrs, "n");
        if (n) out.push({ t: "s", n });
      }
      continue;
    }
    // `ptr` is structural everywhere except the 78 "See <ptr lang=ar>دبو</ptr>"
    // cross-reference stubs, where it carries Arabic as its text. Unwrapping it
    // put that Arabic into the English run, where it would render left-to-right.
    if (tag === "foreign" || tag === "orth" || tag === "ptr") {
      // `foreign`/`orth` are Arabic-by-default in this source, which omits
      // lang on most of them. `ptr` is not: it is structural unless it
      // explicitly says lang="ar", which only the 78 stub entries do.
      const lang = attr(rawAttrs, "lang");
      const isArabic = tag === "ptr" ? lang === "ar" : (lang ?? "ar") === "ar";
      if (isSelf) continue;
      if (isClose) langStack.pop();
      else langStack.push(isArabic);
      continue;
    }
    if (tag === "hi") {
      if (isSelf) continue;
      if (isClose) emph = Math.max(0, emph - 1);
      else emph += 1;
      continue;
    }
    // Everything else: unwrap. Its text is kept by the text handler above.
  }
  if (cursor < xml.length) pushText(xml.slice(cursor));

  return out.filter((tok) => (tok.t === "t" || tok.t === "e" ? tok.v.trim() !== "" : true));
}
