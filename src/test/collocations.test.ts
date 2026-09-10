import { describe, expect, it } from "vitest";
import { parseMorphologyTSV } from "../../scripts/lib/parse-morphology";
import { buildRoots } from "../../scripts/lib/build-roots";
import { buildVerseRoots } from "../../scripts/lib/build-verse-roots";
import { buildCollocations } from "@/lib/root/collocations";
import type { IndexFile, IndexRootRow, MetaFile } from "@/lib/data/types";

// كتب occurs in verses 1 and 2 only. ربب is a COMMON root, occurring in all
// four verses (verseCount 4); ندي is a RARE root, occurring only in the same
// two verses as كتب (verseCount 2). Both co-occur with كتب exactly twice --
// a raw count tally would tie them, but ندي is far more distinctive to كتب
// (it never appears without it) and must rank above ربب by PMI.
const ROWS = [
  "2:1:1:1\tكَتَبَ\tV\tPERF|ROOT:كتب|LEM:كَتَبَ|3MS",
  "2:1:2:1\tرَبِّ\tN\tROOT:ربب|LEM:رَبّ|M|GEN",
  "2:1:3:1\tنَادَى\tV\tPERF|ROOT:ندي|LEM:نَادَى|3MS",
  "2:2:1:1\tكَتَبَ\tV\tPERF|ROOT:كتب|LEM:كَتَبَ|3MS",
  "2:2:2:1\tرَبِّ\tN\tROOT:ربب|LEM:رَبّ|M|GEN",
  "2:2:3:1\tنَادَى\tV\tPERF|ROOT:ندي|LEM:نَادَى|3MS",
  "2:3:1:1\tرَبِّ\tN\tROOT:ربب|LEM:رَبّ|M|GEN",
  "2:4:1:1\tرَبِّ\tN\tROOT:ربب|LEM:رَبّ|M|GEN",
].join("\n");

const META: MetaFile = {
  surahs: [{ n: 2, nameAr: "البقرة", nameEn: "The Cow", translit: "Al-Baqarah", type: "medinan", ayahs: 4 }],
};

function setup() {
  const words = parseMorphologyTSV(ROWS);
  const { rootFiles, rootTextToGlobalIdx } = buildRoots(words, {});
  // Dense global ids 0..3 for the 4 ayahs of this single-surah META, matching
  // refToGlobalId(META, 2, a) === a - 1.
  const globalIdOf = new Map<string, number>([
    ["2:1", 0],
    ["2:2", 1],
    ["2:3", 2],
    ["2:4", 3],
  ]);
  const verseRoots = buildVerseRoots(words, rootTextToGlobalIdx, globalIdOf);

  // Hand-built index.roots, sized to the real root count and populated only
  // at the indices this test cares about (verseCount is all buildCollocations
  // reads from it).
  const roots: IndexRootRow[] = Array.from({ length: rootTextToGlobalIdx.size }, () => ({
    ar: "",
    key: "",
    bw: "",
    count: 0,
    lemmaCount: 0,
    verseCount: 0,
    glossShort: "",
  }));
  roots[rootTextToGlobalIdx.get("ربب")!] = { ...roots[0], ar: "ربب", verseCount: 4 };
  roots[rootTextToGlobalIdx.get("ندي")!] = { ...roots[0], ar: "ندي", verseCount: 2 };
  const index: IndexFile = { roots, lemmas: [] };

  return { rootFiles, rootTextToGlobalIdx, verseRoots, index };
}

describe("buildCollocations", () => {
  it("ranks a rarer, more-distinctive co-occurring root above a common one, despite equal raw counts", () => {
    const { rootFiles, rootTextToGlobalIdx, verseRoots, index } = setup();
    const katabaFile = rootFiles.get("كتب")!;
    const katabaIdx = rootTextToGlobalIdx.get("كتب")!;
    const rabbIdx = rootTextToGlobalIdx.get("ربب")!;
    const nadaIdx = rootTextToGlobalIdx.get("ندي")!;

    const result = buildCollocations(katabaFile, katabaIdx, verseRoots, META, index);

    const rabb = result.find((r) => r.rootIdx === rabbIdx)!;
    const nada = result.find((r) => r.rootIdx === nadaIdx)!;
    expect(rabb.count).toBe(2);
    expect(nada.count).toBe(2);
    expect(nada.pmi).toBeGreaterThan(rabb.pmi);
    expect(result.map((r) => r.rootIdx).indexOf(nadaIdx)).toBeLessThan(result.map((r) => r.rootIdx).indexOf(rabbIdx));
  });

  it("computes the exact PMI value", () => {
    // pmi = log2(count * totalVerses / (verseCountA * verseCountB))
    //     = log2(2 * 4 / (2 * 4)) = log2(1) = 0 for ربب
    //     = log2(2 * 4 / (2 * 2)) = log2(2) = 1 for ندي
    const { rootFiles, rootTextToGlobalIdx, verseRoots, index } = setup();
    const katabaFile = rootFiles.get("كتب")!;
    const katabaIdx = rootTextToGlobalIdx.get("كتب")!;
    const result = buildCollocations(katabaFile, katabaIdx, verseRoots, META, index);

    const rabb = result.find((r) => r.rootIdx === rootTextToGlobalIdx.get("ربب"))!;
    const nada = result.find((r) => r.rootIdx === rootTextToGlobalIdx.get("ندي"))!;
    expect(rabb.pmi).toBeCloseTo(0, 10);
    expect(nada.pmi).toBeCloseTo(1, 10);
  });

  it("excludes the current root itself and drops pairs below minCount", () => {
    const { rootFiles, rootTextToGlobalIdx, verseRoots, index } = setup();
    const katabaFile = rootFiles.get("كتب")!;
    const katabaIdx = rootTextToGlobalIdx.get("كتب")!;

    const result = buildCollocations(katabaFile, katabaIdx, verseRoots, META, index);
    expect(result.find((r) => r.rootIdx === katabaIdx)).toBeUndefined();
    // every remaining candidate co-occurs 0 or 1 times and must be filtered out
    expect(result).toHaveLength(2);
  });

  it("returns an empty array for a root with no verses (defensive)", () => {
    const { rootTextToGlobalIdx, verseRoots, index } = setup();
    const empty = { root: "xyz", total: 0, lemmas: [], forms: [], feats: [], occ: [] };
    expect(buildCollocations(empty, rootTextToGlobalIdx.get("كتب")!, verseRoots, META, index)).toEqual([]);
  });
});
