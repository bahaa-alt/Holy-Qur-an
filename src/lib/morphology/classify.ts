import type { Cat } from "@/lib/data/types";

/**
 * Maps a rooted morphological segment's tag set to a display category.
 *
 * Applied only to segments that carry a ROOT (see scripts/lib/parse-morphology.ts);
 * rootless segments (particles, pronouns, clitics) never reach this function.
 *
 * Mapping rules (in order):
 *  1. POS "V": PERF -> verb.perf, IMPF -> verb.impf, IMPV -> verb.impv.
 *  2. Otherwise: PN -> properNoun, ACT_PCPL -> actPcpl, PASS_PCPL -> passPcpl,
 *     VN -> verbalNoun, ADJ -> adj, else -> noun.
 *  3. Anything left unmatched -> other.
 */
export function classify(pos: string, tags: readonly string[]): Cat {
  const tagSet = new Set(tags);

  if (pos === "V") {
    if (tagSet.has("PERF")) return "verb.perf";
    if (tagSet.has("IMPF")) return "verb.impf";
    if (tagSet.has("IMPV")) return "verb.impv";
    return "other";
  }

  if (tagSet.has("PN")) return "properNoun";
  if (tagSet.has("ACT_PCPL")) return "actPcpl";
  if (tagSet.has("PASS_PCPL")) return "passPcpl";
  if (tagSet.has("VN")) return "verbalNoun";
  if (tagSet.has("ADJ")) return "adj";
  if (pos === "N") return "noun";

  return "other";
}

/**
 * Extracts the verb Form (I-XI) from a tag list, e.g. "VF:4" -> "IV".
 * Returns null when no VF tag is present (i.e. the word is not a verb, or
 * is a bare/Form-I verb without an explicit VF tag in the source data).
 */
const ROMAN_FORMS: Record<string, string> = {
  "1": "I",
  "2": "II",
  "3": "III",
  "4": "IV",
  "5": "V",
  "6": "VI",
  "7": "VII",
  "8": "VIII",
  "9": "IX",
  "10": "X",
  "11": "XI",
};

export function extractVerbForm(tags: readonly string[]): string | null {
  for (const tag of tags) {
    if (tag.startsWith("VF:")) {
      const n = tag.slice("VF:".length);
      return ROMAN_FORMS[n] ?? `Form ${n}`;
    }
  }
  return null;
}

/** Extracts the MOOD tag value (IND/JUS/SUBJ), if present. */
export function extractMood(tags: readonly string[]): string | null {
  for (const tag of tags) {
    if (tag.startsWith("MOOD:")) return tag.slice("MOOD:".length);
  }
  return null;
}
