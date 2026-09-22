import type { Cat } from "../../src/lib/data/types";

/**
 * A machine-readable data dictionary for this project's two public data
 * surfaces: the bulk corpus.csv export, and the JSON files under
 * public/data/v1/ that the app itself (and scripts/qcql-cli.ts's
 * --base-url mode) reads at runtime.
 *
 * WHY THIS EXISTS. Both surfaces were previously documented only in prose
 * on the About page (corpus.csv) or in this codebase's own TypeScript
 * comments (the JSON files, in src/lib/data/types.ts) -- readable by a
 * contributor, not by a researcher's own script. This file is the single
 * source of truth for corpus.csv's columns (build-corpus-export.ts writes
 * exactly this column list and order) and a hand-maintained index of the
 * JSON files, each pointing at the TypeScript interface that is the
 * authoritative field-level schema for it.
 */

export interface CsvColumnDef {
  name: string;
  type: "integer" | "string" | "enum";
  /** true when the column can be an empty string (never for numeric/enum-typed columns here) */
  nullable: boolean;
  description: string;
  /** every value the column can take, for an enum column */
  values?: string[];
}

/**
 * corpus.csv's columns, in file order. Kept in sync with
 * build-corpus-export.ts's HEADER by a test that asserts the names and
 * order here match it exactly -- see src/test/build-codebook.test.ts.
 */
export const CORPUS_CSV_COLUMNS: readonly CsvColumnDef[] = [
  { name: "surah", type: "integer", nullable: false, description: "Surah (chapter) number, 1-114." },
  { name: "ayah", type: "integer", nullable: false, description: "1-based verse number within the surah." },
  {
    name: "surah_name_en",
    type: "string",
    nullable: false,
    description: "English transliteration of the surah's name.",
  },
  { name: "surah_name_ar", type: "string", nullable: false, description: "The surah's name in Arabic." },
  {
    name: "revelation_type",
    type: "enum",
    nullable: false,
    values: ["meccan", "medinan"],
    description: "Traditional classification of where the surah was revealed.",
  },
  {
    name: "word_index",
    type: "integer",
    nullable: false,
    description: "1-based word position within the verse.",
  },
  {
    name: "word",
    type: "string",
    nullable: false,
    description: "The Arabic word as it appears in the text, fully diacritized (Uthmani orthography).",
  },
  {
    name: "root",
    type: "string",
    nullable: true,
    description:
      "Arabic root (typically triliteral), taken from the word's ROOTED morphological segment -- this app's own definition of an 'occurrence' (see the About page). Empty for words that carry no root at all: particles, pronouns, and most clitics. A word can carry more than one morphological segment, but at most one is ever rooted, with one documented exception (20:94:2, يَبْنَؤُمَّ) whose second root is not represented in this export.",
  },
  {
    name: "lemma",
    type: "string",
    nullable: true,
    description: "Dictionary citation form of the rooted segment. Empty on the same rows as `root`.",
  },
  {
    name: "category",
    type: "enum",
    nullable: true,
    values: [
      "verb.perf",
      "verb.impf",
      "verb.impv",
      "noun",
      "actPcpl",
      "passPcpl",
      "verbalNoun",
      "adj",
      "properNoun",
      "other",
    ] satisfies Cat[],
    description:
      "Grammatical category of the rooted segment (see the About page's methodology section for the exact mapping from source tags). Empty on the same rows as `root`.",
  },
  {
    name: "tags",
    type: "string",
    nullable: true,
    description:
      "Raw morphological tags for the rooted segment, pipe (|)-delimited, in source order (e.g. PERF|ROOT:كتب|LEM:كَتَبَ|3MS). Empty on the same rows as `root`.",
  },
  {
    name: "translation_saheeh",
    type: "string",
    nullable: false,
    description:
      "Saheeh International English translation of the verse this word belongs to, repeated once per word in the verse.",
  },
  {
    name: "translation_pickthall",
    type: "string",
    nullable: true,
    description:
      "Pickthall English translation of the verse this word belongs to, repeated once per word. Technically optional (a small number of verses lack Pickthall coverage in the source), though every verse has one in the current build.",
  },
];

export interface DataFileDef {
  /** path under public/data/v1/, with a `{param}` placeholder for per-item files */
  path: string;
  /** the authoritative TypeScript interface in src/lib/data/types.ts */
  type: string;
  description: string;
}

/**
 * Every file (or file family) under public/data/v1/ -- the same files
 * scripts/qcql-cli.ts's --base-url mode fetches. `type` names the
 * TypeScript interface in src/lib/data/types.ts that is the authoritative,
 * field-level schema; this table is a map of what exists and why, not a
 * restatement of every field (which would drift from that file the moment
 * one of them changes). Order matches build-data.ts's own write order.
 */
export const DATA_FILES: readonly DataFileDef[] = [
  {
    path: "manifest.json",
    type: "ManifestFile",
    description:
      "Dataset provenance: build hash and timestamp, corpus counts, source list, the exact reading/transmission and verse-numbering tradition the text follows, and known morphology/canonical-text mismatches.",
  },
  {
    path: "meta.json",
    type: "MetaFile",
    description: "All 114 surahs' metadata: names (Arabic, English, transliteration), revelation type, verse count.",
  },
  {
    path: "index.json",
    type: "IndexFile",
    description:
      "Eager autocomplete index: one row per root and one row per lemma (rooted or rootless), each with its own occurrence/verse counts.",
  },
  {
    path: "forms.json",
    type: "FormsEntry[]",
    description: "Idle-prefetched index of every distinct surface word form, for form-level autocomplete/search.",
  },
  {
    path: "en-index.json",
    type: "EnIndexFile",
    description: "English full-text search index: stemmed terms and, per term, the sorted verse ids containing it.",
  },
  {
    path: "verse-roots.json",
    type: "VerseRootsFile",
    description:
      "Every rooted word in every verse, indexed by a stable global verse id (root index + word position, in word order). The basis for collocations, adjacent-root phrase search, and root-sharing lookups.",
  },
  {
    path: "ar-index.json",
    type: "ArIndexFile",
    description:
      "Every token of every verse (particles and pronouns included, unlike verse-roots.json), normalized -- powers literal Arabic phrase/sentence search.",
  },
  {
    path: "occurrences.json",
    type: "OccurrenceIndexFile",
    description:
      "One row per rooted occurrence (this app's definition -- see the About page): surah, ayah, word index, root, lemma, category and verb Form, columnar. The denormalized index QCQL and /search/advanced query against. The JSON counterpart of corpus.csv's rooted rows.",
  },
  {
    path: "syntax.json",
    type: "SyntaxIndexFile",
    description:
      "Every ROOTLESS morphological segment that carries a syntactic/rhetorical function tag (restriction, condition, circumstantial hāl, prohibition, resumption, and the rest) -- a layer occurrences.json deliberately excludes, since folding it in would redefine this app's 'occurrence'. Columnar, one tag per row.",
  },
  {
    path: "morphology.json",
    type: "MorphologyIndexFile",
    description:
      "Every segment's inflectional features -- case, mood, definiteness, person/gender/number -- rooted and rootless alike. Columnar; 0 in a feature column means the segment genuinely has no value for it, not missing data. Only fetched when a QCQL query needs a morphology predicate.",
  },
  {
    path: "insights.json",
    type: "InsightsFile",
    description:
      "Precomputed corpus-wide facts (longest/shortest verse, hapax counts, whole-Qur'an letter frequency, most-derived root, and similar) computed once at build time.",
  },
  {
    path: "rhyme.json",
    type: "RhymeFile",
    description: "One row per verse (6,236 total): its ending letter (fāṣila), diacritics stripped.",
  },
  {
    path: "distinctive-vocab.json",
    type: "DistinctiveVocabFile",
    description: "Per-surah rankings of roots over/under-represented relative to their corpus-wide rate.",
  },
  {
    path: "collocations.json",
    type: "CollocationsFile",
    description:
      "Verb root x preposition co-occurrence: raw count, PMI, a G² test of the same association (Dunning 1993) and its Benjamini-Hochberg FDR q-value, measured over the whole Qur'an. Every occurrence's verse reference is included, uncapped.",
  },
  {
    path: "abjad.json",
    type: "AbjadTotalsFile",
    description:
      "Precomputed classical Abjad-value (ḥisāb al-jummal) totals at every traditional scale -- whole book, per surah, per Hizb, per Juz', per verse -- plus which distinct word forms share a value.",
  },
  {
    path: "cooccurrence.json",
    type: "CooccurrenceFile",
    description:
      "Global root-pair co-occurrence (which two roots share a verse most often, by raw count and by PMI), corpus-wide -- distinct from collocations.json's per-root, verb-specific view.",
  },
  {
    path: "patterns.json",
    type: "PatternsFile",
    description:
      "Corpus-wide morphological productivity: how often each verb Form, derivational category and root shape is attested across every root.",
  },
  {
    path: "formulas.json",
    type: "FormulasFile",
    description:
      "Recurring multi-word phrases (3-6 consecutive words, never crossing a verse boundary), grouped by normalized text and counted across the whole corpus, with every occurrence's verse reference.",
  },
  {
    path: "verse-similarity.json",
    type: "VerseSimilarityFile",
    description:
      "Verse pairs sharing an unusually high proportion of their distinct roots (Jaccard similarity over each verse's root set), independent of shared wording.",
  },
  {
    path: "divine-name-pairs.json",
    type: "DivineNamePairsFile",
    description: "Every adjacent pair of curated Divine Names found anywhere in the Qur'an, with verse references.",
  },
  {
    path: "surahs/{n}.json",
    type: "SurahFile",
    description:
      "One surah's verse text and English translations (Saheeh International, Pickthall) -- 114 files, one per surah number.",
  },
  {
    path: "roots/{root}.json",
    type: "RootFile",
    description:
      "One root's complete breakdown: every lemma derived from it, every surface form, every occurrence (surah/ayah/word/segment), and deduped feature strings. One file per root.",
  },
  {
    path: "lemmas/{key}.json",
    type: "RootFile (root: null)",
    description:
      "The same shape as roots/*.json, for a rootless lemma (a particle, pronoun, or other word with no root) -- one file per rootless lemma key.",
  },
  {
    path: "readings/meta.json, readings/{slug}.json",
    type: "ReadingsMetaFile, ReadingSurahFile",
    description:
      "The seven non-Hafs canonical transmissions (riwayat) this project ships text for, and each one's per-surah verse text -- wording (farsh) differences only, no computed diff against the base Hafs text.",
  },
  {
    path: "mujam/meta.json, mujam/{root}.json",
    type: "MujamMetaFile, MujamRootFile",
    description:
      "Three classical Arabic-Arabic lexicons (Maqāyīs al-Lugha, Mufradāt, al-Ṣiḥāḥ) worth of articles per root, with per-work coverage.",
  },
  {
    path: "lane/meta.json, lane/{root}.json",
    type: "LaneMetaFile, LaneRootFile",
    description: "Lane's Arabic-English Lexicon articles per root, with coverage.",
  },
  {
    path: "tafsir/{slug}/meta.json, tafsir/{slug}/{n}.json",
    type: "TafsirMetaFile, TafsirSurahFile",
    description: "A shipped Qur'anic commentary (tafsir), with per-surah entries and stated verse coverage.",
  },
];

export interface Codebook {
  generatedAt: string;
  corpusCsv: {
    /** total data rows (one per word), not counting the header */
    rowCount: number;
    lineTerminator: string;
    encoding: string;
    quoting: string;
    columns: readonly CsvColumnDef[];
  };
  dataFiles: readonly DataFileDef[];
}

export function buildCodebookJson(corpusRowCount: number): Codebook {
  return {
    generatedAt: new Date().toISOString(),
    corpusCsv: {
      rowCount: corpusRowCount,
      lineTerminator: "CRLF (\\r\\n)",
      encoding: "UTF-8",
      quoting: "RFC 4180 (a field is quoted only when it contains a comma, quote, or newline)",
      columns: CORPUS_CSV_COLUMNS,
    },
    dataFiles: DATA_FILES,
  };
}

/** A CSV companion to corpus.csv's own columns, loadable the same way (e.g. pandas.read_csv). */
export function buildCorpusColumnsCsv(): string {
  const header = "name,type,nullable,values,description";
  const csvField = (value: string): string =>
    /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  const lines = [header];
  for (const col of CORPUS_CSV_COLUMNS) {
    lines.push(
      [
        col.name,
        col.type,
        String(col.nullable),
        col.values ? col.values.join("|") : "",
        col.description,
      ]
        .map(csvField)
        .join(","),
    );
  }
  return lines.join("\r\n") + "\r\n";
}
