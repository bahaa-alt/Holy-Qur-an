import { describe, expect, it } from "vitest";
import { buildTreebank, parseTreebankTSV, type RawTreebankRow } from "../../scripts/lib/build-treebank";

const HEADER = [
  "tid",
  "FID",
  "sentence_id",
  "sentence_word",
  "token_id",
  "location",
  "chapter_id",
  "verse_id",
  "word_id",
  "tok_id",
  "uthmani_token",
  "rel_label",
  "rel_label_ar",
  "ref_token_id",
].join("\t");

/** A handful of real rows from 1:1-1:2, trimmed to the columns this module reads. */
const FATIHA_ROWS = [
  ["0", "1", "1", "0", "0", "_", "1", "1", "0", "0", "(*)", "root", "root", "0"],
  ["1", "2", "1", "1", "1", "(1:1:1:1)", "1", "1", "1", "1", "بِ", "link", "متعلق", "0"],
  ["2", "3", "1", "1", "2", "(1:1:1:2)", "1", "1", "1", "2", "سْمِ", "gen", "مجرور", "1"],
  ["3", "4", "1", "2", "3", "(1:1:2:1)", "1", "1", "2", "1", "اللَّهِ", "Poss", "مضاف إليه", "2"],
  ["4", "5", "1", "3", "4", "(1:1:3:1)", "1", "1", "3", "1", "ال", "NonRel", "NonRel", "4"],
  ["8", "9", "2", "1", "0", "(1:2:1:1)", "1", "2", "1", "1", "الْ", "NonRel", "NonRel", "0"],
  ["9", "10", "2", "1", "1", "(1:2:1:2)", "1", "2", "1", "2", "حَمْدُ", "root", "root", "1"],
  ["10", "11", "2", "0", "2", "_", "1", "2", "0", "0", "(*)", "Pred", "خبر", "1"],
  ["11", "12", "2", "2", "3", "(1:2:2:1)", "1", "2", "2", "1", "لِ", "link", "متعلق", "2"],
].map((cols) => cols.join("\t"));

const TSV_TEXT = [HEADER, ...FATIHA_ROWS].join("\n");

/** location keys this app's own corpus recognizes -- everything above except the two "_" (elided) rows and 1:1:3:1 (dropped to exercise the orphan path). */
const VALID_LOCATIONS = new Set([
  "1:1:1:1",
  "1:1:1:2",
  "1:1:2:1",
  "1:2:1:1",
  "1:2:1:2",
  "1:2:2:1",
]);

describe("parseTreebankTSV", () => {
  it("reads columns by name and produces one row per data line", () => {
    const rows = parseTreebankTSV(TSV_TEXT);
    expect(rows).toHaveLength(FATIHA_ROWS.length);
    expect(rows[1]).toMatchObject({
      tid: 1,
      sentenceId: "1",
      tokenId: 1,
      location: "(1:1:1:1)",
      relLabel: "link",
      refTokenId: 0,
    });
  });

  it("strips a leading BOM and normalizes CRLF", () => {
    const withBomAndCrlf = "﻿" + TSV_TEXT.replace(/\n/g, "\r\n");
    const rows = parseTreebankTSV(withBomAndCrlf);
    expect(rows).toHaveLength(FATIHA_ROWS.length);
    expect(rows[0].tid).toBe(0);
  });

  it("throws on a missing required column", () => {
    const badHeader = HEADER.replace("rel_label\t", "");
    expect(() => parseTreebankTSV([badHeader, FATIHA_ROWS[0]].join("\n"))).toThrow(/rel_label/);
  });

  it("throws on a row with the wrong number of fields", () => {
    expect(() => parseTreebankTSV([HEADER, "1\t2\t3"].join("\n"))).toThrow(/expected/);
  });
});

describe("buildTreebank", () => {
  const rows = parseTreebankTSV(TSV_TEXT);
  const { meta, files } = buildTreebank(rows, VALID_LOCATIONS);

  it("resolves a head via the sentence-scoped token_id, not the global tid", () => {
    const surah1 = files.get(1)!;
    const semi = surah1.entries.find((e) => e.a === 1 && e.w === 1 && e.g === 2)!; // سْمِ
    expect(semi.head).toBe("1:1:1"); // بِ
    const allah = surah1.entries.find((e) => e.a === 1 && e.w === 2 && e.g === 1)!; // ٱللَّهِ
    expect(allah.head).toBe("1:1:2"); // سْمِ
  });

  it("resolves head: null for a sentence root (ref_token_id 0)", () => {
    const surah1 = files.get(1)!;
    const hamdu = surah1.entries.find((e) => e.a === 2 && e.w === 1 && e.g === 2)!;
    expect(hamdu.rel).toBe("root");
    expect(hamdu.head).toBeNull();
  });

  it("resolves head: null when the head is a self-reference (e.g. a bare prefix)", () => {
    const surah1 = files.get(1)!;
    const alClitic = surah1.entries.find((e) => e.a === 2 && e.w === 1 && e.g === 1)!;
    expect(alClitic.rel).toBe("NonRel");
    expect(alClitic.head).toBeNull();
  });

  it("resolves head: null when the head is an elided/virtual node", () => {
    const surah1 = files.get(1)!;
    const li = surah1.entries.find((e) => e.a === 2 && e.w === 2 && e.g === 1)!; // لِ, ref -> elided Pred
    expect(li.head).toBeNull();
  });

  it("drops a treebank location this app's own corpus doesn't recognize", () => {
    const surah1 = files.get(1)!;
    expect(surah1.entries.some((e) => e.a === 1 && e.w === 3)).toBe(false);
  });

  it("records which ayahs carry an elided/implied element", () => {
    const surah1 = files.get(1)!;
    expect(surah1.elidedAyahs).toEqual([1, 2]);
  });

  it("carries each segment's own Arabic text and Arabic relation label", () => {
    const surah1 = files.get(1)!;
    const bi = surah1.entries.find((e) => e.a === 1 && e.w === 1 && e.g === 1)!;
    expect(bi.t).toBe("بِ");
    expect(bi.relAr).toBe("متعلق");
  });

  it("counts covered vs. total segments in meta", () => {
    expect(meta.totalSegments).toBe(VALID_LOCATIONS.size);
    expect(meta.coveredSegments).toBe(VALID_LOCATIONS.size);
  });

  it("sorts entries in verse/word/segment order", () => {
    const surah1 = files.get(1)!;
    const keys = surah1.entries.map((e) => `${e.a}:${e.w}:${e.g}`);
    expect(keys).toEqual([...keys].sort((x, y) => {
      const [xa, xw, xg] = x.split(":").map(Number);
      const [ya, yw, yg] = y.split(":").map(Number);
      return xa - ya || xw - yw || xg - yg;
    }));
  });
});

describe("buildTreebank: sentence scoping", () => {
  it("never lets a head resolve across a different sentence_id even with a matching token_id", () => {
    // Two different sentences both using token_id=1 for an unrelated word;
    // a naive global "sentenceId-agnostic" lookup would conflate them.
    const rows: RawTreebankRow[] = [
      { tid: 100, sentenceId: "10", tokenId: 0, location: "_", chapterId: 2, verseId: 5, uthmaniToken: "(*)", relLabel: "root", relLabelAr: "root", refTokenId: 0 },
      { tid: 101, sentenceId: "10", tokenId: 1, location: "(2:5:1:1)", chapterId: 2, verseId: 5, uthmaniToken: "أ", relLabel: "root", relLabelAr: "root", refTokenId: 1 },
      { tid: 200, sentenceId: "20", tokenId: 1, location: "(2:6:1:1)", chapterId: 2, verseId: 6, uthmaniToken: "ب", relLabel: "root", relLabelAr: "root", refTokenId: 1 },
      { tid: 201, sentenceId: "20", tokenId: 2, location: "(2:6:2:1)", chapterId: 2, verseId: 6, uthmaniToken: "ج", relLabel: "gen", relLabelAr: "مجرور", refTokenId: 1 },
    ];
    const valid = new Set(["2:5:1:1", "2:6:1:1", "2:6:2:1"]);
    const { files } = buildTreebank(rows, valid);
    const surah2 = files.get(2)!;
    const jeem = surah2.entries.find((e) => e.a === 6 && e.w === 2)!;
    expect(jeem.head).toBe("6:1:1"); // token_id 1 within sentence "20", not sentence "10"
  });
});
