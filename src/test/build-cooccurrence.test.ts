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

describe("buildCooccurrence", () => {
  const result = buildCooccurrence(parseMorphologyTSV(ROWS));

  it("tallies each unordered root pair's shared-verse count, excluding pairs below the minimum", () => {
    expect(result.topPairs).toEqual([
      { rootA: "ا", rootB: "ب", count: 4 },
      { rootA: "ا", rootB: "ج", count: 3 },
    ]);
  });

  it("lists each root's co-occurrence partners, sorted by count desc", () => {
    expect(result.byRoot["ا"]).toEqual([
      { root: "ب", count: 4 },
      { root: "ج", count: 3 },
    ]);
  });

  it("excludes a partner whose shared count falls below the minimum", () => {
    // ب and ج only co-occur twice (1:1 and 1:3) -- below MIN_COUNT=3.
    expect(result.byRoot["ب"]).toEqual([{ root: "ا", count: 4 }]);
    expect(result.byRoot["ج"]).toEqual([{ root: "ا", count: 3 }]);
  });

  it("never lists a root as its own partner", () => {
    for (const [root, partners] of Object.entries(result.byRoot)) {
      expect(partners.every((p) => p.root !== root)).toBe(true);
    }
  });
});
