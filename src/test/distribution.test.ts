import { describe, expect, it } from "vitest";
import { parseMorphologyTSV } from "../../scripts/lib/parse-morphology";
import { buildRoots } from "../../scripts/lib/build-roots";
import { buildSurahDistribution, sortByChronologicalOrder } from "@/lib/root/distribution";
import type { MetaFile } from "@/lib/data/types";

// كتب occurs three times: twice in surah 1 (Meccan), once in surah 2 (Medinan).
const KATABA_ROWS = [
  "1:2:2:2\tكِتَٰبُ\tN\tROOT:كتب|LEM:كِتاب|M|NOM",
  "1:3:2:2\tكِتَٰبَ\tN\tROOT:كتب|LEM:كِتاب|M|ACC",
  "2:2:2:2\tكِتَٰبُ\tN\tROOT:كتب|LEM:كِتاب|M|NOM",
].join("\n");

function katabaFile() {
  const words = parseMorphologyTSV(KATABA_ROWS);
  return buildRoots(words, {}).rootFiles.get("كتب")!;
}

const meta: MetaFile = {
  surahs: [
    { n: 1, nameAr: "الفاتحة", nameEn: "The Opening", translit: "Al-Fatiha", type: "meccan", ayahs: 7 },
    { n: 2, nameAr: "البقرة", nameEn: "The Cow", translit: "Al-Baqarah", type: "medinan", ayahs: 286 },
  ],
};

describe("buildSurahDistribution", () => {
  const dist = buildSurahDistribution(katabaFile(), meta);

  it("tallies occurrences by revelation period", () => {
    expect(dist.meccanCount).toBe(2);
    expect(dist.medinanCount).toBe(1);
  });

  it("rounds the Meccan percentage by occurrence count", () => {
    expect(dist.meccanPct).toBe(67); // 2/3 rounded
  });

  it("builds a per-surah breakdown in Quran order, omitting surahs with no occurrences", () => {
    expect(dist.bySurah).toEqual([
      { surah: 1, count: 2 },
      { surah: 2, count: 1 },
    ]);
  });

  it("returns a zero percentage and empty breakdown for a root with no occurrences", () => {
    const empty = buildSurahDistribution(
      { root: "xyz", total: 0, lemmas: [], forms: [], feats: [], occ: [] },
      meta,
    );
    expect(empty.meccanPct).toBe(0);
    expect(empty.bySurah).toEqual([]);
  });
});

describe("sortByChronologicalOrder", () => {
  it("reorders rows by revelation order instead of surah number", () => {
    // Surah 96 (Al-Alaq) is traditionally first, surah 1 fifth, surah 2 the
    // first Medinan surah -- reordered from Quran order (2, 96, 1).
    const rows = [{ surah: 2, count: 1 }, { surah: 96, count: 2 }, { surah: 1, count: 3 }];
    expect(sortByChronologicalOrder(rows).map((r) => r.surah)).toEqual([96, 1, 2]);
  });

  it("does not mutate the input array", () => {
    const rows = [{ surah: 2, count: 1 }, { surah: 1, count: 2 }];
    const original = [...rows];
    sortByChronologicalOrder(rows);
    expect(rows).toEqual(original);
  });
});
