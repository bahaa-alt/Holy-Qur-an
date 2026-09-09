/** The 28-letter Arabic alphabet in traditional dictionary order (ا–ي). */
export const ARABIC_ALPHABET = [
  "ا", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", "س", "ش", "ص", "ض",
  "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ن", "ه", "و", "ي",
];

const LETTER_ORDER = new Map(ARABIC_ALPHABET.map((letter, i) => [letter, i]));

/**
 * Compares two strings in traditional Arabic dictionary order. Expects
 * already-normalized input (see normalizeRootKey/normalize) -- a hamza
 * carrier like أ has its own Unicode codepoint and is not itself in
 * ARABIC_ALPHABET, so an un-normalized root would sort by the fallback
 * rule below instead of alongside plain ا.
 */
export function compareArabic(a: string, b: string): number {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const oa = LETTER_ORDER.get(a[i]) ?? 99;
    const ob = LETTER_ORDER.get(b[i]) ?? 99;
    if (oa !== ob) return oa - ob;
  }
  return a.length - b.length;
}
