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
