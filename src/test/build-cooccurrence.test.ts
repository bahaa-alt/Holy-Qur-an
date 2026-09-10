import { describe, expect, it } from "vitest";
import { parseMorphologyTSV } from "../../scripts/lib/parse-morphology";
import { buildCooccurrence } from "../../scripts/lib/build-cooccurrence";

// Five verses touching roots ا/ب/ج in a deliberate pattern:
//   1:1 {ا,ب,ج}   1:2 {ا,ب}   1:3 {ا,ب,ج}   1:4 {ا,ب}   1:5 {ا,ج}
// So (ا,ب) co-occurs 4 times, (ا,ج) 3 times, (ب,ج) only 2 times -- below
// the MIN_COUNT=3 floor, so it must be excluded from the results.
const ROWS = [
  "1:1:1:1\tك1\tN\tROOT:ا|LEM:ل1|M|NOM",
  "1:1:2:1\tك2\tN\tROOT:ب|LEM:ل2|M|NOM",
  "1:1:3:1\tك3\tN\tROOT:ج|LEM:ل3|M|NOM",
  "1:2:1:1\tك4\tN\tROOT:ا|LEM:ل4|M|NOM",
  "1:2:2:1\tك5\tN\tROOT:ب|LEM:ل5|M|NOM",
  "1:3:1:1\tك6\tN\tROOT:ا|LEM:ل6|M|NOM",
  "1:3:2:1\tك7\tN\tROOT:ب|LEM:ل7|M|NOM",
  "1:3:3:1\tك8\tN\tROOT:ج|LEM:ل8|M|NOM",
  "1:4:1:1\tك9\tN\tROOT:ا|LEM:ل9|M|NOM",
  "1:4:2:1\tك10\tN\tROOT:ب|LEM:ل10|M|NOM",
  "1:5:1:1\tك11\tN\tROOT:ا|LEM:ل11|M|NOM",
  "1:5:2:1\tك12\tN\tROOT:ج|LEM:ل12|M|NOM",
].join("\n");

// Deliberately independent of the ROWS fixture's real verse membership --
// buildCooccurrence trusts these as given, so they're chosen purely to make
// the PMI arithmetic clean and to demonstrate PMI re-ranking a count-based
// list: ب is common (40 verses) and only sometimes co-occurs with ا (its 4
// shared verses are "unremarkable" relative to how often it appears
// anywhere), while ج is rare (3 verses) and *always* co-occurs with ا when
// it appears at all (fully bound) -- a distinctive pairing despite its
// lower raw count.
const VERSE_COUNT_BY_ROOT = new Map([
  ["ا", 100],
  ["ب", 40],
  ["ج", 3],
]);
const TOTAL_VERSES = 1000;

describe("buildCooccurrence", () => {
  const result = buildCooccurrence(parseMorphologyTSV(ROWS), VERSE_COUNT_BY_ROOT, TOTAL_VERSES);

  it("tallies each unordered root pair's shared-verse count, excluding pairs below the minimum", () => {
    expect(result.topPairs.map(({ rootA, rootB, count }) => ({ rootA, rootB, count }))).toEqual([
      { rootA: "ا", rootB: "ب", count: 4 },
      { rootA: "ا", rootB: "ج", count: 3 },
    ]);
  });

  it("computes PMI as log2(count * totalVerses / (verseCountA * verseCountB))", () => {
    const ab = result.topPairs.find((p) => p.rootB === "ب")!;
    const aj = result.topPairs.find((p) => p.rootB === "ج")!;
    expect(ab.pmi).toBeCloseTo(Math.log2((4 * 1000) / (100 * 40)), 10); // = log2(1) = 0
    expect(aj.pmi).toBeCloseTo(Math.log2((3 * 1000) / (100 * 3)), 10); // = log2(10) ≈ 3.32
  });

  it("ranks topPairsByPmi differently from topPairs when PMI disagrees with raw count", () => {
    // (ا,ج) has the lower count (3 < 4) but the higher PMI (fully bound to
    // ا despite being rare), so a PMI ranking must place it first even
    // though the count ranking puts (ا,ب) first.
    expect(result.topPairs[0].rootB).toBe("ب");
    expect(result.topPairsByPmi[0].rootB).toBe("ج");
  });

  it("lists each root's co-occurrence partners, sorted by count desc, each carrying its PMI", () => {
    expect(result.byRoot["ا"]).toEqual([
      { root: "ب", count: 4, pmi: expect.closeTo(0, 10) },
      { root: "ج", count: 3, pmi: expect.closeTo(Math.log2(10), 10) },
    ]);
  });

  it("excludes a partner whose shared count falls below the minimum", () => {
    // ب and ج only co-occur twice (1:1 and 1:3) -- below MIN_COUNT=3.
    expect(result.byRoot["ب"].map(({ root, count }) => ({ root, count }))).toEqual([{ root: "ا", count: 4 }]);
    expect(result.byRoot["ج"].map(({ root, count }) => ({ root, count }))).toEqual([{ root: "ا", count: 3 }]);
  });

  it("never lists a root as its own partner", () => {
    for (const [root, partners] of Object.entries(result.byRoot)) {
      expect(partners.every((p) => p.root !== root)).toBe(true);
    }
  });
});
