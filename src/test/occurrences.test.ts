import { describe, expect, it } from "vitest";
import { parseMorphologyTSV } from "../../scripts/lib/parse-morphology";
import { buildRoots } from "../../scripts/lib/build-roots";
import { buildOccurrenceRows, buildVerseWordIndex, filterRows } from "@/lib/root/occurrences";

const KATABA_ROWS = [
  "2:2:2:1\tٱلْ\tP\tDET|PREF|LEM:ال",
  "2:2:2:2\tكِتَٰبُ\tN\tROOT:كتب|LEM:كِتاب|M|NOM",
  "2:44:8:2\tكِتَٰبَ\tN\tROOT:كتب|LEM:كِتاب|M|ACC",
  "2:79:3:1\tيَكْتُبُ\tV\tIMPF|VF:1|ROOT:كتب|LEM:كَتَبَ|3MP|MOOD:IND",
  "2:79:3:2\tونَ\tN\tPRON|SUFF|3MP",
].join("\n");

function katabaFile() {
  const words = parseMorphologyTSV(KATABA_ROWS);
  return buildRoots(words, {}).rootFiles.get("كتب")!;
}

describe("buildOccurrenceRows", () => {
  const rows = buildOccurrenceRows(katabaFile());

  it("produces one row per occurrence, in Quran order", () => {
    expect(rows.map((r) => `${r.s}:${r.a}`)).toEqual(["2:2", "2:44", "2:79"]);
  });

  it("resolves the form, lemma, and category for each row", () => {
    const kitabRow = rows.find((r) => r.a === 2)!;
    expect(kitabRow.form).toBe("كِتَٰبُ");
    expect(kitabRow.lemma).toBe("كِتاب");
    expect(kitabRow.cat).toBe("noun");

    const verbRow = rows.find((r) => r.a === 79)!;
    expect(verbRow.lemma).toBe("كَتَبَ");
    expect(verbRow.cat).toBe("verb.impf");
    expect(verbRow.tagsJoined).toBe("IMPF|VF:1|3MP|MOOD:IND");
  });
});

describe("buildVerseWordIndex", () => {
  it("maps each verse to the sorted word indices where the root occurs", () => {
    const idx = buildVerseWordIndex(katabaFile());
    expect(idx.get("2:2")).toEqual([2]);
    expect(idx.get("2:79")).toEqual([3]);
    expect(idx.get("2:100")).toBeUndefined();
  });
});

describe("filterRows", () => {
  const rows = buildOccurrenceRows(katabaFile());

  it("filters by category", () => {
    expect(filterRows(rows, { cat: "noun" })).toHaveLength(2);
    expect(filterRows(rows, { cat: "verb.impf" })).toHaveLength(1);
  });

  it("filters by lemma key", () => {
    expect(filterRows(rows, { lemmaKey: "كتاب" })).toHaveLength(2);
  });

  it("filters by surah", () => {
    expect(filterRows(rows, { surah: 2 })).toHaveLength(3);
    expect(filterRows(rows, { surah: 3 })).toHaveLength(0);
  });

  it("combines multiple filters (AND)", () => {
    expect(filterRows(rows, { cat: "noun", surah: 2 })).toHaveLength(2);
  });

  it("returns all rows when no filters are given", () => {
    expect(filterRows(rows, {})).toHaveLength(rows.length);
  });
});
