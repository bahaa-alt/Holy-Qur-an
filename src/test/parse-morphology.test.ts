import { describe, expect, it } from "vitest";
import { parseMorphologyTSV } from "../../scripts/lib/parse-morphology";

// Real excerpts pulled verbatim from quran-morphology.txt.
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

// 20:94:2 يَبْنَؤُمَّ -- the sole word in the corpus with two rooted segments,
// and includes a segment with an empty form (elided 1S pronoun suffix).
const DOUBLE_ROOT_WORD = [
  "20:94:2:1\tيَ\tP\tVOC|PREF|LEM:ي",
  "20:94:2:2\tبْنَ\tN\tROOT:بني|LEM:ابْن|M|ACC",
  "20:94:2:3\tؤُمَّ\tN\tROOT:أمم|LEM:أُمّ|FS|GEN",
  "20:94:2:4\t\tN\tPRON|SUFF|1S",
].join("\n");

describe("parseMorphologyTSV", () => {
  it("groups segments into words and reconstructs 1:1 exactly", () => {
    const words = parseMorphologyTSV(AYAH_1_1);
    expect(words).toHaveLength(4);
    expect(words.map((w) => w.text)).toEqual(["بِسْمِ", "ٱللَّهِ", "ٱلرَّحْمَٰنِ", "ٱلرَّحِيمِ"]);
    // joining all words with spaces reproduces the whole verse
    expect(words.map((w) => w.text).join(" ")).toBe("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ");
  });

  it("assigns s/a/w consistently across a word's segments", () => {
    const words = parseMorphologyTSV(AYAH_1_1);
    for (const word of words) {
      expect(word.segments.every((seg) => seg.s === word.s && seg.a === word.a && seg.w === word.w)).toBe(
        true,
      );
    }
    expect(words[2]).toMatchObject({ s: 1, a: 1, w: 3 });
  });

  it("extracts ROOT and LEM into dedicated fields, leaving the rest as tags", () => {
    const words = parseMorphologyTSV(KATABA_ROWS);
    // word 2:2:2 is "ٱلْكِتَٰبُ" (DET clitic + noun stem, two segments of one word)
    const alKitabu = words.find((w) => w.text === "ٱلْكِتَٰبُ")!;
    const stemSeg = alKitabu.segments.find((s) => s.root !== null)!;
    expect(stemSeg).toMatchObject({
      form: "كِتَٰبُ",
      root: "كتب",
      lemma: "كِتاب",
      pos: "N",
      tags: ["M", "NOM"],
    });

    const yaktubuna = words.find((w) => w.text.startsWith("يَكْتُبُ"))!;
    const verbStem = yaktubuna.segments.find((s) => s.root !== null)!;
    expect(verbStem).toMatchObject({
      root: "كتب",
      lemma: "كَتَبَ",
      pos: "V",
      tags: ["IMPF", "VF:1", "3MP", "MOOD:IND"],
    });
  });

  it("keeps a DET/PREF clitic as its own rootless segment within the same word", () => {
    const words = parseMorphologyTSV(KATABA_ROWS);
    const alKitabu = words.find((w) => w.text === "ٱلْكِتَٰبُ")!;
    expect(alKitabu.segments).toHaveLength(2);
    expect(alKitabu.segments[0]).toMatchObject({ form: "ٱلْ", root: null, pos: "P" });
    expect(alKitabu.segments[1]).toMatchObject({ form: "كِتَٰبُ", root: "كتب" });
  });

  it("handles the one word with two rooted segments (20:94:2)", () => {
    const words = parseMorphologyTSV(DOUBLE_ROOT_WORD);
    expect(words).toHaveLength(1);
    const word = words[0];
    expect(word.text).toBe("يَبْنَؤُمَّ");
    const rooted = word.segments.filter((s) => s.root !== null);
    expect(rooted.map((s) => s.root)).toEqual(["بني", "أمم"]);
  });

  it("handles a segment with an empty form (elided pronoun)", () => {
    const words = parseMorphologyTSV(DOUBLE_ROOT_WORD);
    const lastSegment = words[0].segments.at(-1)!;
    expect(lastSegment.form).toBe("");
    expect(lastSegment.tags).toEqual(["PRON", "SUFF", "1S"]);
  });

  it("throws on a malformed line", () => {
    expect(() => parseMorphologyTSV("not-a-valid-line")).toThrow();
    expect(() => parseMorphologyTSV("1:1:1\tform\tN\tROOT:x")).toThrow();
  });

  it("skips blank lines", () => {
    const words = parseMorphologyTSV(`${AYAH_1_1}\n\n`);
    expect(words).toHaveLength(4);
  });
});
