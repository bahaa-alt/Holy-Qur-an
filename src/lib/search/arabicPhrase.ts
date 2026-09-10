import { collapseRepeatedAlif, normalizeForPhraseSearch } from "@/lib/arabic/normalize";
import type { ArIndexFile } from "@/lib/data/types";

export interface PhraseMatch {
  /** stable global verse id, 0-based, in Quran order */
  globalId: number;
  /** 1-based index of the first matching word (matches Occurrence's `w`) */
  startW: number;
  /** 1-based index of the last matching word */
  endW: number;
}

/**
 * Splits a query into normalized word tokens, the same shape ar-index.json's
 * per-verse token arrays are built in, so the two are directly comparable.
 *
 * One extra step beyond plain per-word normalization: the vocative particle
 * "يا" is never its own token in the Uthmani script -- it is always written
 * fused onto the word it precedes (e.g. "يا أيها" is one word, يٰٓأَيُّهَا).
 * A query typed the ordinary way, as two separate words, is merged the same
 * way before matching: joined directly (no space) and re-collapsed, so
 * "يا أيها الناس" matches the single indexed token "يايها" + "الناس" instead
 * of never matching because ar-index.json has no standalone "يا".
 */
export function tokenizePhraseQuery(query: string): string[] {
  const words = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(normalizeForPhraseSearch);

  const merged: string[] = [];
  for (let i = 0; i < words.length; i++) {
    if (words[i] === "يا" && i + 1 < words.length) {
      merged.push(collapseRepeatedAlif(words[i] + words[i + 1]));
      i++;
    } else {
      merged.push(words[i]);
    }
  }
  return merged;
}

/**
 * Finds every verse containing `query` as a literal, contiguous run of
 * words (e.g. "يا أيها الناس") -- unlike root-adjacency search (/phrases/),
 * which matches root pairs regardless of the actual words used, this
 * matches the exact surface text a user types (after normalization: no
 * diacritics needed, alif/ya/ta-marbuta variants unified).
 *
 * A single-word query still works (matches every occurrence of that one
 * normalized word), but callers typically only need this for multi-word
 * queries -- a single Arabic word is better served by the existing
 * root/lemma/form suggestions in `suggest.ts`.
 */
export function searchArabicPhrase(query: string, arIndex: ArIndexFile): PhraseMatch[] {
  const qTokens = tokenizePhraseQuery(query);
  if (qTokens.length === 0) return [];

  const results: PhraseMatch[] = [];
  for (let globalId = 0; globalId < arIndex.length; globalId++) {
    const verseTokens = arIndex[globalId];
    const lastStart = verseTokens.length - qTokens.length;
    for (let start = 0; start <= lastStart; start++) {
      let matched = true;
      for (let k = 0; k < qTokens.length; k++) {
        if (verseTokens[start + k] !== qTokens[k]) {
          matched = false;
          break;
        }
      }
      if (matched) {
        results.push({ globalId, startW: start + 1, endW: start + qTokens.length });
      }
    }
  }
  return results;
}
