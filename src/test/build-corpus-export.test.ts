import { describe, expect, it } from "vitest";
import { parseMorphologyTSV } from "../../scripts/lib/parse-morphology";
import { buildCorpusExportCsv } from "../../scripts/lib/build-corpus-export";
import type { MetaFile, SurahFile } from "@/lib/data/types";

// Two verses: 1:1 has a rooted word plus a rootless particle-only word
// (no ROOT:/LEM: at all); 1:2 has a word whose translation contains a
// comma and a quote, to exercise CSV escaping. Real feature tags matter
// only insofar as `classify` needs a POS + tag list.
const ROWS = [
  "1:1:1:1\tبِ\tP\t", // rootless, no lemma either -- pure particle
  "1:1:2:1\tكِتَٰبُ\tN\tROOT:كتب|LEM:كِتاب|M|NOM",
  '1:2:1:1\tقَالَ\tV\tPERF|VF:1|ROOT:قول|LEM:قَالَ|3MS',
].join("\n");

const META: MetaFile = {
  surahs: [{ n: 1, nameAr: "الفاتحة", nameEn: "The Opening", translit: "Al-Fatihah", type: "meccan", ayahs: 2 }],
};

const SURAH_FILES = new Map<number, SurahFile>([
  [
    1,
    {
      n: 1,
      verses: [
        { a: 1, w: ["بِ", "كِتَٰبُ"], t: "By the book." },
        { a: 2, w: ["قَالَ"], t: 'He said, "peace," and left.', pickthall: "He said: peace, and left" },
      ],
    },
  ],
]);

describe("buildCorpusExportCsv", () => {
  const words = parseMorphologyTSV(ROWS);
  const csv = buildCorpusExportCsv(words, SURAH_FILES, META);
  const rows = csv.trim().split("\r\n");

  it("emits a header row followed by one row per word", () => {
    expect(rows[0]).toBe(
      "surah,ayah,surah_name_en,surah_name_ar,revelation_type,word_index,word,root,lemma,category,tags,translation_saheeh,translation_pickthall",
    );
    expect(rows).toHaveLength(1 + words.length);
  });

  it("leaves root/lemma/category/tags blank for a rootless word", () => {
    expect(rows[1]).toBe("1,1,The Opening,الفاتحة,meccan,1,بِ,,,,,By the book.,");
  });

  it("fills root/lemma/category/tags from the word's rooted segment", () => {
    expect(rows[2]).toBe("1,1,The Opening,الفاتحة,meccan,2,كِتَٰبُ,كتب,كِتاب,noun,M|NOM,By the book.,");
  });

  it("escapes a translation containing a comma and a quote per RFC 4180, and carries Pickthall's text", () => {
    expect(rows[3]).toBe(
      '1,2,The Opening,الفاتحة,meccan,1,قَالَ,قول,قَالَ,verb.perf,PERF|VF:1|3MS,"He said, ""peace,"" and left.","He said: peace, and left"',
    );
  });
});
