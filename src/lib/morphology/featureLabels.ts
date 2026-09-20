/**
 * How each inflectional feature is named to a reader, in both languages.
 *
 * Extracted from the grammar browser's facet table so the word inspector
 * can name the same feature the same way. Two tables would drift, and a
 * reader who taps a word and reads "Accusative" should find that word
 * under the chip that says "Accusative".
 *
 * PERSON IS SHOWN AS A PRONOUN, which is the reasoning the facets already
 * carry: "3MS" is a tagset code, not a label, and the pronoun IS the
 * feature -- a verb tagged 3MS agrees with هو.
 */
export interface FeatureLabel {
  en: string;
  ar: string;
}

export const MOOD_LABELS: Record<string, FeatureLabel> = {
  IND: { en: "Indicative", ar: "مرفوع" },
  SUBJ: { en: "Subjunctive", ar: "منصوب" },
  JUS: { en: "Jussive", ar: "مجزوم" },
};

export const CASE_LABELS: Record<string, FeatureLabel> = {
  NOM: { en: "Nominative", ar: "مرفوع" },
  ACC: { en: "Accusative", ar: "منصوب" },
  GEN: { en: "Genitive", ar: "مجرور" },
};

export const DEFINITENESS_LABELS: Record<string, FeatureLabel> = {
  DET: { en: "Definite", ar: "معرفة" },
  INDEF: { en: "Indefinite", ar: "نكرة" },
};

/** Person-marked agreement: the pronoun the word agrees with. */
export const PGN_PERSON_LABELS: Record<string, FeatureLabel> = {
  "3MS": { en: "he", ar: "هو" },
  "3FS": { en: "she", ar: "هي" },
  "3MD": { en: "they two (m.)", ar: "هما (مذكر)" },
  "3FD": { en: "they two (f.)", ar: "هما (مؤنث)" },
  "3MP": { en: "they (m.)", ar: "هم" },
  "3FP": { en: "they (f.)", ar: "هنَّ" },
  "2MS": { en: "you (m. sg.)", ar: "أنتَ" },
  "2FS": { en: "you (f. sg.)", ar: "أنتِ" },
  "2MD": { en: "you two (m.)", ar: "أنتما (مذكر)" },
  "2FD": { en: "you two (f.)", ar: "أنتما (مؤنث)" },
  "2MP": { en: "you (m. pl.)", ar: "أنتم" },
  "2FP": { en: "you (f. pl.)", ar: "أنتنَّ" },
  "1S": { en: "I", ar: "أنا" },
  "1P": { en: "we", ar: "نحن" },
};

/** Person-less agreement: gender and number, as nominals carry them. */
export const PGN_AGREEMENT_LABELS: Record<string, FeatureLabel> = {
  MS: { en: "masculine singular", ar: "مذكر مفرد" },
  FS: { en: "feminine singular", ar: "مؤنث مفرد" },
  MD: { en: "masculine dual", ar: "مذكر مثنى" },
  FD: { en: "feminine dual", ar: "مؤنث مثنى" },
  MP: { en: "masculine plural", ar: "جمع مذكر" },
  FP: { en: "feminine plural", ar: "جمع مؤنث" },
  D: { en: "dual", ar: "مثنى" },
  P: { en: "plural", ar: "جمع" },
};

/** Either kind of person-gender-number tag, looked up by its corpus code. */
export function pgnLabel(code: string): FeatureLabel | undefined {
  return PGN_PERSON_LABELS[code] ?? PGN_AGREEMENT_LABELS[code];
}

/** The orders the facet browser teaches these in, kept beside the labels. */
export const PGN_PERSON_ORDER = Object.keys(PGN_PERSON_LABELS);
export const PGN_AGREEMENT_ORDER = Object.keys(PGN_AGREEMENT_LABELS);
