import { describe, expect, it } from "vitest";
import { csvEscape, toCSV, toJSON, toMarkdown, toPlainText } from "@/lib/export/formatters";
import type { OccurrenceRow } from "@/lib/data/types";

const ROW_255: OccurrenceRow = {
  surah: 2,
  ayah: 255,
  surahNameAr: "البقرة",
  surahNameEn: "Al-Baqarah",
  wordIndex: 5,
  form: "يَعْلَمُ",
  lemma: "عَلِمَ",
  root: "علم",
  category: "verb.impf",
  tags: "IMPF|3MS|MOOD:IND",
  verseUthmani: 'ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ, "the Ever-Living"',
  translation: 'Allah - there is no deity except Him, the "Ever-Living"',
};

const ROW_SIMPLE: OccurrenceRow = {
  surah: 96,
  ayah: 4,
  surahNameAr: "العلق",
  surahNameEn: "Al-'Alaq",
  wordIndex: 2,
  form: "عَلَّمَ",
  lemma: "عَلَّمَ",
  root: "علم",
  category: "verb.perf",
  tags: "PERF|3MS|VF:2",
  verseUthmani: "ٱلَّذِى عَلَّمَ بِٱلْقَلَمِ",
  translation: "Who taught by the pen",
};

describe("csvEscape", () => {
  it("leaves plain values untouched", () => {
    expect(csvEscape("plain")).toBe("plain");
    expect(csvEscape(255)).toBe("255");
  });

  it("quotes and doubles internal quotes when the value contains a comma or quote", () => {
    expect(csvEscape('has, a comma')).toBe('"has, a comma"');
    expect(csvEscape('has "quotes"')).toBe('"has ""quotes"""');
  });

  it("quotes values containing newlines", () => {
    expect(csvEscape("line1\nline2")).toBe('"line1\nline2"');
  });
});

describe("toCSV", () => {
  it("emits a header row plus one row per occurrence, comma-separated", () => {
    const csv = toCSV([ROW_SIMPLE]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe(
      "surah,ayah,surah_name_en,surah_name_ar,word_index,form,lemma,root,category,tags,verse_uthmani,translation",
    );
    expect(lines[1]).toContain("96,4,Al-'Alaq,العلق,2,عَلَّمَ,عَلَّمَ,علم,Verb (perfect)");
  });

  it("properly escapes fields containing commas and quotes", () => {
    const csv = toCSV([ROW_255]);
    const dataLine = csv.split("\r\n")[1];
    // the verse field contains a comma and quotes, so it must be quoted with doubled internal quotes
    expect(dataLine).toContain('"ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ, ""the Ever-Living"""');
  });

  it("round-trips: every line has the same number of top-level commas outside quotes as the header", () => {
    const csv = toCSV([ROW_255, ROW_SIMPLE]);
    const lines = csv.split("\r\n").filter(Boolean);
    for (const line of lines) {
      // crude CSV field counter respecting quotes
      let fields = 0;
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') inQuotes = !inQuotes;
        else if (c === "," && !inQuotes) fields++;
      }
      expect(fields).toBe(11); // 12 columns => 11 commas
    }
  });
});

describe("toJSON", () => {
  it("round-trips the rows through JSON", () => {
    const json = toJSON([ROW_SIMPLE, ROW_255]);
    const parsed = JSON.parse(json);
    expect(parsed).toEqual([ROW_SIMPLE, ROW_255]);
  });
});

describe("toMarkdown", () => {
  it("includes a heading with the surah reference and names", () => {
    const md = toMarkdown([ROW_SIMPLE]);
    expect(md).toContain("### 96:4 — العلق (Al-'Alaq)");
    expect(md).toContain("> " + ROW_SIMPLE.verseUthmani);
    expect(md).toContain("> " + ROW_SIMPLE.translation);
  });

  it("joins multiple rows with a separator", () => {
    const md = toMarkdown([ROW_SIMPLE, ROW_255]);
    expect(md).toContain("\n\n---\n\n");
  });
});

describe("toPlainText", () => {
  it("includes the reference, verse, and translation", () => {
    const txt = toPlainText([ROW_SIMPLE]);
    expect(txt).toContain("96:4");
    expect(txt).toContain(ROW_SIMPLE.verseUthmani);
    expect(txt).toContain(ROW_SIMPLE.translation);
  });
});
