/**
 * Arabic text normalization shared between the build-time data pipeline and
 * the runtime search index. One implementation, unit-tested, so normalized
 * keys always match between what is built and what is searched.
 *
 * Codepoints are written as explicit \u escapes (not literal Arabic glyphs)
 * so ranges are unambiguous to read and verify regardless of editor
 * bidi/RTL rendering.
 */

// Arabic combining marks: honorific signs, small high marks (fatha, damma,
// kasra, sukun, shadda, etc.), and Qur'anic annotation signs. Deliberately
// excludes U+0670 (dagger alif), which needs different handling below.
const TASHKEEL_RANGE = /[ؐ-ًؚ-ٟۖ-ۭ]/g;
// Arabic letter superscript alef ("dagger alif"), e.g. in رَحْمَٰن
const DAGGER_ALIF = /ٰ/g;
// Tatweel / kashida (elongation character)
const TATWEEL = /ـ/g;

// آ (0622) أ (0623) إ (0625) ٱ (0671) -> ا (0627)
const ALIF_VARIANTS = /[آأإٱ]/g;
// ى (0649, alef maksura) -> ي (064A)
const ALIF_MAKSURA = /ى/g;
// ة (0629, teh marbuta) -> ه (0647)
const TEH_MARBUTA = /ة/g;
// ء (0621, standalone hamza) -> ا (0627), root keys only
const HAMZA = /ء/g;

const ARABIC_BLOCK = /[؀-ۿ]/;

/**
 * Normalize Arabic text for use as a search/index key: strips all
 * diacritics (tashkeel + dagger alif + tatweel) and unifies letter variants
 * that users routinely conflate when typing (alif forms, alif maksura vs
 * ya, teh marbuta vs ha). Hamza carriers ء ؤ ئ are left untouched on word
 * forms — see {@link normalizeRootKey} for the root-specific exception.
 */
export function normalize(text: string): string {
  return text
    .replace(TASHKEEL_RANGE, "")
    .replace(DAGGER_ALIF, "")
    .replace(TATWEEL, "")
    .replace(ALIF_VARIANTS, "ا") // -> ا
    .replace(ALIF_MAKSURA, "ي") // -> ي
    .replace(TEH_MARBUTA, "ه"); // -> ه
}

/**
 * Strips diacritics (tashkeel, dagger alif, tatweel) but preserves every
 * letter distinction {@link normalize} unifies for search matching (alif
 * variants, teh marbuta vs ha, alif maksura vs ya, hamza carriers). Used
 * for letter-frequency analysis, where those distinctions are exactly what
 * is being counted.
 */
export function stripDiacritics(text: string): string {
  return text.replace(TASHKEEL_RANGE, "").replace(DAGGER_ALIF, "").replace(TATWEEL, "");
}

/**
 * Normalize a root for use as its index/lookup key. Same as {@link normalize}
 * but additionally folds standalone hamza (ء) to alif (ا), so that a root
 * written with a bare hamza segment resolves under a plain-alif query too.
 * Callers building the root index must verify no two distinct roots collapse
 * to the same key (the build pipeline asserts this and fails loudly if so).
 */
export function normalizeRootKey(root: string): string {
  return normalize(root).replace(HAMZA, "ا");
}

// Alif maksura (ى) directly followed by a dagger alif, e.g. عَلَىٰ/إِلَىٰ.
// Here the dagger alif marks that already-final ى as long ("ilā" not
// "ila") -- it is not a separate elided letter the way a dagger alif on a
// consonant is (ٱلْعَٰلَمِينَ's عَٰ), so it must NOT be expanded into an extra
// alif (that would wrongly turn إِلَىٰ into "اليا" instead of "الي", a form
// nobody would ever type -- see altKeyFor).
const ALIF_MAKSURA_DAGGER_ALIF = /ىٰ/g;

/**
 * If `text` contains a dagger alif (e.g. رَحْمَٰن), returns an alternate
 * normalized key with the dagger alif rendered as a full alif instead of
 * stripped (so both رحمن and رحمان resolve to the same entry). Returns
 * `null` when there is no dagger alif to disambiguate.
 *
 * A dagger alif directly after alif maksura (ىٰ, e.g. عَلَىٰ) is dropped
 * instead of expanded (see {@link ALIF_MAKSURA_DAGGER_ALIF}) -- everywhere
 * else (a dagger alif on a consonant) it's still expanded to ا as before.
 */
export function altKeyFor(text: string): string | null {
  if (!DAGGER_ALIF.test(text)) return null;
  DAGGER_ALIF.lastIndex = 0;
  const withoutMaksuraDagger = text.replace(ALIF_MAKSURA_DAGGER_ALIF, "ى");
  return normalize(withoutMaksuraDagger.replace(DAGGER_ALIF, "ا"));
}

/** True if `text` contains any Arabic-block character. */
export function isArabic(text: string): boolean {
  return ARABIC_BLOCK.test(text);
}

// Every hamza carrier (ء ؤ ئ), folded to ا for phrase search only -- see
// normalizeForPhraseSearch below for why this needs to be more aggressive
// than normalizeRootKey's hamza fold (which only covers standalone ء).
const HAMZA_CARRIERS = /[ءؤئ]/g;
// Two-or-more alifs in a row, collapsed to one. Arises legitimately when
// normalizeForPhraseSearch's hamza fold turns e.g. "ءا" into "اا", or when
// phrase search concatenates a vocative "يا" directly onto a following
// alif-initial word (see arabicPhrase.ts) -- never from ordinary text.
const REPEATED_ALIF = /ا{2,}/g;

/**
 * Normalizes text for LITERAL phrase/sentence search matching only (see
 * src/lib/search/arabicPhrase.ts) -- never for root/lemma/form keys, where
 * a hamza carrier's exact letter and a dagger alif's exact presence can be
 * meaningful. Phrase search only cares whether two spellings a user might
 * reasonably type denote the same running text, so this is deliberately
 * more aggressive than {@link normalize} in two ways:
 *
 * 1. Expands a dagger alif to a full alif (via {@link altKeyFor}) rather
 *    than stripping it, since the Uthmani script often represents a vowel
 *    that a typed query spells with an ordinary alif (e.g. the Qur'anic
 *    ٱلْعَٰلَمِينَ vs. a plainly-typed العالمين) as a dagger-alif diacritic
 *    instead of a letter.
 * 2. Folds every hamza carrier (ء ؤ ئ, not just standalone ء) to ا, then
 *    collapses any resulting run of 2+ alifs to one. Combined with (1),
 *    this reconciles spellings like ءامنوا/آمنوا/امنوا (a hamza-seat
 *    letter, a madda-alif, or a bare alif for the same sound) to one key.
 */
export function normalizeForPhraseSearch(text: string): string {
  const expanded = altKeyFor(text) ?? normalize(text);
  return expanded.replace(HAMZA_CARRIERS, "ا").replace(REPEATED_ALIF, "ا");
}

/**
 * Collapses a run of 2+ alifs to one. Exposed for arabicPhrase.ts: joining
 * two already-{@link normalizeForPhraseSearch}'d words directly (merging a
 * vocative "يا" onto the word it precedes) can produce a fresh double-alif
 * at the join that per-word normalization couldn't have caught.
 */
export function collapseRepeatedAlif(text: string): string {
  return text.replace(REPEATED_ALIF, "ا");
}
