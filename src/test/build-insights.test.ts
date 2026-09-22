import { describe, expect, it } from "vitest";
import { parseMorphologyTSV, type RawWord } from "../../scripts/lib/parse-morphology";
import { buildRoots, type RootsGlossMap } from "../../scripts/lib/build-roots";
import { buildInsights } from "../../scripts/lib/build-insights";
import type { SurahFile } from "../lib/data/types";

// Same fixture as build-roots.test.ts, reused so the two test files reason
// about the same known corpus.
const AYAH_1_1 = [
  "1:1:1:1\tبِ\tP\tP|PREF|LEM:ب",
  "1:1:1:2\tسْمِ\tN\tROOT:سمو|LEM:اسْم|M|GEN",
  "1:1:2:1\tٱللَّهِ\tN\tPN|ROOT:أله|LEM:اللَّه|GEN",
  "1:1:3:1\tٱل\tP\tDET|PREF|LEM:ال",
  "1:1:3:2\tرَّحْمَٰنِ\tN\tROOT:رحم|LEM:رَحْمٰن|MS|GEN|ADJ",
  "1:1:4:1\tٱل\tP\tDET|PREF|LEM:ال",
  "1:1:4:2\tرَّحِيمِ\tN\tROOT:رحم|LEM:رَحِيم|MS|GEN|ADJ",
].join("\n");

const KATABA_ROWS = [
  "2:2:2:1\tٱلْ\tP\tDET|PREF|LEM:ال",
  "2:2:2:2\tكِتَٰبُ\tN\tROOT:كتب|LEM:كِتاب|M|NOM",
  "2:79:3:1\tيَكْتُبُ\tV\tIMPF|VF:1|ROOT:كتب|LEM:كَتَبَ|3MP|MOOD:IND",
  "2:79:3:2\tونَ\tN\tPRON|SUFF|3MP",
].join("\n");

const DOUBLE_ROOT_WORD = [
  "20:94:2:1\tيَ\tP\tVOC|PREF|LEM:ي",
  "20:94:2:2\tبْنَ\tN\tROOT:بني|LEM:ابْن|M|ACC",
  "20:94:2:3\tؤُمَّ\tN\tROOT:أمم|LEM:أُمّ|FS|GEN",
  "20:94:2:4\t\tN\tPRON|SUFF|1S",
].join("\n");

// Two 10-word verses (the density metric's minimum length), used only to
// exercise mostRootDenseVerse's ranking -- density (distinct roots ÷ word
// count), not raw count. Uses fresh roots (each a hapax, one lemma/form
// apiece) rather than reusing كتب/رحم/etc., so every *other* assertion in
// this file -- coverage rankings, hapax counts, most-derived-root -- stays
// unaffected by these two verses existing.
const LOW_DENSITY_VERSE = [
  "5:1:1:1\tش1\tN\tROOT:شكر|LEM:شكرلفظ|M|NOM",
  "5:1:2:1\tص1\tN\tROOT:صبر|LEM:صبرلفظ|M|NOM",
  "5:1:3:1\tف1\tP\tP|PREF|LEM:فد1",
  "5:1:4:1\tف2\tP\tP|PREF|LEM:فد2",
  "5:1:5:1\tف3\tP\tP|PREF|LEM:فد3",
  "5:1:6:1\tف4\tP\tP|PREF|LEM:فد4",
  "5:1:7:1\tف5\tP\tP|PREF|LEM:فد5",
  "5:1:8:1\tف6\tP\tP|PREF|LEM:فد6",
  "5:1:9:1\tف7\tP\tP|PREF|LEM:فد7",
  "5:1:10:1\tف8\tP\tP|PREF|LEM:فد8",
].join("\n"); // 10 words, 2 distinct roots (شكر, صبر) -> density 0.2

const HIGH_DENSITY_VERSE = [
  "6:1:1:1\tف1\tN\tROOT:فرح|LEM:فرحلفظ|M|NOM",
  "6:1:2:1\tح1\tN\tROOT:حزن|LEM:حزنلفظ|M|NOM",
  "6:1:3:1\tخ1\tN\tROOT:خوف|LEM:خوفلفظ|M|NOM",
  "6:1:4:1\tس1\tN\tROOT:سلم|LEM:سلملفظ|M|NOM",
  "6:1:5:1\tف2\tP\tP|PREF|LEM:فه1",
  "6:1:6:1\tف3\tP\tP|PREF|LEM:فه2",
  "6:1:7:1\tف4\tP\tP|PREF|LEM:فه3",
  "6:1:8:1\tف5\tP\tP|PREF|LEM:فه4",
  "6:1:9:1\tف6\tP\tP|PREF|LEM:فه5",
  "6:1:10:1\tف7\tP\tP|PREF|LEM:فه6",
].join("\n"); // 10 words, 4 distinct roots (فرح, حزن, خوف, سلم) -> density 0.4

function words() {
  return [
    ...parseMorphologyTSV(AYAH_1_1),
    ...parseMorphologyTSV(KATABA_ROWS),
    ...parseMorphologyTSV(DOUBLE_ROOT_WORD),
    ...parseMorphologyTSV(LOW_DENSITY_VERSE),
    ...parseMorphologyTSV(HIGH_DENSITY_VERSE),
  ];
}

const GLOSS: RootsGlossMap = { رحم: { b: "rHm", m: "Mercy, compassion." } };

// A minimal stand-in for buildSurahs()'s output: canonical per-word text,
// keyed the same way (s, a, w). Built straight from the same fixture words
// (unlike the real pipeline, nothing here diverges from morphology's own
// text), so every assertion below still reads the text it always has.
function surahFilesFrom(fixtureWords: readonly RawWord[]): Map<number, SurahFile> {
  const bySurah = new Map<number, Map<number, string[]>>();
  for (const word of fixtureWords) {
    let byAyah = bySurah.get(word.s);
    if (!byAyah) {
      byAyah = new Map();
      bySurah.set(word.s, byAyah);
    }
    let tokens = byAyah.get(word.a);
    if (!tokens) {
      tokens = [];
      byAyah.set(word.a, tokens);
    }
    tokens[word.w - 1] = word.text;
  }
  const surahFiles = new Map<number, SurahFile>();
  for (const [s, byAyah] of bySurah) {
    const verses = [...byAyah.entries()]
      .sort(([a], [b]) => a - b)
      .map(([a, w]) => ({ a, w, t: "" }));
    surahFiles.set(s, { n: s, verses });
  }
  return surahFiles;
}

describe("buildInsights", () => {
  const built = buildRoots(words(), GLOSS);
  const insights = buildInsights(
    words(),
    built.rootFiles,
    built.lemmaFiles,
    built.indexRoots,
    built.indexLemmas,
    114,
    surahFilesFrom(words()),
  );

  it("carries totalSurahs through unchanged", () => {
    expect(insights.totalSurahs).toBe(114);
  });

  it("ranks roots by distinct-surah coverage, then occurrence count, then alphabetically", () => {
    // رحم and كتب each have 2 occurrences (highest in this fixture); every
    // root here only spans 1 surah, so count is the deciding factor.
    expect(insights.rootsBySurahCoverage[0]).toMatchObject({ ar: "رحم", surahCount: 1, count: 2 });
    expect(insights.rootsBySurahCoverage[1]).toMatchObject({ ar: "كتب", surahCount: 1, count: 2 });
    expect(insights.rootsBySurahCoverage).toHaveLength(12); // every root in this fixture
  });

  it("ranks lemmas (rooted + rootless) by distinct-surah coverage", () => {
    // "ال" (rootless DET) appears before رحمن/رحيم (surah 1) and كتاب (surah 2) -- 2 distinct surahs, 3 occurrences.
    expect(insights.lemmasBySurahCoverage[0]).toMatchObject({ lemma: "ال", rootAr: null, surahCount: 2, count: 3 });
  });

  it("finds the longest and shortest verse by word count", () => {
    // 5:1 and 6:1 (the density-metric fixture verses) both have 10 words --
    // the most in this fixture; the first one encountered (Qur'an order) wins the tie.
    expect(insights.longestVerse).toEqual({ s: 5, a: 1, wordCount: 10 });
    // 2:2, 2:79 and 20:94 are each defined with only 1 word in this fixture; the
    // first one encountered (Qur'an order) wins the tie.
    expect(insights.shortestVerse).toEqual({ s: 2, a: 2, wordCount: 1 });
  });

  it("finds the longest word by letter count, diacritics stripped", () => {
    // ٱلرَّحْمَٰنِ and ٱلرَّحِيمِ both have 6 letters (ٱ ل ر ح م ن / ٱ ل ر ح ي م);
    // the first one in Qur'an order wins.
    expect(insights.longestWord).toEqual({ s: 1, a: 1, w: 3, text: "ٱلرَّحْمَٰنِ", letterCount: 6 });
  });

  it("computes whole-corpus letter frequency", () => {
    const byLetter = Object.fromEntries(insights.letterFrequency.map((r) => [r.letter, r.count]));
    expect(byLetter["ل"]).toBeGreaterThan(0);
    expect(insights.letterFrequency).toEqual([...insights.letterFrequency].sort((a, b) => b.count - a.count || a.letter.localeCompare(b.letter)));
  });

  it("counts hapax legomena (roots/lemmas occurring exactly once)", () => {
    // أله, أمم, بني, سمو occur once each, plus the 6 fresh roots from the
    // two density-metric verses (شكر, صبر, فرح, حزن, خوف, سلم) = 10 hapax roots.
    expect(insights.hapaxRootCount).toBe(10);
    // every lemma except "ال" (count 3) occurs exactly once.
    expect(insights.hapaxLemmaCount).toBe(30);
  });

  it("finds the root with the most distinct lemmas and the most distinct forms", () => {
    expect(insights.mostDerivedRoot).toEqual({ ar: "رحم", lemmaCount: 2 });
    expect(insights.mostFormsRoot).toEqual({ ar: "رحم", formCount: 2 });
  });

  it("ranks the most root-dense verse by density, not raw root count, among verses of at least 10 words", () => {
    // 1:1 has the highest raw distinct-root count (3) but only 4 words --
    // below the density metric's 10-word minimum, so it's excluded. Between
    // the two 10-word fixture verses, 6:1 (4 distinct roots, density 0.4)
    // beats 5:1 (2 distinct roots, density 0.2).
    expect(insights.mostRootDenseVerse).toEqual({ s: 6, a: 1, distinctRootCount: 4, wordCount: 10, density: 0.4 });
  });
});

describe("buildInsights reads canonical text, not morphology's own", () => {
  it("uses surahFiles' spelling for longestWord and letterFrequency, not words[].text", () => {
    const built = buildRoots(words(), GLOSS);
    const surahFiles = surahFilesFrom(words());
    // Overwrite 1:1:3 (ٱلرَّحْمَٰنِ, the longest word in the shared fixture
    // above) with a canonical spelling one letter longer, appending غ --
    // absent from every other word in this fixture -- so it's the one
    // change that can move both longestWord and letterFrequency -- if
    // either still read words[].text, this override would have no effect.
    surahFiles.get(1)!.verses[0]!.w[2] = "ٱلرَّحْمَٰنِغ";
    const insights = buildInsights(
      words(),
      built.rootFiles,
      built.lemmaFiles,
      built.indexRoots,
      built.indexLemmas,
      114,
      surahFiles,
    );
    expect(insights.longestWord).toEqual({
      s: 1,
      a: 1,
      w: 3,
      text: "ٱلرَّحْمَٰنِغ",
      letterCount: 7,
    });
    const byLetter = Object.fromEntries(insights.letterFrequency.map((r) => [r.letter, r.count]));
    expect(byLetter["غ"]).toBe(1);
  });
});
