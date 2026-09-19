import { describe, expect, it } from "vitest";
import { parseLaneEntry } from "../../scripts/lib/parse-lane-tei";

const ar = (toks: ReturnType<typeof parseLaneEntry>) =>
  toks.filter((t) => t.t === "a").map((t) => (t as { v: string }).v);
const text = (toks: ReturnType<typeof parseLaneEntry>) =>
  toks
    .filter((t) => t.t === "t" || t.t === "e")
    .map((t) => (t as { v: string }).v)
    .join("");

describe("parseLaneEntry", () => {
  it("separates Arabic spans from English prose", () => {
    const toks = parseLaneEntry(
      'He wrote it, inf. n. <foreign lang="ar">كِتَابٌ</foreign> and more.',
    );
    expect(ar(toks)).toEqual(["كِتَابٌ"]);
    expect(text(toks)).toContain("He wrote it");
    expect(text(toks)).not.toContain("كِتَابٌ");
  });

  it("treats orth as Arabic too, so headwords are not lost to the prose run", () => {
    const toks = parseLaneEntry('<form><orth lang="ar">كَتَبَهُ</orth></form>, aor.');
    expect(ar(toks)).toEqual(["كَتَبَهُ"]);
  });

  it("keeps a cross-reference's target, which lives in an attribute not in text", () => {
    // <ref/> is self-closing; dropping the tag would lose the reference entirely.
    const toks = parseLaneEntry('see <ref cref="n1" target="كتّبهُ" n="1" type="1"/> below');
    expect(ar(toks)).toEqual(["كتّبهُ"]);
  });

  it("emits numbered sense divisions", () => {
    const toks = parseLaneEntry('<sense n="2" type="main">He wrote.</sense>');
    expect(toks[0]).toEqual({ t: "s", n: "2" });
  });

  it("emits page breaks from the printed lexicon", () => {
    const toks = parseLaneEntry('below <pb n="2590"/> the line');
    expect(toks.some((t) => t.t === "pb" && t.v === "2590")).toBe(true);
  });

  it("marks Lane's tropical-usage notation once per mark, not on the closing tag", () => {
    const toks = parseLaneEntry("<tropical/>fig. sense<assumedtropical></assumedtropical>");
    expect(toks.filter((t) => t.t === "trop")).toHaveLength(2);
  });

  it("unwraps structural tags rather than discarding their text", () => {
    // Dropping `form` wholesale would silently delete headwords.
    const toks = parseLaneEntry("<form><itype>1</itype> plain</form>");
    expect(text(toks)).toContain("1");
    expect(text(toks)).toContain("plain");
  });

  it("handles Arabic nested inside emphasis inside foreign", () => {
    const toks = parseLaneEntry('<foreign lang="ar"><hi rend="ital">كتب</hi></foreign>');
    expect(ar(toks)).toEqual(["كتب"]);
  });

  it("does not treat a non-Arabic foreign span as Arabic", () => {
    const toks = parseLaneEntry('<foreign lang="grc">λόγος</foreign> here');
    expect(ar(toks)).toEqual([]);
    expect(text(toks)).toContain("λόγος");
  });

  it("decodes entities, including numeric ones", () => {
    const toks = parseLaneEntry("A &amp; B &lt;x&gt; &#65; &#x42;");
    expect(text(toks)).toContain("A & B <x> A B");
  });

  it("collapses the source's pretty-printed whitespace", () => {
    const toks = parseLaneEntry("one\n     \n   two");
    expect(text(toks)).toBe("one two");
  });

  it("emits no whitespace-only tokens", () => {
    for (const tok of parseLaneEntry('  <foreign lang="ar">كتب</foreign>   \n  ')) {
      if (tok.t === "t" || tok.t === "e") expect(tok.v.trim()).not.toBe("");
    }
  });

  it("merges adjacent prose rather than fragmenting it per tag", () => {
    const toks = parseLaneEntry('He <hi rend="ital">wrote</hi> it down');
    expect(text(toks)).toBe("He wrote it down");
  });

  it("survives an unclosed tag without throwing or losing the rest", () => {
    const toks = parseLaneEntry('<foreign lang="ar">كتب</foreign> tail <hi rend="ital">end');
    expect(ar(toks)).toEqual(["كتب"]);
    expect(text(toks)).toContain("tail");
    expect(text(toks)).toContain("end");
  });

  it("handles an attribute value containing a > character", () => {
    const toks = parseLaneEntry('<ref target="أ>ب" cref="n1"/>x');
    expect(ar(toks)).toEqual(["أ>ب"]);
    expect(text(toks)).toContain("x");
  });

  it("returns an empty stream for empty input", () => {
    expect(parseLaneEntry("")).toEqual([]);
  });
});

describe("parseLaneEntry — ptr cross-reference stubs", () => {
  it("treats a lang=ar pointer's text as Arabic, not as English prose", () => {
    // 78 entries are bare "See <ptr lang=ar>دبو</ptr>" stubs. Unwrapping ptr
    // put that Arabic into the English run, where it renders left-to-right.
    const toks = parseLaneEntry(
      '<entryFree id="j1" key="دبى"> See <ptr lang="ar" pointing="dbw" id="j1">دبو</ptr></entryFree>',
    );
    expect(toks.filter((t) => t.t === "a").map((t) => (t as { v: string }).v)).toEqual(["دبو"]);
  });

  it("still unwraps a pointer carrying no language", () => {
    const toks = parseLaneEntry("see <ptr>x</ptr> here");
    expect(toks.filter((t) => t.t === "a")).toHaveLength(0);
  });
});
