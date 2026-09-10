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
});
