import {
  CASE_LABELS,
  DEFINITENESS_LABELS,
  MOOD_LABELS,
  PGN_AGREEMENT_LABELS,
  PGN_AGREEMENT_ORDER,
  PGN_PERSON_LABELS,
  PGN_PERSON_ORDER,
} from "@/lib/morphology/featureLabels";
import { MORPH_CASES, MORPH_DEFINITENESS, MORPH_MOODS } from "@/lib/morphology/morphFeatures";
import { SYNTAX_TAGS } from "@/lib/morphology/syntaxTags";

/**
 * The grammar browser's facets, each one defined as a QCQL query.
 *
 * THIS IS THE WHOLE DESIGN. The browser does not have its own filtering
 * engine: a chip is a label plus a query string, clicking it runs that
 * query through the same parser and executor `/query/` uses, and the query
 * is shown so a reader can see what they just asked and take it further.
 *
 * The alternative -- a second filter path over the same indices -- is how
 * a codebase ends up with two answers to the same question. It also makes
 * the GUI the tutorial for the language, which is what the review asked
 * for: nobody has to learn QCQL to start, and nobody is capped by the
 * chips once they have.
 */
export interface Facet {
  /** stable id, used as the URL fragment and React key */
  id: string;
  /** the QCQL this chip runs */
  q: string;
  /** en/ar labels; a tag facet takes its labels from tagLabels.ts instead */
  en?: string;
  ar?: string;
  /** a syntax tag, when the label should come from describeTag */
  tag?: string;
  /**
   * The corpus's own code for this feature (3MS, MP, IV ...), shown on
   * hover. The label a reader sees is a grammatical term in their own
   * language; the code stays reachable for anyone working from the
   * Quranic Arabic Corpus tagset, and is visible anyway in the QCQL the
   * results header shows.
   */
  code?: string;
}

export interface FacetGroup {
  id: string;
  /** i18n key under grammarPage.groups */
  labelKey: "verbs" | "nouns" | "function";
  sections: FacetSection[];
}

export interface FacetSection {
  id: string;
  /** i18n key under grammarPage.sections */
  labelKey:
    | "aspect"
    | "verbForm"
    | "voice"
    | "mood"
    | "person"
    | "agreement"
    | "nounType"
    | "case"
    | "definiteness"
    | "allTags";
  facets: Facet[];
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"] as const;

/**
 * The Arabic name of each Form: its wazn.
 *
 * Roman numerals are how Western Arabists number the derived forms, and
 * they say nothing to an Arabic reader, who knows Form II as فَعَّلَ. Indexed
 * I-XI, matching ROMAN.
 */
const WAZN = [
  "فَعَلَ",
  "فَعَّلَ",
  "فَاعَلَ",
  "أَفْعَلَ",
  "تَفَعَّلَ",
  "تَفَاعَلَ",
  "اِنْفَعَلَ",
  "اِفْتَعَلَ",
  "اِفْعَلَّ",
  "اِسْتَفْعَلَ",
  "اِفْعَالَّ",
] as const;

/** Form I-XI, as the corpus marks them. */
const VERB_FORMS: Facet[] = Array.from({ length: 11 }, (_, i) => ({
  id: `vf${i + 1}`,
  q: `[vf=${i + 1}]`,
  en: ROMAN[i],
  ar: WAZN[i],
  code: `${ROMAN[i]} — ${WAZN[i]}`,
}));

/**
 * Person-marked agreement, in the order a grammar book teaches it rather
 * than the alphabetical order the index stores: 3rd person before 2nd
 * before 1st, singular-dual-plural within each.
 *
 * These are the VERBAL ones. Every tag here is attested on a verb in this
 * corpus; the smallest, 2FD, occurs once.
 *
 * LABELLED AS PRONOUNS, not as the corpus's codes. "3MS" is a tagset code,
 * and a reader who has not memorised the Quranic Arabic Corpus tagset
 * cannot read it -- least of all in the Arabic interface, where it is also
 * the wrong script. The pronoun IS the feature: a verb tagged 3MS agrees
 * with هو. The code stays on hover and in the query the results show.
 */
const PGN_PERSON = PGN_PERSON_ORDER.map((code) => ({ code, ...PGN_PERSON_LABELS[code] }));

/**
 * Person-less agreement: gender and number with no person.
 *
 * These mark NOMINAL agreement, which the data made plain -- restricting
 * them to verbs returns nothing for seven of the eight (only MS scrapes 50
 * hits). They are queried unrestricted rather than with `pos=N`, because
 * pronouns carry the same agreement and a reader browsing gender and
 * number wants those too.
 *
 * The bare number tags are rare and that is correct: `[pgn=p]` finds 390
 * positions and `[pgn=d]` two. They were 13,377 and more until the build
 * stopped reading a preposition's repeated POS tag ("P") as the plural
 * agreement tag of the same spelling -- see build-morphology.
 */
const PGN_AGREEMENT = PGN_AGREEMENT_ORDER.map((code) => ({ code, ...PGN_AGREEMENT_LABELS[code] }));

export const GRAMMAR_GROUPS: FacetGroup[] = [
  {
    id: "verbs",
    labelKey: "verbs",
    sections: [
      {
        id: "aspect",
        labelKey: "aspect",
        facets: [
          { id: "perf", q: "[cat=verb.perf]", en: "Perfect", ar: "ماضٍ" },
          { id: "impf", q: "[cat=verb.impf]", en: "Imperfect", ar: "مضارع" },
          { id: "impv", q: "[cat=verb.impv]", en: "Imperative", ar: "أمر" },
        ],
      },
      { id: "verbForm", labelKey: "verbForm", facets: VERB_FORMS },
      {
        id: "voice",
        labelKey: "voice",
        facets: [
          // Active is the complement of passive WITHIN verbs, not the
          // complement of passive in the corpus -- `!PASS` alone would
          // match every noun too.
          { id: "active", q: "[pos=V & !PASS]", en: "Active", ar: "مبني للمعلوم" },
          { id: "passive", q: "[pos=V & PASS]", en: "Passive", ar: "مبني للمجهول" },
        ],
      },
      {
        id: "mood",
        labelKey: "mood",
        facets: MORPH_MOODS.map((m) => ({
          id: `mood-${m.toLowerCase()}`,
          q: `[mood=${m.toLowerCase()}]`,
          en: MOOD_LABELS[m].en,
          ar: MOOD_LABELS[m].ar,
          code: m,
        })),
      },
      {
        id: "person",
        labelKey: "person",
        facets: PGN_PERSON.map((p) => ({
          id: `pgn-${p.code.toLowerCase()}`,
          q: `[pgn=${p.code.toLowerCase()} & pos=V]`,
          en: p.en,
          ar: p.ar,
          code: p.code,
        })),
      },
    ],
  },
  {
    id: "nouns",
    labelKey: "nouns",
    sections: [
      {
        id: "nounType",
        labelKey: "nounType",
        facets: [
          { id: "noun", q: "[cat=noun]", en: "Noun", ar: "اسم" },
          { id: "properNoun", q: "[cat=properNoun]", en: "Proper noun", ar: "اسم علم" },
          { id: "adj", q: "[cat=adj]", en: "Adjective", ar: "صفة" },
          { id: "actPcpl", q: "[cat=actPcpl]", en: "Active participle", ar: "اسم فاعل" },
          { id: "passPcpl", q: "[cat=passPcpl]", en: "Passive participle", ar: "اسم مفعول" },
          { id: "verbalNoun", q: "[cat=verbalNoun]", en: "Verbal noun", ar: "مصدر" },
        ],
      },
      {
        id: "case",
        labelKey: "case",
        facets: MORPH_CASES.map((c) => ({
          id: `case-${c.toLowerCase()}`,
          q: `[case=${c.toLowerCase()}]`,
          en: CASE_LABELS[c].en,
          ar: CASE_LABELS[c].ar,
          code: c,
        })),
      },
      {
        id: "agreement",
        labelKey: "agreement",
        facets: PGN_AGREEMENT.map((p) => ({
          id: `pgn-${p.code.toLowerCase()}`,
          q: `[pgn=${p.code.toLowerCase()}]`,
          en: p.en,
          ar: p.ar,
          code: p.code,
        })),
      },
      {
        id: "definiteness",
        labelKey: "definiteness",
        facets: MORPH_DEFINITENESS.map((d) => ({
          id: `def-${d.toLowerCase()}`,
          q: `[def=${d.toLowerCase()}]`,
          en: DEFINITENESS_LABELS[d].en,
          ar: DEFINITENESS_LABELS[d].ar,
          code: d,
        })),
      },
    ],
  },
  {
    id: "function",
    labelKey: "function",
    sections: [
      {
        id: "allTags",
        labelKey: "allTags",
        // The original contents of this page: what a segment DOES, as
        // opposed to what it IS. Labels come from tagLabels.ts.
        facets: SYNTAX_TAGS.map((t) => ({ id: `tag-${t}`, q: `[${t}]`, tag: t })),
      },
    ],
  },
];

/** Every facet, flattened -- for counting and for id lookup. */
export const ALL_FACETS: Facet[] = GRAMMAR_GROUPS.flatMap((g) =>
  g.sections.flatMap((s) => s.facets),
);
