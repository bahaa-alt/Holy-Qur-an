/**
 * Lightweight, deterministic English tokenizer + suffix stemmer shared
 * between the build-time inverted-index builder and the runtime search
 * query path. Not a linguistically complete stemmer (no Porter algorithm) —
 * just enough suffix folding to raise recall ("believe"/"believes"/
 * "believing" collapsing together) while staying dependency-free and fast.
 */

export const STOPWORDS: ReadonlySet<string> = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
  "any", "are", "as", "at", "be", "because", "been", "before", "being",
  "below", "between", "both", "but", "by", "did", "do", "does", "doing",
  "down", "during", "each", "few", "for", "from", "further", "had", "has",
  "have", "having", "he", "her", "here", "hers", "herself", "him", "himself",
  "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just",
  "me", "more", "most", "my", "myself", "no", "nor", "not", "of", "off",
  "on", "once", "only", "or", "other", "our", "ours", "ourselves", "out",
  "over", "own", "same", "she", "should", "so", "some", "such", "than",
  "that", "the", "their", "theirs", "them", "themselves", "then", "there",
  "these", "they", "this", "those", "through", "to", "too", "under", "until",
  "up", "very", "was", "we", "were", "what", "when", "where", "which",
  "while", "who", "whom", "why", "will", "with", "you", "your", "yours",
  "yourself", "yourselves",
]);

/**
 * Folds common English suffixes to raise recall. Applies a single pass of
 * ordered, length-guarded rules; the result of stemming an already-stemmed
 * word is the word itself (idempotent).
 */
export function stem(wordRaw: string): string {
  let w = wordRaw.toLowerCase();

  if (w.length <= 3) return w;

  if (w.endsWith("'s")) w = w.slice(0, -2);
  if (w.length <= 3) return w;

  if (w.length > 4 && w.endsWith("edly")) {
    w = w.slice(0, -4);
  } else if (w.length > 4 && w.endsWith("ing")) {
    w = w.slice(0, -3);
  } else if (w.length > 3 && w.endsWith("ed")) {
    w = w.slice(0, -2);
  }
  if (w.length <= 3) return w;

  if (w.length > 4 && w.endsWith("ly")) {
    w = w.slice(0, -2);
  }
  if (w.length <= 3) return w;

  if (w.length > 3 && w.endsWith("ies")) {
    w = w.slice(0, -3) + "y";
  } else if (w.length > 3 && w.endsWith("es")) {
    w = w.slice(0, -2);
  } else if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) {
    w = w.slice(0, -1);
  }

  return w;
}

const WORD_SPLIT = /[^a-z0-9']+/;

/**
 * Tokenizes English text into lowercase, stopword-filtered, stemmed terms.
 * Used identically at build time (indexing verse translations) and at
 * query time (the last term of the user's search string).
 */
export function tokenizeEnglish(text: string): string[] {
  return text
    .toLowerCase()
    .split(WORD_SPLIT)
    .map((w) => w.replace(/^'+|'+$/g, ""))
    .filter((w) => w.length > 0 && !STOPWORDS.has(w))
    .map(stem);
}
