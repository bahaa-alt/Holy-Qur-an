import { stripDiacritics } from "./normalize";

// The Arabic letters this app's Uthmani text actually uses: the standard
// alphabet (hamza U+0621 .. ya U+064A) plus alef wasla (ٱ, U+0671), which
// opens words like ٱلرَّحۡمَٰنِ constantly in this script. Anything else
// left after stripDiacritics() (spaces, Latin, punctuation) is not a letter.
const ARABIC_LETTER = /[ء-يٱ]/;

export interface LetterCount {
  letter: string;
  count: number;
}

/**
 * Tallies how often each Arabic letter appears across `texts` (whole verse
 * strings or word tokens -- anything with diacritics still attached, since
 * this strips them itself). Deliberately does NOT unify letter variants
 * the way {@link normalize} does for search: ة and ه, or ا and أ/إ/آ/ٱ, are
 * counted separately, since a letter-frequency table is exactly where that
 * distinction is the point. Returns rows sorted by count desc, then by
 * letter (stable order for a tie), omitting letters that never occur.
 */
export function countLetters(texts: readonly string[]): LetterCount[] {
  const counts = new Map<string, number>();

  for (const text of texts) {
    for (const ch of stripDiacritics(text)) {
      if (ARABIC_LETTER.test(ch)) {
        counts.set(ch, (counts.get(ch) ?? 0) + 1);
      }
    }
  }

  return [...counts.entries()]
    .map(([letter, count]) => ({ letter, count }))
    .sort((a, b) => b.count - a.count || a.letter.localeCompare(b.letter));
}

/** Counts how many Arabic letters (diacritics excluded) are in one piece of text -- e.g. to find the longest word. */
export function letterCountOf(text: string): number {
  let count = 0;
  for (const ch of stripDiacritics(text)) {
    if (ARABIC_LETTER.test(ch)) count++;
  }
  return count;
}
