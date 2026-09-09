import { describe, expect, it } from "vitest";
import { parseMorphologyTSV } from "../../scripts/lib/parse-morphology";
import { buildRoots } from "../../scripts/lib/build-roots";
import { buildRootSummary } from "@/lib/root/summary";

const AYAH_1_1 = [
  "1:1:1:1\tبِ\tP\tP|PREF|LEM:ب",
  "1:1:1:2\tسْمِ\tN\tROOT:سمو|LEM:اسْم|M|GEN",
  "1:1:2:1\tٱللَّهِ\tN\tPN|ROOT:أله|LEM:اللَّه|GEN",
  "1:1:3:1\tٱل\tP\tDET|PREF|LEM:ال",
  "1:1:3:2\tرَّحْمَٰنِ\tN\tROOT:رحم|LEM:رَحْمٰن|MS|GEN|ADJ",
  "1:1:4:1\tٱل\tP\tDET|PREF|LEM:ال",
  "1:1:4:2\tرَّحِيمِ\tN\tROOT:رحم|LEM:رَحِيم|MS|GEN|ADJ",
].join("\n");

const KATABA_ROWS = [
  "2:2:2:1\tٱلْ\tP\tDET|PREF|LEM:ال",
  "2:2:2:2\tكِتَٰبُ\tN\tROOT:كتب|LEM:كِتاب|M|NOM",
  "2:79:3:1\tيَكْتُبُ\tV\tIMPF|VF:1|ROOT:كتب|LEM:كَتَبَ|3MP|MOOD:IND",
  "2:79:3:2\tونَ\tN\tPRON|SUFF|3MP",
].join("\n");

function words() {
  return [...parseMorphologyTSV(AYAH_1_1), ...parseMorphologyTSV(KATABA_ROWS)];
}

describe("buildRootSummary", () => {
  const result = buildRoots(words(), {});
  const katabaFile = result.rootFiles.get("كتب")!;
  const rahmFile = result.rootFiles.get("رحم")!;
  const summary = buildRootSummary(katabaFile);

  it("computes verse and surah counts distinct from raw occurrence count", () => {
    // كتب occurs twice, in two different verses (2:2 and 2:79), same surah
    expect(summary.total).toBe(2);
    expect(summary.verseCount).toBe(2);
    expect(summary.surahCount).toBe(1);
  });

  it("counts a root occurring twice in the same verse as one verse, one surah", () => {
    const rahmSummary = buildRootSummary(rahmFile);
    expect(rahmSummary.total).toBe(2);
    expect(rahmSummary.verseCount).toBe(1);
    expect(rahmSummary.surahCount).toBe(1);
  });

  it("builds a category breakdown summing form counts, omitting zero categories", () => {
    expect(summary.byCategory).toEqual(
      expect.arrayContaining([
        { cat: "noun", count: 1 },
        { cat: "verb.impf", count: 1 },
      ]),
    );
    expect(summary.byCategory.find((c) => c.cat === "verb.perf")).toBeUndefined();
  });

  it("orders the category breakdown per CATEGORY_ORDER, not insertion order", () => {
    const cats = summary.byCategory.map((c) => c.cat);
    // verb.impf comes before noun in CATEGORY_ORDER
    expect(cats.indexOf("verb.impf")).toBeLessThan(cats.indexOf("noun"));
  });

  it("builds a per-lemma breakdown sorted by count descending", () => {
    expect(summary.byLemma).toHaveLength(2);
    const sorted = [...summary.byLemma].sort((a, b) => b.count - a.count);
    expect(summary.byLemma).toEqual(sorted);
  });

  it("carries through gloss and bw fields when present", () => {
    const withGloss = buildRoots(words(), { كتب: { b: "ktb", m: "To write. A test gloss." } }).rootFiles.get(
      "كتب",
    )!;
    const s = buildRootSummary(withGloss);
    expect(s.bw).toBe("ktb");
    expect(s.glossFull).toContain("write");
  });

  it("leaves gloss fields undefined when no gloss is available", () => {
    expect(summary.bw).toBeUndefined();
    expect(summary.glossFull).toBeUndefined();
  });
});
