import { describe, expect, it } from "vitest";
import { parseMorphologyTSV } from "../../scripts/lib/parse-morphology";
import { buildRoots, type RootsGlossMap } from "../../scripts/lib/build-roots";

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

const DOUBLE_ROOT_WORD = [
  "20:94:2:1\tيَ\tP\tVOC|PREF|LEM:ي",
  "20:94:2:2\tبْنَ\tN\tROOT:بني|LEM:ابْن|M|ACC",
  "20:94:2:3\tؤُمَّ\tN\tROOT:أمم|LEM:أُمّ|FS|GEN",
  "20:94:2:4\t\tN\tPRON|SUFF|1S",
].join("\n");

function words() {
  return [
    ...parseMorphologyTSV(AYAH_1_1),
    ...parseMorphologyTSV(KATABA_ROWS),
    ...parseMorphologyTSV(DOUBLE_ROOT_WORD),
  ];
}

const GLOSS: RootsGlossMap = {
  رحم: { b: "rHm", m: "Mercy, compassion, and the womb. A defensive but incomplete example sentence." },
  شيأ: { b: "zero-matches", m: "A gloss present in the source but absent from this fixture's morphology." },
};

describe("buildRoots", () => {
  const result = buildRoots(words(), GLOSS);

  it("produces one indexRoots row per distinct root, sorted by normalized key", () => {
    const roots = result.indexRoots.map((r) => r.ar);
    expect(new Set(roots)).toEqual(new Set(["سمو", "أله", "رحم", "كتب", "بني", "أمم"]));
    const sortedCopy = [...result.indexRoots].sort((a, b) => a.key.localeCompare(b.key));
    expect(result.indexRoots).toEqual(sortedCopy);
  });

  it("counts occurrences correctly per root", () => {
    const byRoot = Object.fromEntries(result.indexRoots.map((r) => [r.ar, r]));
    expect(byRoot["رحم"].count).toBe(2); // رَّحْمَٰنِ + رَّحِيمِ
    expect(byRoot["كتب"].count).toBe(2); // كِتَٰبُ + يَكْتُبُ
    expect(byRoot["أله"].count).toBe(1);
    expect(byRoot["سمو"].count).toBe(1);
    expect(byRoot["بني"].count).toBe(1);
    expect(byRoot["أمم"].count).toBe(1);
    expect(byRoot["رحم"].verseCount).toBe(1); // both occurrences are in 1:1
  });

  it("attaches gloss data only to roots present in the gloss map", () => {
    const rahmFile = result.rootFiles.get("رحم")!;
    expect(rahmFile.bw).toBe("rHm");
    expect(rahmFile.gloss?.en).toContain("Mercy");
    expect(rahmFile.gloss?.short.length).toBeLessThanOrEqual(140);

    const katabaFile = result.rootFiles.get("كتب")!;
    expect(katabaFile.gloss).toBeUndefined();
    expect(katabaFile.bw).toBeUndefined();
  });

  it("reports roots missing a gloss and gloss entries with no matching root", () => {
    expect(result.unmappedGlossRoots.sort()).toEqual(["أله", "أمم", "بني", "سمو", "كتب"].sort());
    expect(result.unusedGlossRoots).toEqual(["شيأ"]);
  });

  it("builds per-root lemma entries with correct categories and counts", () => {
    const katabaFile = result.rootFiles.get("كتب")!;
    expect(katabaFile.lemmas).toHaveLength(2);
    const byLemma = Object.fromEntries(katabaFile.lemmas.map((l) => [l.lemma, l]));
    expect(byLemma["كِتاب"]).toMatchObject({ pos: "N", count: 1, cats: { noun: 1 } });
    expect(byLemma["كَتَبَ"]).toMatchObject({ pos: "V", count: 1, cats: { "verb.impf": 1 }, vf: { I: 1 } });
  });

  it("builds per-root form entries pointing at the correct local lemma index", () => {
    const katabaFile = result.rootFiles.get("كتب")!;
    expect(katabaFile.forms).toHaveLength(2);
    const kitabuForm = katabaFile.forms.find((f) => f.form === "كِتَٰبُ")!;
    const kitabuLemmaIdx = katabaFile.lemmas.findIndex((l) => l.lemma === "كِتاب");
    expect(kitabuForm.lemmaIdx).toBe(kitabuLemmaIdx);
    expect(kitabuForm.cat).toBe("noun");
  });

  it("produces occurrence tuples referencing valid form/feat indices", () => {
    const katabaFile = result.rootFiles.get("كتب")!;
    expect(katabaFile.occ).toHaveLength(2);
    for (const [s, a, w, seg, formIdx, featIdx] of katabaFile.occ) {
      expect(s).toBeGreaterThan(0);
      expect(a).toBeGreaterThan(0);
      expect(w).toBeGreaterThan(0);
      expect(seg).toBeGreaterThan(0);
      expect(katabaFile.forms[formIdx]).toBeDefined();
      expect(katabaFile.feats[featIdx]).toBeDefined();
    }
    // the يَكْتُبُ occurrence's feats string reconstructs the original tag list
    const verbOcc = katabaFile.occ.find(([s, a]) => s === 2 && a === 79)!;
    expect(katabaFile.feats[verbOcc[5]]).toBe("IMPF|VF:1|3MP|MOOD:IND");
  });

  it("handles the double-rooted word by attributing one occurrence to each root", () => {
    const bani = result.rootFiles.get("بني")!;
    const umm = result.rootFiles.get("أمم")!;
    expect(bani.occ).toHaveLength(1);
    expect(umm.occ).toHaveLength(1);
    expect(bani.occ[0].slice(0, 4)).toEqual([20, 94, 2, 2]);
    expect(umm.occ[0].slice(0, 4)).toEqual([20, 94, 2, 3]);
  });

  it("aggregates rootless lemmas separately from rooted ones", () => {
    const rootlessLemmas = result.indexLemmas.filter((l) => l.rootIdx === -1);
    const byLemma = Object.fromEntries(rootlessLemmas.map((l) => [l.lemma, l]));
    // DET ال appears at 1:1:3:1, 1:1:4:1 (before رحمن/رحيم) and 2:2:2:1 (before كتاب)
    expect(byLemma["ال"].count).toBe(3);
    expect(byLemma["ب"].count).toBe(1);
  });

  it("builds a self-contained RootFile for each rootless lemma", () => {
    const alFile = [...result.lemmaFiles.values()].find((f) => f.lemmas[0].lemma === "ال")!;
    expect(alFile.root).toBeNull();
    expect(alFile.total).toBeGreaterThanOrEqual(2);
    expect(alFile.occ.length).toBe(alFile.total);
    expect(alFile.forms.length).toBeGreaterThan(0);
  });

  it("includes both rooted and rootless entries in the global forms index, sorted by key", () => {
    const keys = result.formsEntries.map((f) => f.key);
    const sortedKeys = [...keys].sort((a, b) => a.localeCompare(b));
    expect(keys).toEqual(sortedKeys);
    expect(result.formsEntries.some((f) => f.rootIdx === -1)).toBe(true);
    expect(result.formsEntries.some((f) => f.rootIdx !== -1)).toBe(true);
  });

  it("resolves every formsEntry lemmaIdx to a valid index.json lemma row", () => {
    for (const entry of result.formsEntries) {
      expect(result.indexLemmas[entry.lemmaIdx]).toBeDefined();
      if (entry.rootIdx !== -1) {
        expect(result.indexLemmas[entry.lemmaIdx].rootIdx).toBe(entry.rootIdx);
      } else {
        expect(result.indexLemmas[entry.lemmaIdx].rootIdx).toBe(-1);
      }
    }
  });
});
