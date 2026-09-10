import { normalize } from "../../src/lib/arabic/normalize";
import type { CollocationsFile, VerbPrepositionRow } from "../../src/lib/data/types";
import type { RawWord } from "./parse-morphology";

/**
 * Canonical Arabic prepositions (حروف الجر), normalized key -> a
 * diacritized display form. Restricted to this list (rather than "any
 * rootless particle") so the result is genuinely about verb government
 * (valency), not diluted by conjunctions, negations, or interrogatives
 * that happen to follow a verb.
 */
const PREPOSITIONS: Record<string, string> = {
  ب: "بِ",
  ل: "لِ",
  ك: "كَ",
  من: "مِن",
  الي: "إِلَى", // إلى normalizes: إ->ا, ى->ي
  علي: "عَلَى", // على normalizes: ى->ي
  في: "فِي",
  عن: "عَن",
  مع: "مَعَ",
  حتي: "حَتَّى", // حتى normalizes: ى->ي
};

/**
 * For every verb occurrence, checks whether the very next word in the same
 * verse is (or begins with, since a one-letter preposition like بِ/لِ/كَ is
 * a proclitic fused onto its object as that word's first segment) one of
 * the canonical prepositions -- e.g. does آمن attach بِ or لِ, and how
 * often either way. This is verb valency/government, a real question in
 * Arabic grammar (a verb's meaning can shift with the preposition it
 * takes), which no per-root page currently surfaces.
 */
export function buildCollocations(words: readonly RawWord[]): CollocationsFile {
  const wordByPosition = new Map<string, RawWord>();
  for (const word of words) {
    wordByPosition.set(`${word.s}:${word.a}:${word.w}`, word);
  }

  const counts = new Map<string, number>(); // key: `${verbRootAr}|${prepositionKey}`

  for (const word of words) {
    for (const seg of word.segments) {
      if (seg.pos !== "V" || seg.root === null) continue;

      const nextWord = wordByPosition.get(`${word.s}:${word.a}:${word.w + 1}`);
      const firstSeg = nextWord?.segments[0];
      if (!firstSeg || firstSeg.pos !== "P" || firstSeg.lemma === null) continue;

      const prepKey = normalize(firstSeg.lemma);
      if (!(prepKey in PREPOSITIONS)) continue;

      const comboKey = `${seg.root}|${prepKey}`;
      counts.set(comboKey, (counts.get(comboKey) ?? 0) + 1);
    }
  }

  const verbPrepositions: VerbPrepositionRow[] = [...counts.entries()].map(([comboKey, count]) => {
    const [verbRootAr, prepositionKey] = comboKey.split("|");
    return { verbRootAr, prepositionKey, prepositionLemma: PREPOSITIONS[prepositionKey], count };
  });
  verbPrepositions.sort((a, b) => a.verbRootAr.localeCompare(b.verbRootAr) || b.count - a.count);

  return { verbPrepositions };
}
