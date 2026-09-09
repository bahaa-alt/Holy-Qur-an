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
 * Normalize a root for use as its index/lookup key. Same as {@link normalize}
 * but additionally folds standalone hamza (ء) to alif (ا), so that a root
 * written with a bare hamza segment resolves under a plain-alif query too.
 * Callers building the root index must verify no two distinct roots collapse
 * to the same key (the build pipeline asserts this and fails loudly if so).
 */
export function normalizeRootKey(root: string): string {
  return normalize(root).replace(HAMZA, "ا");
}

/**
 * If `text` contains a dagger alif (e.g. رَحْمَٰن), returns an alternate
 * normalized key with the dagger alif rendered as a full alif instead of
 * stripped (so both رحمن and رحمان resolve to the same entry). Returns
 * `null` when there is no dagger alif to disambiguate.
 */
export function altKeyFor(text: string): string | null {
  if (!DAGGER_ALIF.test(text)) return null;
  DAGGER_ALIF.lastIndex = 0;
  return normalize(text.replace(DAGGER_ALIF, "ا"));
}

/** True if `text` contains any Arabic-block character. */
export function isArabic(text: string): boolean {
  return ARABIC_BLOCK.test(text);
}
