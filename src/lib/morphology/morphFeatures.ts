/**
 * The inflectional feature vocabularies, and the order their ids follow.
 *
 * A value's position here IS its id in MorphologyIndexFile (1-based; 0 means
 * the segment has no value for that feature). Reordering any array
 * invalidates every shipped index, so these are append-only in practice.
 *
 * Lives in src/ rather than beside the build script for the same reason
 * syntaxTags.ts does: the pipeline writes the index, the QCQL parser
 * validates queries against the same vocabulary, and the browse UI labels
 * it. One definition, three consumers.
 */

/** Grammatical case, on nominals. */
export const MORPH_CASES = ["NOM", "ACC", "GEN"] as const;
export type MorphCase = (typeof MORPH_CASES)[number];

/**
 * Mood, on imperfect verbs only.
 *
 * A perfect verb has none -- it is not "indicative by default", the corpus
 * simply does not mark mood there, and a filter that pretended otherwise
 * would invent 9,153 indicatives.
 */
export const MORPH_MOODS = ["IND", "SUBJ", "JUS"] as const;
export type MorphMood = (typeof MORPH_MOODS)[number];

/**
 * Definiteness.
 *
 * DET sits on the ال PREFIX segment, which carries no root, while INDEF
 * sits on the noun itself. They are therefore not two values of one feature
 * on one segment -- which is why the index keeps rootless segments, and why
 * a query for definite nouns matches at word granularity.
 */
export const MORPH_DEFINITENESS = ["DET", "INDEF"] as const;
export type MorphDefiniteness = (typeof MORPH_DEFINITENESS)[number];

/**
 * Person-gender-number, as the corpus writes it: an optional person digit,
 * an optional gender letter, then a required number letter.
 *
 * Matches 3MS, 2FP, 1P, MP, FS, D and the rest -- 24 distinct combinations
 * in this corpus. Anchored, so it cannot match a substring of some longer
 * tag that happens to end in S, D or P.
 */
export const PGN_PATTERN = /^([123])?([MF])?([SDP])$/;
