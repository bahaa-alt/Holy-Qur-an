import { describe, expect, it } from "vitest";
import { parseMorphologyTSV } from "../../scripts/lib/parse-morphology";
import { buildRoots } from "../../scripts/lib/build-roots";
import { buildVerseRoots } from "../../scripts/lib/build-verse-roots";

// 1:1 has three rooted segments (سمو, أله, رحم twice); 2:2 has one (كتب).
const AYAH_1_1 = [
  "1:1:1:1\tبِ\tP\tP|PREF|LEM:ب",
  "1:1:1:2\tسْمِ\tN\tROOT:سمو|LEM:اسْم|M|GEN",
  "1:1:2:1\tٱللَّهِ\tN\tPN|ROOT:أله|LEM:اللَّه|GEN",
  "1:1:3:1\tٱل\tP\tDET|PREF|LEM:ال",
  "1:1:3:2\tرَّحْمَٰنِ\tN\tROOT:رحم|LEM:رَحْمٰن|MS|GEN|ADJ",
  "1:1:4:1\tٱل\tP\tDET|PREF|LEM:ال",
  "1:1:4:2\tرَّحِيمِ\tN\tROOT:رحم|LEM:رَحِيم|MS|GEN|ADJ",
].join("\n");
const KATABA_ROW = "2:2:2:2\tكِتَٰبُ\tN\tROOT:كتب|LEM:كِتاب|M|NOM";

function words() {
  return [...parseMorphologyTSV(AYAH_1_1), ...parseMorphologyTSV(KATABA_ROW)];
}

describe("buildVerseRoots", () => {
  const { rootTextToGlobalIdx } = buildRoots(words(), {});
  // 1:1 -> global id 0, 2:2 -> global id 1 (arbitrary but distinct, as
  // build-data.ts would assign by enumerating meta.surahs in order).
  const globalIdOf = new Map([
    ["1:1", 0],
    ["2:2", 1],
  ]);

  const verseRoots = buildVerseRoots(words(), rootTextToGlobalIdx, globalIdOf);

  it("sizes the result to the number of verses in globalIdOf", () => {
    expect(verseRoots).toHaveLength(2);
  });

  it("lists every rooted word in a verse, in word order", () => {
    const samoRootIdx = rootTextToGlobalIdx.get("سمو")!;
    const alahRootIdx = rootTextToGlobalIdx.get("أله")!;
    const rahmRootIdx = rootTextToGlobalIdx.get("رحم")!;

    expect(verseRoots[0]).toEqual([
      [samoRootIdx, 1],
      [alahRootIdx, 2],
      [rahmRootIdx, 3],
      [rahmRootIdx, 4],
    ]);
  });

  it("leaves an empty array for a verse with no rooted words, if any existed", () => {
    // (no such verse in this fixture, but the shape must support it)
    const globalIdOfWithGap = new Map([
      ["1:1", 0],
      ["9:9", 1],
      ["2:2", 2],
    ]);
    const result = buildVerseRoots(words(), rootTextToGlobalIdx, globalIdOfWithGap);
    expect(result[1]).toEqual([]);
  });

  it("resolves a single-root verse correctly", () => {
    const katabaRootIdx = rootTextToGlobalIdx.get("كتب")!;
    expect(verseRoots[1]).toEqual([[katabaRootIdx, 2]]);
  });
});
