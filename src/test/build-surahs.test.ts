import { describe, expect, it } from "vitest";
import { parseMorphologyTSV } from "../../scripts/lib/parse-morphology";
import { buildSurahs, type QuranJsonChapter } from "../../scripts/lib/build-surahs";

const AYAH_1_1 = [
  "1:1:1:1\tبِ\tP\tP|PREF|LEM:ب",
  "1:1:1:2\tسْمِ\tN\tROOT:سمو|LEM:اسْم|M|GEN",
  "1:1:2:1\tٱللَّهِ\tN\tPN|ROOT:أله|LEM:اللَّه|GEN",
  "1:1:3:1\tٱل\tP\tDET|PREF|LEM:ال",
  "1:1:3:2\tرَّحْمَٰنِ\tN\tROOT:رحم|LEM:رَحْمٰن|MS|GEN|ADJ",
  "1:1:4:1\tٱل\tP\tDET|PREF|LEM:ال",
  "1:1:4:2\tرَّحِيمِ\tN\tROOT:رحم|LEM:رَحِيم|MS|GEN|ADJ",
].join("\n");

// A second verse where the morphology reconstructs 3 words but the (fabricated)
// quran-json text has only 2 whitespace tokens -- an intentional mismatch.
const AYAH_1_2_MISMATCH = [
  "1:2:1:1\tٱلْحَمْدُ\tN\tROOT:حمد|LEM:حَمْد|M|NOM",
  "1:2:2:1\tلِلَّهِ\tN\tPN|ROOT:أله|LEM:اللَّه|GEN",
  "1:2:3:1\tرَبِّ\tN\tROOT:ربب|LEM:رَبّ|M|GEN",
].join("\n");

function chapter(): QuranJsonChapter {
  return {
    id: 1,
    name: "الفاتحة",
    transliteration: "Al-Fatihah",
    translation: "The Opener",
    type: "meccan",
    total_verses: 2,
    verses: [
      {
        id: 1,
        text: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
        translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful",
        transliteration: "",
      },
      {
        id: 2,
        // deliberately only 2 tokens, vs 3 morphology words -> triggers fallback
        text: "شيء آخر",
        translation: "[All] praise is [due] to Allah, Lord of the worlds",
        transliteration: "",
      },
    ],
  };
}

describe("buildSurahs", () => {
  const words = [...parseMorphologyTSV(AYAH_1_1), ...parseMorphologyTSV(AYAH_1_2_MISMATCH)];
  const { surahFiles, meta, mismatches } = buildSurahs(words, [chapter()]);

  it("uses canonical quran-json tokens when the word count matches", () => {
    const surah = surahFiles.get(1)!;
    const verse1 = surah.verses.find((v) => v.a === 1)!;
    expect(verse1.w).toEqual(["بِسْمِ", "ٱللَّهِ", "ٱلرَّحْمَٰنِ", "ٱلرَّحِيمِ"]);
    expect(verse1.m).toBeUndefined();
    expect(verse1.t).toBe("In the name of Allah, the Entirely Merciful, the Especially Merciful");
  });

  it("falls back to morphology-reconstructed tokens on a count mismatch", () => {
    const surah = surahFiles.get(1)!;
    const verse2 = surah.verses.find((v) => v.a === 2)!;
    expect(verse2.w).toEqual(["ٱلْحَمْدُ", "لِلَّهِ", "رَبِّ"]);
    expect(verse2.m).toBe(1);
    // translation is still taken from quran-json even on a token mismatch
    expect(verse2.t).toBe("[All] praise is [due] to Allah, Lord of the worlds");
  });

  it("records the mismatch with both word counts", () => {
    expect(mismatches).toEqual([{ s: 1, a: 2, morphN: 3, jsonN: 2 }]);
  });

  it("builds surah metadata from the chapter header fields", () => {
    expect(meta.surahs).toEqual([
      { n: 1, nameAr: "الفاتحة", nameEn: "The Opener", translit: "Al-Fatihah", type: "meccan", ayahs: 2 },
    ]);
  });

  it("attaches Pickthall's translation where the map has an entry, and omits it entirely otherwise", () => {
    const pickthallByRef = new Map([["1:1", "In the name of Allah, the Beneficent, the Merciful"]]);
    const { surahFiles: sf } = buildSurahs(words, [chapter()], pickthallByRef);
    const verse1 = sf.get(1)!.verses.find((v) => v.a === 1)!;
    const verse2 = sf.get(1)!.verses.find((v) => v.a === 2)!;
    expect(verse1.pickthall).toBe("In the name of Allah, the Beneficent, the Merciful");
    expect(verse2.pickthall).toBeUndefined();
    expect("pickthall" in verse2).toBe(false);
  });

  it("emits every verse even when a verse has no morphology words at all", () => {
    const emptyChapter: QuranJsonChapter = {
      ...chapter(),
      total_verses: 1,
      verses: [{ id: 1, text: "test verse", translation: "t", transliteration: "" }],
    };
    const { surahFiles: sf, mismatches: mm } = buildSurahs([], [emptyChapter]);
    const verse = sf.get(1)!.verses[0];
    expect(verse.w).toEqual([]);
    expect(verse.m).toBe(1);
    expect(mm).toEqual([{ s: 1, a: 1, morphN: 0, jsonN: 2 }]);
  });
});
