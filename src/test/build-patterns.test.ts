import { describe, expect, it } from "vitest";
import { parseMorphologyTSV } from "../../scripts/lib/parse-morphology";
import { buildPatterns } from "../../scripts/lib/build-patterns";

// One occurrence per row, each a distinct (surah, ayah) so every row is its
// own RawWord. Deliberately covers all seven root shapes (see
// src/lib/morphology/rootShape.ts), two verb Forms (one untagged -> Form I
// by convention, one explicit VF:4), and three derivational categories.
const ROWS = [
  // Form I (untagged), sound root
  "1:1:1:1\tسَمِعَ\tV\tPERF|ROOT:سمع|LEM:سَمِعَ|3MS",
  // Form IV, same root (سمع) -- tests rootCount doesn't double-count a root
  // attested in more than one Form under the *category* aggregation, while
  // still counting it once per Form under the *verb Form* aggregation.
  "1:2:1:1\tأَسْمَعَ\tV\tPERF|VF:4|ROOT:سمع|LEM:أَسْمَعَ|3MS",
  // Form IV, hamzated root
  "1:3:1:1\tآمَنَ\tV\tPERF|VF:4|ROOT:أمن|LEM:آمَنَ|3MS",
  // noun, sound root
  "1:4:1:1\tكِتَٰبُ\tN\tROOT:كتب|LEM:كِتاب|M|NOM",
  // active participle, hollow root
  "1:5:1:1\tقَائِل\tN\tACT_PCPL|ROOT:قول|LEM:قَائِل|MS|NOM",
  // Form I (untagged), defective root
  "1:6:1:1\tرَمَى\tV\tPERF|ROOT:رمي|LEM:رَمَى|3MS",
  // Form I (untagged), assimilated root
  "1:7:1:1\tوَعَدَ\tV\tPERF|ROOT:وعد|LEM:وَعَدَ|3MS",
  // Form I (untagged), geminate root
  "1:8:1:1\tمَدَّ\tV\tPERF|ROOT:مدد|LEM:مَدَّ|3MS",
  // Form I (untagged), quadriliteral root
  "1:9:1:1\tزُلْزِلَتْ\tV\tPERF|ROOT:زلزل|LEM:زَلْزَلَ|3FS",
].join("\n");

describe("buildPatterns", () => {
  const result = buildPatterns(parseMorphologyTSV(ROWS));

  it("tallies each attested verb Form's occurrence/root/lemma counts, ordered by Form number", () => {
    expect(result.verbForms).toEqual([
      { form: 1, count: 5, rootCount: 5, lemmaCount: 5 }, // سمع,رمي,وعد,مدد,زلزل
      { form: 4, count: 2, rootCount: 2, lemmaCount: 2 }, // سمع,أمن
    ]);
  });

  it("tallies each attested category's occurrence/root counts, ordered per CATEGORY_ORDER", () => {
    expect(result.categories).toEqual([
      { cat: "verb.perf", count: 7, rootCount: 6 }, // سمع(x2),أمن,رمي,وعد,مدد,زلزل
      { cat: "actPcpl", count: 1, rootCount: 1 }, // قول
      { cat: "noun", count: 1, rootCount: 1 }, // كتب
    ]);
  });

  it("classifies all seven root shapes and tallies their occurrence/root counts, ordered per ROOT_SHAPE_ORDER", () => {
    expect(result.rootShapes).toEqual([
      { shape: "sound", count: 3, rootCount: 2 }, // سمع(x2),كتب
      { shape: "hollow", count: 1, rootCount: 1 }, // قول
      { shape: "defective", count: 1, rootCount: 1 }, // رمي
      { shape: "assimilated", count: 1, rootCount: 1 }, // وعد
      { shape: "geminate", count: 1, rootCount: 1 }, // مدد
      { shape: "hamzated", count: 1, rootCount: 1 }, // أمن
      { shape: "quadriliteral", count: 1, rootCount: 1 }, // زلزل
    ]);
  });
});
