import { describe, expect, it } from "vitest";
import { parseMorphologyTSV } from "../../scripts/lib/parse-morphology";
import { buildVerseSimilarity } from "../../scripts/lib/build-verse-similarity";

// Five verses (global ids 0-4) with deliberately overlapping root sets:
//   1:1 (id 0) {ف ق ر س و}   1:2 (id 1) {ف ق ر س خ}
//   1:3 (id 2) {ف ق ي ز}     1:4 (id 3) {ف ق ر س}
//   1:5 (id 4) {ف ق}
// All roots here occur in <=5 verses, well under CANDIDATE_ROOT_MAX_VERSES,
// so every root is candidate-generating.
const ROWS = [
  "1:1:1:1\tك1\tN\tROOT:ف|LEM:ل1",
  "1:1:2:1\tك2\tN\tROOT:ق|LEM:ل2",
  "1:1:3:1\tك3\tN\tROOT:ر|LEM:ل3",
  "1:1:4:1\tك4\tN\tROOT:س|LEM:ل4",
  "1:1:5:1\tك5\tN\tROOT:و|LEM:ل5",
  "1:2:1:1\tك6\tN\tROOT:ف|LEM:ل6",
  "1:2:2:1\tك7\tN\tROOT:ق|LEM:ل7",
  "1:2:3:1\tك8\tN\tROOT:ر|LEM:ل8",
  "1:2:4:1\tك9\tN\tROOT:س|LEM:ل9",
  "1:2:5:1\tك10\tN\tROOT:خ|LEM:ل10",
  "1:3:1:1\tك11\tN\tROOT:ف|LEM:ل11",
  "1:3:2:1\tك12\tN\tROOT:ق|LEM:ل12",
  "1:3:3:1\tك13\tN\tROOT:ي|LEM:ل13",
  "1:3:4:1\tك14\tN\tROOT:ز|LEM:ل14",
  "1:4:1:1\tك15\tN\tROOT:ف|LEM:ل15",
  "1:4:2:1\tك16\tN\tROOT:ق|LEM:ل16",
  "1:4:3:1\tك17\tN\tROOT:ر|LEM:ل17",
  "1:4:4:1\tك18\tN\tROOT:س|LEM:ل18",
  "1:5:1:1\tك19\tN\tROOT:ف|LEM:ل19",
  "1:5:2:1\tك20\tN\tROOT:ق|LEM:ل20",
].join("\n");

const GLOBAL_ID_OF = new Map([
  ["1:1", 0],
  ["1:2", 1],
  ["1:3", 2],
  ["1:4", 3],
  ["1:5", 4],
]);

describe("buildVerseSimilarity", () => {
  const result = buildVerseSimilarity(parseMorphologyTSV(ROWS), GLOBAL_ID_OF);

  it("finds verse pairs meeting both the shared-root floor and the Jaccard floor, ranked by Jaccard desc", () => {
    expect(result.pairs).toEqual([
      { a: 0, b: 3, sharedRoots: 4, jaccard: 0.8 }, // {ف ق ر س} ∩ {ف ق ر س} / {ف ق ر س و} ∪ {ف ق ر س} = 4/5
      { a: 1, b: 3, sharedRoots: 4, jaccard: 0.8 }, // same shape, tied on jaccard+sharedRoots, ordered by a asc
      { a: 0, b: 1, sharedRoots: 4, jaccard: 4 / 6 }, // {ف ق ر س و} vs {ف ق ر س خ}: shared 4, union 6
    ]);
  });

  it("excludes a pair below the shared-root minimum despite sharing some roots", () => {
    // 1:3 (id 2) shares only ف,ق (2 roots) with any other verse -- below MIN_SHARED_ROOTS=4.
    expect(result.pairs.some((p) => p.a === 2 || p.b === 2)).toBe(false);
  });

  it("excludes a verse with too few total distinct roots to ever qualify", () => {
    // 1:5 (id 4) has only 2 distinct roots total -- can't meet MIN_SHARED_ROOTS=4
    // even though both of its roots are shared with several other verses.
    expect(result.pairs.some((p) => p.a === 4 || p.b === 4)).toBe(false);
  });
});
