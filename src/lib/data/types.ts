/**
 * Shared data-layer types.
 *
 * This module is the single source of truth for the shapes written by
 * `scripts/build-data.ts` under `public/data/v1/**` and read by the app at
 * runtime and at build time (`generateStaticParams`). Keep it dependency-free
 * (no Next.js / React imports) so it can be imported from plain `tsx` scripts.
 */

/** Grammatical category a rooted word form is classified into. */
export type Cat =
  | "verb.perf"
  | "verb.impf"
  | "verb.impv"
  | "noun"
  | "actPcpl"
  | "passPcpl"
  | "verbalNoun"
  | "adj"
  | "properNoun"
  | "other";

export const CATEGORY_LABELS: Record<Cat, string> = {
  "verb.perf": "Verb (perfect)",
  "verb.impf": "Verb (imperfect)",
  "verb.impv": "Verb (imperative)",
  noun: "Noun",
  actPcpl: "Active participle",
  passPcpl: "Passive participle",
  verbalNoun: "Verbal noun",
  adj: "Adjective",
  properNoun: "Proper noun",
  other: "Other",
};

/** Ordered list of categories, used for consistent chart/legend ordering. */
export const CATEGORY_ORDER: Cat[] = [
  "verb.perf",
  "verb.impf",
  "verb.impv",
  "verbalNoun",
  "actPcpl",
  "passPcpl",
  "noun",
  "adj",
  "properNoun",
  "other",
];

export interface ManifestSource {
  name: string;
  url: string;
  license: string;
}

export interface ManifestMismatch {
  /** surah, ayah, morphology word count, quran-json word count */
  s: number;
  a: number;
  morphN: number;
  jsonN: number;
}

export interface ManifestFile {
  version: string;
  builtAt: string;
  hash: string;
  counts: {
    segments: number;
    words: number;
    verses: number;
    surahs: number;
    roots: number;
    lemmas: number;
    rootedLemmas: number;
    rootlessLemmas: number;
    occurrences: number;
  };
  sources: ManifestSource[];
  mismatches: ManifestMismatch[];
}

export interface SurahMeta {
  n: number;
  nameAr: string;
  nameEn: string;
  translit: string;
  type: "meccan" | "medinan";
  ayahs: number;
}

export interface MetaFile {
  surahs: SurahMeta[];
}

/** One row per root in the eager autocomplete index. */
export interface IndexRootRow {
  ar: string;
  key: string;
  bw: string;
  count: number;
  lemmaCount: number;
  verseCount: number;
  glossShort: string;
}

/** One row per lemma (rooted or rootless) in the eager autocomplete index. */
export interface IndexLemmaRow {
  lemma: string;
  key: string;
  /** index into IndexFile.roots, or -1 if this lemma has no root */
  rootIdx: number;
  count: number;
  cat: Cat;
}

export interface IndexFile {
  roots: IndexRootRow[];
  lemmas: IndexLemmaRow[];
}

/** One row in the idle-prefetched forms/word-forms index. */
export interface FormsEntry {
  key: string;
  altKey: string | null;
  /** index into IndexFile.roots, or -1 if rootless */
  rootIdx: number;
  /** index into IndexFile.lemmas */
  lemmaIdx: number;
  count: number;
}

export interface EnIndexFile {
  /** sorted, stemmed English terms */
  terms: string[];
  /** postings[i] = sorted global verse ids (0..6235) containing terms[i] */
  postings: number[][];
}

/** [rootIdx (into IndexFile.roots), w (1-based word index)], one per rooted segment. */
export type VerseRootOccurrence = [rootIdx: number, w: number];

/**
 * verseRoots[globalVerseId] = every rooted word in that verse, in word order.
 * Indexed by the same stable global verse id used by EnIndexFile.postings
 * (see src/lib/data/verseId.ts). Powers collocations (what else occurs in
 * this root's verses), adjacent-root phrase search, and shared-root
 * "related verses" -- all otherwise impossible to answer client-side from a
 * single root's own file, since none of those carry other roots' data.
 */
export type VerseRootsFile = VerseRootOccurrence[][];

/**
 * arIndex[globalVerseId] = every token of that verse (every whitespace word,
 * particles and pronouns included -- unlike VerseRootsFile, which only
 * carries rooted segments), each run through the same `normalize()` used at
 * query time. Powers literal Arabic phrase/sentence search (contiguous
 * multi-word matching, e.g. "يا أيها الناس"), which needs the exact running
 * text, not just root tags. Indexed by the same stable global verse id as
 * EnIndexFile.postings and VerseRootsFile.
 */
export type ArIndexFile = string[][];

/**
 * One rooted occurrence's facets, denormalized for cross-corpus faceted
 * search (see /search/advanced): surah, ayah, word index, root index (into
 * IndexFile.roots), lemma index (into IndexFile.lemmas), category index
 * (into OccurrenceIndexFile.cats), and verb Form (0 = not applicable/no VF
 * tag, 1-11 = Form I-XI per classify.ts's ROMAN_FORMS). Rooted occurrences
 * only, matching this app's documented "occurrence" methodology (About
 * page) -- particles/pronouns/clitics never appear here, same as
 * VerseRootsFile and every RootFile.occ.
 */
export type OccurrenceIndexRow = [
  s: number,
  a: number,
  w: number,
  rootIdx: number,
  lemmaIdx: number,
  catIdx: number,
  verbForm: number,
];

export interface OccurrenceIndexFile {
  /** Cat values referenced by each row's catIdx, in index order. */
  cats: Cat[];
  rows: OccurrenceIndexRow[];
}

export interface SurahVerse {
  /** ayah number, 1-based */
  a: number;
  /** whitespace tokens of the Uthmani verse text */
  w: string[];
  /** Saheeh International translation */
  t: string;
  /** present (=1) when this verse's tokens came from the morphology
   *  reconstruction rather than the canonical quran-json text, due to a
   *  token-count mismatch between the two sources */
  m?: 1;
  /** Pickthall's English translation, shown alongside Saheeh International
   *  for translation comparison. Absent for the small number of verses the
   *  Pickthall source doesn't cover (see manifest for provenance). */
  pickthall?: string;
}

export interface SurahFile {
  n: number;
  verses: SurahVerse[];
}

export interface RootLemmaEntry {
  lemma: string;
  key: string;
  /** the corpus uses exactly three part-of-speech letters: N(oun), V(erb), P(article) */
  pos: "N" | "V" | "P";
  count: number;
  cats: Partial<Record<Cat, number>>;
  /** Form I-XI counts, only present for verbs */
  vf?: Record<string, number>;
}

export interface RootFormEntry {
  /** the stem segment form, e.g. كِتَٰبُ */
  form: string;
  key: string;
  lemmaIdx: number;
  cat: Cat;
  count: number;
}

/** [surah, ayah, word, segment, formIdx, featIdx], in Quran order */
export type Occurrence = [number, number, number, number, number, number];

export interface RootGloss {
  en: string;
  short: string;
}

export interface RootFile {
  root: string | null;
  bw?: string;
  gloss?: RootGloss;
  total: number;
  lemmas: RootLemmaEntry[];
  forms: RootFormEntry[];
  /** deduped feature strings, e.g. "V|IMPF|VF:1|3MP|MOOD:IND", for tag chips */
  feats: string[];
  occ: Occurrence[];
}

/** A single resolved occurrence, used by the UI and export formatters. */
export interface OccurrenceRow {
  surah: number;
  ayah: number;
  surahNameAr: string;
  surahNameEn: string;
  wordIndex: number;
  form: string;
  lemma: string;
  root: string | null;
  category: Cat;
  tags: string;
  verseUthmani: string;
  translation: string;
}

/** One root ranked by how many distinct surahs it appears in. */
export interface SurahCoverageRootRow {
  ar: string;
  glossShort: string;
  surahCount: number;
  count: number;
}

/** One lemma (rooted or rootless) ranked by how many distinct surahs it appears in. */
export interface SurahCoverageLemmaRow {
  lemma: string;
  key: string;
  /** the lemma's root, or null when it's a rootless particle/pronoun/clitic */
  rootAr: string | null;
  surahCount: number;
  count: number;
}

/**
 * Precomputed corpus-wide curiosities for /insights/ -- each one would
 * otherwise mean fetching most or all of the per-root/lemma files
 * client-side just to answer one question, so these are computed once at
 * build time from data the pipeline already has fully in memory.
 */
export interface InsightsFile {
  /** 114, so the UI never hardcodes it */
  totalSurahs: number;
  /** top 15 roots by distinct-surah count, then by occurrence count */
  rootsBySurahCoverage: SurahCoverageRootRow[];
  /** top 15 lemmas (rooted + rootless) by distinct-surah count, then by occurrence count */
  lemmasBySurahCoverage: SurahCoverageLemmaRow[];
  longestVerse: { s: number; a: number; wordCount: number };
  shortestVerse: { s: number; a: number; wordCount: number };
  longestWord: { s: number; a: number; w: number; text: string; letterCount: number };
  /** whole-Qur'an letter frequency (see src/lib/arabic/letterFrequency.ts), every letter that occurs at least once */
  letterFrequency: { letter: string; count: number }[];
  /** roots occurring exactly once anywhere in the Qur'an */
  hapaxRootCount: number;
  /** lemmas (rooted + rootless) occurring exactly once anywhere in the Qur'an */
  hapaxLemmaCount: number;
  /** the root with the most distinct lemmas derived from it */
  mostDerivedRoot: { ar: string; lemmaCount: number };
  /** the root with the most distinct surface forms */
  mostFormsRoot: { ar: string; formCount: number };
  /**
   * The verse with the highest distinct-root density (distinct roots ÷ word
   * count) among verses of at least 10 words -- ranked by density, not raw
   * count, so it doesn't just re-report the longest verse.
   */
  mostRootDenseVerse: { s: number; a: number; distinctRootCount: number; wordCount: number; density: number };
}

/**
 * One verse's ending letter (fāṣila), diacritics stripped -- the final
 * letter of its last word, the unit classical Qur'anic rhetorical studies
 * (fawāṣil/sajʿ) classify verse-endings by. Powers /insights/'s rhyme tab.
 */
export interface RhymeRow {
  s: number;
  a: number;
  ending: string;
}

export interface RhymeFile {
  /** one row per verse (6,236 total), in Qur'an order */
  rows: RhymeRow[];
}

/** One root ranked by how over/under-represented it is in one surah vs. its corpus-wide average rate. */
export interface DistinctiveRootRow {
  ar: string;
  glossShort: string;
  /** occurrences of this root within this surah */
  localCount: number;
  /** (localCount / this surah's word count) ÷ (corpus-wide count / corpus-wide word count) */
  ratio: number;
}

export interface DistinctiveVocabFile {
  /** bySurah[n - 1] = that surah's top distinctive roots, ranked by ratio desc (min. 3 occurrences in-surah to qualify) */
  bySurah: DistinctiveRootRow[][];
}

/** How often a given root's verb occurrences are immediately followed by a given preposition. */
export interface VerbPrepositionRow {
  verbRootAr: string;
  /** normalized preposition key, e.g. "ب", "من", "الي" (إلى normalized) */
  prepositionKey: string;
  /** canonical diacritized display form, e.g. "بِ", "مِن", "إِلَى" */
  prepositionLemma: string;
  count: number;
}

export interface CollocationsFile {
  /** sorted by verbRootAr, then count desc within each root */
  verbPrepositions: VerbPrepositionRow[];
}
