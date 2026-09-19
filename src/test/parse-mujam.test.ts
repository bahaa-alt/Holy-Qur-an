import { describe, expect, it } from "vitest";
import { encodeMujamToken, parseMujamEntry } from "../../scripts/lib/parse-mujam";

const kinds = (body: string) =>
  parseMujamEntry(body)
    .map((t) => t.t)
    .join("");
const values = (body: string) => parseMujamEntry(body).map((t) => ("v" in t ? t.v : "|"));

describe("parseMujamEntry", () => {
  it("reads plain prose as one text token", () => {
    expect(parseMujamEntry("أصل واحد يدل على الرقة")).toEqual([
      { t: "t", v: "أصل واحد يدل على الرقة" },
    ]);
  });

  it("reads a Qur'anic quotation in either bracket the sources use", () => {
    // Maqayis prints {...}, Mufradat prints the ornate ﴿...﴾. Same thing.
    expect(kinds("قال تعالى: {وفاكهة وأبا} أي")).toBe("tqt");
    expect(kinds("قال تعالى: ﴿وأقرب رحما﴾ أي")).toBe("tqt");
    expect(parseMujamEntry("{وفاكهة وأبا}")).toEqual([{ t: "q", v: "وفاكهة وأبا" }]);
  });

  it("separates a verse reference from an editorial insertion", () => {
    // Both are `[...]`, and only one is a citation. A trailing number is
    // what tells them apart -- an insertion never ends in one.
    expect(parseMujamEntry("{وفاكهة وأبا} [عبس: 31]")).toEqual([
      { t: "q", v: "وفاكهة وأبا" },
      { t: "r", v: "عبس: 31" },
    ]);
    expect(parseMujamEntry("وأنشد [قال النابغة] بيتا")).toEqual([
      { t: "t", v: "وأنشد [قال النابغة] بيتا" },
    ]);
  });

  it("keeps an editorial insertion's text, brackets and all", () => {
    expect(values("الرطب [الرطب و] اليابس")).toEqual(["الرطب [الرطب و] اليابس"]);
  });

  it("reads a quoted dictum", () => {
    expect(parseMujamEntry("قال «من وصلك وصلته» انتهى")).toEqual([
      { t: "t", v: "قال" },
      { t: "h", v: "من وصلك وصلته" },
      { t: "t", v: "انتهى" },
    ]);
  });

  it("drops the modern editor's footnotes", () => {
    // [[...]] is the 20th-century editor's apparatus, not the author's
    // text; it is the part of a printed edition with its own claim to
    // protection and the part nobody opened a root page to read.
    expect(parseMujamEntry("الرحمة رقة [[الحديث، عن عبد الرحمن بن عوف]] تقتضي")).toEqual([
      // One token, not two: the note interrupts a sentence, so removing it
      // has to leave the sentence whole.
      { t: "t", v: "الرحمة رقة تقتضي" },
    ]);
  });

  it("drops a footnote containing brackets of its own", () => {
    expect(parseMujamEntry("أول [[انظر {كذا} والباقي]] آخر")).toEqual([{ t: "t", v: "أول آخر" }]);
  });

  it("treats both break characters alike and collapses runs of them", () => {
    expect(kinds("أول|ثان")).toBe("tbt");
    expect(kinds("أول\nثان")).toBe("tbt");
    expect(kinds("أول | \n | ثان")).toBe("tbt");
  });

  it("never opens or closes on a break", () => {
    expect(kinds("|أول|")).toBe("t");
    expect(kinds("\n\nأول\n\n")).toBe("t");
  });

  it("returns nothing for a body that is only apparatus or whitespace", () => {
    expect(parseMujamEntry("")).toEqual([]);
    expect(parseMujamEntry("   \n  |  ")).toEqual([]);
    expect(parseMujamEntry("[[محض حاشية]]")).toEqual([]);
  });

  it("collapses runs of spaces inside a token", () => {
    expect(values("أصل    واحد")).toEqual(["أصل واحد"]);
  });
});

describe("encodeMujamToken", () => {
  it("prefixes each token with its one-character sigil", () => {
    expect(encodeMujamToken({ t: "t", v: "أصل" })).toBe("tأصل");
    expect(encodeMujamToken({ t: "q", v: "وأبا" })).toBe("qوأبا");
    expect(encodeMujamToken({ t: "r", v: "عبس: 31" })).toBe("rعبس: 31");
    expect(encodeMujamToken({ t: "h", v: "من وصلك" })).toBe("hمن وصلك");
  });

  it("encodes a break as the bare sigil, with nothing after it", () => {
    expect(encodeMujamToken({ t: "b" })).toBe("b");
  });

  it("round-trips through the decode the renderer does", () => {
    // MujamEntry splits on tok[0] / tok.slice(1); this is that contract.
    for (const tok of parseMujamEntry("قال تعالى {وأبا} [عبس: 31]|ثم قال «كذا»")) {
      const enc = encodeMujamToken(tok);
      expect(enc[0]).toBe(tok.t);
      if ("v" in tok) expect(enc.slice(1)).toBe(tok.v);
      else expect(enc).toHaveLength(1);
    }
  });
});
