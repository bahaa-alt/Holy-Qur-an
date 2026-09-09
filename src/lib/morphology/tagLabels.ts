/**
 * Human-readable (English + Arabic) labels for the raw morphological tag
 * vocabulary used throughout the app's "tags" chips (e.g. on FormsTable and
 * AyahExplorer). Arabic labels are drawn from morphology-terms-ar.json in
 * the same corpus this app's morphology data comes from
 * (github.com/mustafa0x/quran-morphology); English labels are hand-written
 * glosses for the same tag set. This file is committed directly rather than
 * fetched at build time -- it is small and static.
 */

import { ROMAN_FORMS } from "./classify";

export interface TagLabel {
  en: string;
  ar: string;
}

/** Flat map of single bare tags (POS letters, particle roles, grammar, etc.) */
const TAG_LABELS: Record<string, TagLabel> = {
  // --- part of speech ---
  N: { en: "Noun", ar: "اسم" },
  V: { en: "Verb", ar: "فعل" },
  P: { en: "Preposition", ar: "حرف جر" },
  PN: { en: "Proper noun", ar: "علم" },
  DEM: { en: "Demonstrative", ar: "اسم اشارة" },
  REL: { en: "Relative pronoun", ar: "اسم موصول" },
  T: { en: "Time adverb", ar: "ظرف زمان" },
  LOC: { en: "Place adverb", ar: "ظرف مكان" },
  NV: { en: "Verbal noun (particle)", ar: "اسم فعل" },
  COND: { en: "Conditional particle", ar: "شرطية" },
  INTG: { en: "Interrogative particle", ar: "استفهامية" },

  // --- particles ---
  EMPH: { en: "Emphatic lam", ar: "لام التوكيد" },
  IMPV: { en: "Imperative", ar: "أمر" },
  PRP: { en: "Purpose lam", ar: "لام التعليل" },
  CONJ: { en: "Coordinating conjunction", ar: "حرف عطف" },
  SUB: { en: "Subordinating particle", ar: "حرف مصدري" },
  ACC: { en: "Accusative", ar: "منصوب" },
  AMD: { en: "Concessive particle", ar: "حرف استدراك" },
  ANS: { en: "Answer particle", ar: "حرف جواب" },
  AVR: { en: "Aversion particle", ar: "حرف ردع" },
  CAUS: { en: "Causative particle", ar: "حرف سببية" },
  CERT: { en: "Particle of certainty", ar: "حرف تحقيق" },
  CIRC: { en: "Circumstantial particle", ar: "حرف حال" },
  COM: { en: "Comitative waw", ar: "واو المعية" },
  EQ: { en: "Equalizing particle", ar: "حرف تسوية" },
  EXH: { en: "Exhortation particle", ar: "حرف تحضيض" },
  EXL: { en: "Explanation particle", ar: "حرف تفصيل" },
  EXP: { en: "Exceptive particle", ar: "أداة استثناء" },
  FUT: { en: "Future particle", ar: "حرف استقبال" },
  INC: { en: "Inceptive particle", ar: "حرف ابتداء" },
  INT: { en: "Interpretive particle", ar: "حرف تفسير" },
  NEG: { en: "Negative particle", ar: "حرف نفي" },
  PREV: { en: "Preventive particle", ar: "حرف كاف" },
  PRO: { en: "Prohibition particle", ar: "حرف نهي" },
  REM: { en: "Resumption particle", ar: "حرف استئنافية" },
  RES: { en: "Restriction particle", ar: "أداة حصر" },
  RET: { en: "Retraction particle", ar: "حرف اضراب" },
  RSLT: { en: "Result particle", ar: "حرف واقع في جواب الشرط" },
  SUP: { en: "Supplemental particle", ar: "حرف زائد" },
  SUR: { en: "Surprise particle", ar: "حرف فجاءة" },
  VOC: { en: "Vocative particle", ar: "حرف نداء" },
  ATT: { en: "Attention particle", ar: "حرف تنبيه" },
  DIST: { en: "Distant lam", ar: "لام البعد" },
  ADDR: { en: "Addressee particle", ar: "حرف خطاب" },
  INL: { en: "Inline/connecting particle", ar: "حروف مقطعة" },

  // --- noun derivational forms ---
  ACT_PCPL: { en: "Active participle", ar: "اسم فاعل" },
  PASS_PCPL: { en: "Passive participle", ar: "اسم مفعول" },
  VN: { en: "Verbal noun", ar: "مصدر" },

  // --- noun grammatical case ---
  NOM: { en: "Nominative", ar: "مرفوع" },
  GEN: { en: "Genitive", ar: "مجرور" },

  // --- other attributes ---
  ADJ: { en: "Adjective", ar: "نعت" },
  INDEF: { en: "Indefinite", ar: "نكرة" },
  PASS: { en: "Passive voice", ar: "لم يسمّ فاعله" },
  DET: { en: "Determiner (al-)", ar: "أل التعريف" },
  PREF: { en: "Prefixed clitic", ar: "بادئة" },
  SUFF: { en: "Suffixed clitic", ar: "لاحقة" },
  PRON: { en: "Pronoun", ar: "ضمير" },

  // --- verb tense/aspect ---
  PERF: { en: "Perfect (past)", ar: "ماض" },
  IMPF: { en: "Imperfect (present/future)", ar: "مضارع" },

  // --- verb mood ---
  IND: { en: "Indicative mood", ar: "مرفوع" },
  SUBJ: { en: "Subjunctive mood", ar: "منصوب" },
  JUS: { en: "Jussive mood", ar: "مجزوم" },
};

const KEY_LABELS: Record<string, TagLabel> = {
  ROOT: { en: "Root", ar: "الجذر" },
  LEM: { en: "Lemma", ar: "الصيغة" },
  MOOD: { en: "Mood", ar: "الإعراب" },
  VF: { en: "Verb form", ar: "باب الفعل" },
  FAM: { en: "Verb family", ar: "الأسرة" },
};

/** Values of the FAM: tag -- the three "sisters" families in Arabic grammar. */
const FAM_VALUE_LABELS: Record<string, TagLabel> = {
  إِنّ: { en: "sisters of inna (particles governing the accusative)", ar: "أخوات إنّ" },
  كَان: { en: "sisters of kana (deficient/copular verbs)", ar: "أخوات كان" },
  كَاد: { en: "sisters of kada (verbs of proximity/hope/inception)", ar: "أخوات كاد" },
};

const PERSON: Record<string, TagLabel> = {
  "1": { en: "1st person", ar: "متكلم" },
  "2": { en: "2nd person", ar: "مخاطب" },
  "3": { en: "3rd person", ar: "غائب" },
};
const GENDER: Record<string, TagLabel> = {
  M: { en: "masculine", ar: "مذكر" },
  F: { en: "feminine", ar: "مؤنث" },
};
const NUMBER: Record<string, TagLabel> = {
  S: { en: "singular", ar: "مفرد" },
  D: { en: "dual", ar: "مثنى" },
  P: { en: "plural", ar: "جمع" },
};

/**
 * Decomposes a bare person/gender/number code (e.g. "3MP", "2FS", "MD", "D")
 * into its parts. Every character in such a tag is unambiguous: a digit is
 * always person, M/F is always gender, S/D/P is always number, and no other
 * character appears in this style of tag.
 */
function decodePersonGenderNumber(tag: string): TagLabel | null {
  if (!/^[123MFSDP]{1,3}$/.test(tag)) return null;

  const parts: TagLabel[] = [];
  for (const ch of tag) {
    if (PERSON[ch]) parts.push(PERSON[ch]);
    else if (GENDER[ch]) parts.push(GENDER[ch]);
    else if (NUMBER[ch]) parts.push(NUMBER[ch]);
    else return null;
  }
  if (parts.length === 0) return null;

  return {
    en: parts.map((p) => p.en).join(", "),
    ar: parts.map((p) => p.ar).join("، "),
  };
}

/**
 * Describes a single raw tag (as found in a RootFile.feats entry, split on
 * "|") in both English and Arabic. Handles bare tags (e.g. "NOM"),
 * key:value tags (e.g. "MOOD:IND", "VF:4"), and person/gender/number codes
 * (e.g. "3MP"). Falls back to returning the raw tag verbatim if unrecognized.
 */
export function describeTag(tag: string): TagLabel {
  if (TAG_LABELS[tag]) return TAG_LABELS[tag];

  const decoded = decodePersonGenderNumber(tag);
  if (decoded) return decoded;

  const colonIdx = tag.indexOf(":");
  if (colonIdx !== -1) {
    const key = tag.slice(0, colonIdx);
    const value = tag.slice(colonIdx + 1);
    const keyLabel = KEY_LABELS[key];
    if (keyLabel) {
      if (key === "VF" && ROMAN_FORMS[value]) {
        const roman = ROMAN_FORMS[value];
        return { en: `${keyLabel.en}: ${roman}`, ar: `${keyLabel.ar}: ${roman}` };
      }
      // MOOD:IND -> reuse the mood's own label for the value when known;
      // FAM:كَان -> look up the family description.
      const valueLabel = key === "FAM" ? FAM_VALUE_LABELS[value] : TAG_LABELS[value];
      return {
        en: `${keyLabel.en}: ${valueLabel ? valueLabel.en : value}`,
        ar: `${keyLabel.ar}: ${valueLabel ? valueLabel.ar : value}`,
      };
    }
  }

  return { en: tag, ar: tag };
}

/** Describes a full pipe-delimited tag string (e.g. "IMPF|VF:1|3MP|MOOD:IND"). */
export function describeTags(tagsJoined: string): TagLabel[] {
  if (tagsJoined === "") return [];
  return tagsJoined.split("|").map(describeTag);
}
