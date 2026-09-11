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
 *
 * Also computes each combo's PMI (log2 pointwise mutual information) over
 * the space of tracked-verb occurrences that have any following word at
 * all -- raw count alone is biased toward simply-frequent verbs and
 * prepositions (ب, being the most common preposition, would top nearly
 * every verb's list by count regardless of any real grammatical affinity);
 * PMI instead asks whether this specific pairing is more common than each
 * side's own frequency in that space would predict.
 */
export function buildCollocations(words: readonly RawWord[]): CollocationsFile {
  const wordByPosition = new Map<string, RawWord>();
  for (const word of words) {
    wordByPosition.set(`${word.s}:${word.a}:${word.w}`, word);
  }

  const counts = new Map<string, number>(); // key: `${verbRootAr}|${prepositionKey}`
  const refsByCombo = new Map<string, { s: number; a: number; w: number }[]>();
  // Per-verb-root and per-preposition totals within the "opportunity" space
  // (tracked-verb occurrences that have any next word, not just ones
  // followed by a tracked preposition) -- the denominators PMI needs.
  const verbTotalWithNext = new Map<string, number>();
  const prepGlobalTotal = new Map<string, number>();
  let totalWithNext = 0;

  for (const word of words) {
    for (const seg of word.segments) {
      if (seg.pos !== "V" || seg.root === null) continue;

      const nextWord = wordByPosition.get(`${word.s}:${word.a}:${word.w + 1}`);
      if (!nextWord) continue;

      verbTotalWithNext.set(seg.root, (verbTotalWithNext.get(seg.root) ?? 0) + 1);
      totalWithNext++;

      const firstSeg = nextWord.segments[0];
      if (!firstSeg || firstSeg.pos !== "P" || firstSeg.lemma === null) continue;

      const prepKey = normalize(firstSeg.lemma);
      if (!(prepKey in PREPOSITIONS)) continue;

      const comboKey = `${seg.root}|${prepKey}`;
      counts.set(comboKey, (counts.get(comboKey) ?? 0) + 1);
      prepGlobalTotal.set(prepKey, (prepGlobalTotal.get(prepKey) ?? 0) + 1);
      let refs = refsByCombo.get(comboKey);
      if (!refs) {
        refs = [];
        refsByCombo.set(comboKey, refs);
      }
      refs.push({ s: word.s, a: word.a, w: word.w });
    }
  }

  const verbPrepositions: VerbPrepositionRow[] = [...counts.entries()].map(([comboKey, count]) => {
    const [verbRootAr, prepositionKey] = comboKey.split("|");
    const verbTotal = verbTotalWithNext.get(verbRootAr)!;
    const prepTotal = prepGlobalTotal.get(prepositionKey)!;
    const pmi = Math.log2((count * totalWithNext) / (verbTotal * prepTotal));
    return {
      verbRootAr,
      prepositionKey,
      prepositionLemma: PREPOSITIONS[prepositionKey],
      count,
      pmi,
      refs: refsByCombo.get(comboKey)!,
    };
  });
  verbPrepositions.sort((a, b) => a.verbRootAr.localeCompare(b.verbRootAr) || b.count - a.count);

  return { verbPrepositions };
}
