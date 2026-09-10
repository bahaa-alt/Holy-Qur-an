import { describe, expect, it } from "vitest";
import { parseMorphologyTSV } from "../../scripts/lib/parse-morphology";
import { buildRoots } from "../../scripts/lib/build-roots";
import { buildVerseRoots } from "../../scripts/lib/build-verse-roots";
import { buildCollocations } from "@/lib/root/collocations";
import type { MetaFile } from "@/lib/data/types";

// كتب co-occurs with ربب once (2:2, where ربب also repeats -- must count
// that verse only once) and with علم once (2:79).
const ROWS = [
  "2:2:2:2\tكِتَٰبُ\tN\tROOT:كتب|LEM:كِتاب|M|NOM",
  "2:2:3:1\tرَبِّ\tN\tROOT:ربب|LEM:رَبّ|M|GEN",
  "2:2:4:1\tرَبِّ\tN\tROOT:ربب|LEM:رَبّ|M|GEN",
  "2:79:3:1\tيَكْتُبُ\tV\tIMPF|VF:1|ROOT:كتب|LEM:كَتَبَ|3MP|MOOD:IND",
  "2:79:4:1\tعَٰلَمِينَ\tN\tROOT:علم|LEM:عَالَم|MP|GEN",
].join("\n");

const META: MetaFile = {
  surahs: [{ n: 2, nameAr: "البقرة", nameEn: "The Cow", translit: "Al-Baqarah", type: "medinan", ayahs: 286 }],
};

function setup() {
  const words = parseMorphologyTSV(ROWS);
  const { rootFiles, rootTextToGlobalIdx } = buildRoots(words, {});
  // Dense global ids for every ayah of surah 2 (the only surah in META), so
  // refToGlobalId(META, 2, a) === a - 1 agrees with this map -- exactly how
  // build-data.ts derives both from the same meta.surahs enumeration.
  const globalIdOf = new Map<string, number>();
  for (let a = 1; a <= 286; a++) globalIdOf.set(`2:${a}`, a - 1);
  const verseRoots = buildVerseRoots(words, rootTextToGlobalIdx, globalIdOf);
  return { rootFiles, rootTextToGlobalIdx, verseRoots };
}

describe("buildCollocations", () => {
  it("tallies co-occurring roots at the verse level, excluding the current root", () => {
    const { rootFiles, rootTextToGlobalIdx, verseRoots } = setup();
    const katabaFile = rootFiles.get("كتب")!;
    const katabaIdx = rootTextToGlobalIdx.get("كتب")!;
    const rabbIdx = rootTextToGlobalIdx.get("ربب")!;
    const ilmIdx = rootTextToGlobalIdx.get("علم")!;

    const result = buildCollocations(katabaFile, katabaIdx, verseRoots, META);

    expect(result).toContainEqual({ rootIdx: rabbIdx, count: 1 });
    expect(result).toContainEqual({ rootIdx: ilmIdx, count: 1 });
    expect(result.find((r) => r.rootIdx === katabaIdx)).toBeUndefined();
  });

  it("respects the limit and sorts by count desc, then rootIdx asc for ties", () => {
    const { rootFiles, rootTextToGlobalIdx, verseRoots } = setup();
    const katabaFile = rootFiles.get("كتب")!;
    const katabaIdx = rootTextToGlobalIdx.get("كتب")!;

    const result = buildCollocations(katabaFile, katabaIdx, verseRoots, META, 1);
    expect(result).toHaveLength(1);

    const full = buildCollocations(katabaFile, katabaIdx, verseRoots, META);
    const sorted = [...full].sort((a, b) => b.count - a.count || a.rootIdx - b.rootIdx);
    expect(full).toEqual(sorted);
  });

  it("returns an empty array for a root with no verses (defensive)", () => {
    const { rootTextToGlobalIdx, verseRoots } = setup();
    const empty = { root: "xyz", total: 0, lemmas: [], forms: [], feats: [], occ: [] };
    expect(buildCollocations(empty, rootTextToGlobalIdx.get("كتب")!, verseRoots, META)).toEqual([]);
  });
});
