import { describe, expect, it } from "vitest";
import { parseMorphologyTSV } from "../../scripts/lib/parse-morphology";
import { buildCollocations } from "../../scripts/lib/build-collocations";

const ROWS = [
  // آمن (believed) followed by a FUSED clitic preposition بِ + ٱللَّهِ (one word, two segments) -- بِ
  "1:1:1:1\tآمَنَ\tV\tPERF|ROOT:أمن|LEM:آمَنَ|3MS",
  "1:1:2:1\tبِ\tP\tP|PREF|LEM:ب",
  "1:1:2:2\tٱللَّهِ\tN\tPN|ROOT:أله|LEM:اللَّه|GEN",
  // آمن again, followed by a STANDALONE preposition word -- إلى
  "1:2:1:1\tآمَنُواْ\tV\tPERF|ROOT:أمن|LEM:آمَنَ|3MP",
  "1:2:2:1\tإِلَى\tP\tP|LEM:إلى",
  // قال (said) followed directly by a noun -- no preposition, shouldn't be recorded
  "1:3:1:1\tقَالَ\tV\tPERF|ROOT:قول|LEM:قالَ|3MS",
  "1:3:2:1\tمُوسَى\tN\tPN|LEM:موسى",
  // جاء (came), the verse's only word -- no next word at all, must not crash
  "1:4:1:1\tجَاءَ\tV\tPERF|ROOT:جيء|LEM:جاءَ|3MS",
  // Fresh fixture for PMI (hand-computable): علم occurs 4 times with a next
  // word, 3 of them followed by بِ; كتب occurs 2 times with a next word, 1
  // followed by بِ. Combined with أمن's 1 occurrence of بِ above:
  //   prepGlobalTotal(ب) = 1 (أمن) + 3 (علم) + 1 (كتب) = 5
  //   totalWithNext = 2 (أمن) + 1 (قول) + 0 (جيء) + 4 (علم) + 2 (كتب) = 9
  "2:1:1:1\tعَلِمَ\tV\tPERF|ROOT:علم|LEM:عَلِمَ|3MS",
  "2:1:2:1\tبِ\tP\tP|PREF|LEM:ب",
  "2:1:2:2\tشَيْءٍ\tN\tLEM:شيء|GEN",
  "2:2:1:1\tعَلِمَ\tV\tPERF|ROOT:علم|LEM:عَلِمَ|3MS",
  "2:2:2:1\tبِ\tP\tP|PREF|LEM:ب",
  "2:2:2:2\tشَيْءٍ\tN\tLEM:شيء|GEN",
  "2:3:1:1\tعَلِمَ\tV\tPERF|ROOT:علم|LEM:عَلِمَ|3MS",
  "2:3:2:1\tبِ\tP\tP|PREF|LEM:ب",
  "2:3:2:2\tشَيْءٍ\tN\tLEM:شيء|GEN",
  "2:4:1:1\tعَلِمَ\tV\tPERF|ROOT:علم|LEM:عَلِمَ|3MS",
  "2:4:2:1\tشَيْئًا\tN\tLEM:شيء|ACC",
  "2:5:1:1\tكَتَبَ\tV\tPERF|ROOT:كتب|LEM:كَتَبَ|3MS",
  "2:5:2:1\tبِ\tP\tP|PREF|LEM:ب",
  "2:5:2:2\tقَلَمٍ\tN\tLEM:قلم|GEN",
  "2:6:1:1\tكَتَبَ\tV\tPERF|ROOT:كتب|LEM:كَتَبَ|3MS",
  "2:6:2:1\tكِتَابًا\tN\tLEM:كتاب|ACC",
].join("\n");

describe("buildCollocations", () => {
  const { verbPrepositions } = buildCollocations(parseMorphologyTSV(ROWS));

  it("detects a preposition fused as the following word's first (prefix) segment", () => {
    const row = verbPrepositions.find((r) => r.verbRootAr === "أمن" && r.prepositionKey === "ب");
    expect(row).toMatchObject({ prepositionLemma: "بِ", count: 1 });
  });

  it("detects a preposition that stands as its own full word", () => {
    const row = verbPrepositions.find((r) => r.verbRootAr === "أمن" && r.prepositionKey === "الي");
    expect(row).toMatchObject({ prepositionLemma: "إِلَى", count: 1 });
  });

  it("does not record a combo when the next word isn't a preposition", () => {
    expect(verbPrepositions.some((r) => r.verbRootAr === "قول")).toBe(false);
  });

  it("does not crash on a verb with no following word (end of verse)", () => {
    expect(verbPrepositions.some((r) => r.verbRootAr === "جيء")).toBe(false);
  });

  it("sorts by verb root, then by count descending within each root", () => {
    const sorted = [...verbPrepositions].sort(
      (a, b) => a.verbRootAr.localeCompare(b.verbRootAr) || b.count - a.count,
    );
    expect(verbPrepositions).toEqual(sorted);
  });

  it("computes PMI as log2(count * totalWithNext / (verbTotalWithNext * prepGlobalTotal))", () => {
    // prepGlobalTotal(ب) = 5, totalWithNext = 9 (see fixture comment above).
    const alim = verbPrepositions.find((r) => r.verbRootAr === "علم" && r.prepositionKey === "ب")!;
    const katab = verbPrepositions.find((r) => r.verbRootAr === "كتب" && r.prepositionKey === "ب")!;
    expect(alim.pmi).toBeCloseTo(Math.log2((3 * 9) / (4 * 5)), 10);
    expect(katab.pmi).toBeCloseTo(Math.log2((1 * 9) / (2 * 5)), 10);
    // علم takes ب in 3 of its 4 opportunities (a strong, distinctive
    // association) while كتب takes it in only 1 of 2 -- علم's PMI must be
    // the higher of the two, even though its raw count (3) is also higher,
    // confirming PMI isn't just re-deriving the count ranking here.
    expect(alim.pmi).toBeGreaterThan(katab.pmi);
  });
});
