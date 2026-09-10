import { describe, expect, it } from "vitest";
import { parseMorphologyTSV } from "../../scripts/lib/parse-morphology";
import { buildRoots } from "../../scripts/lib/build-roots";
import { buildDistinctiveVocab } from "../../scripts/lib/build-distinctive-vocab";

// Surah 1: 4 words, 3 of them كتب (heavily concentrated there).
const SURAH_1_ROWS = [
  "1:1:1:1\tك1\tN\tROOT:كتب|LEM:ك1|M|NOM",
  "1:1:2:1\tك2\tN\tROOT:كتب|LEM:ك2|M|NOM",
  "1:1:3:1\tك3\tN\tROOT:كتب|LEM:ك3|M|NOM",
  "1:1:4:1\tف1\tP\tP|PREF|LEM:ف1",
].join("\n");

// Surah 2: 10 words -- one more كتب (too rare here to qualify, min. 3) and
// 4 of رحم (qualifies, but less concentrated than كتب was in surah 1).
const SURAH_2_ROWS = [
  "2:1:1:1\tك4\tN\tROOT:كتب|LEM:ك4|M|NOM",
  "2:1:2:1\tر1\tN\tROOT:رحم|LEM:ر1|M|NOM",
  "2:1:3:1\tر2\tN\tROOT:رحم|LEM:ر2|M|NOM",
  "2:1:4:1\tر3\tN\tROOT:رحم|LEM:ر3|M|NOM",
  "2:1:5:1\tر4\tN\tROOT:رحم|LEM:ر4|M|NOM",
  "2:1:6:1\tف2\tP\tP|PREF|LEM:ف2",
  "2:1:7:1\tف3\tP\tP|PREF|LEM:ف3",
  "2:1:8:1\tف4\tP\tP|PREF|LEM:ف4",
  "2:1:9:1\tف5\tP\tP|PREF|LEM:ف5",
  "2:1:10:1\tف6\tP\tP|PREF|LEM:ف6",
].join("\n");

function words() {
  return [...parseMorphologyTSV(SURAH_1_ROWS), ...parseMorphologyTSV(SURAH_2_ROWS)];
}

describe("buildDistinctiveVocab", () => {
  const built = buildRoots(words(), {});
  const vocab = buildDistinctiveVocab(words(), built.rootFiles, built.indexRoots, 2);

  it("surfaces a root concentrated in one surah, with the correct ratio", () => {
    // كتب: global rate 4/14; surah 1 local rate 3/4 -> ratio (3/4)/(4/14) = 2.625
    expect(vocab.bySurah[0]).toEqual([{ ar: "كتب", glossShort: "", localCount: 3, ratio: 2.625 }]);
  });

  it("excludes a root that appears fewer than 3 times in a surah, even if none of it appears elsewhere is more common", () => {
    // كتب only occurs once in surah 2 -- below the minimum, so surah 2's
    // list has only رحم even though كتب technically also occurs there.
    expect(vocab.bySurah[1]).toHaveLength(1);
    expect(vocab.bySurah[1][0].ar).toBe("رحم");
  });

  it("computes the correct ratio for a qualifying root in a different surah", () => {
    // رحم: global rate 4/14; surah 2 local rate 4/10 -> ratio (4/10)/(4/14) = 1.4
    expect(vocab.bySurah[1]).toMatchObject([{ ar: "رحم", localCount: 4 }]);
    expect(vocab.bySurah[1][0].ratio).toBeCloseTo(1.4, 10);
  });

  it("has one entry per surah, up to totalSurahs", () => {
    expect(vocab.bySurah).toHaveLength(2);
  });
});
