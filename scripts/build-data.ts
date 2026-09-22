/**
 * Data pipeline orchestrator. Downloads (cached), parses, validates, and
 * emits every file under public/data/v1/**. Run via `pnpm data:build` (or
 * automatically as `prebuild`); `pnpm data:check` / `--check` runs the same
 * pipeline but skips writing files, only validating invariants and size
 * budgets -- useful in CI without touching the working tree.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { gzipSync } from "node:zlib";
import { join } from "node:path";
import { createHash } from "node:crypto";

import { RAW_DIR, fetchBufferWithRetry, fetchCached, fetchCachedJSON } from "./lib/download";
import { parseMorphologyTSV, type RawWord } from "./lib/parse-morphology";
import { buildSurahs, type QuranJsonChapter } from "./lib/build-surahs";
import { buildRoots, type RootsGlossMap } from "./lib/build-roots";
import { buildEnIndex, type IndexableVerse } from "./lib/build-en-index";
import { buildArIndex, type ArIndexableVerse } from "./lib/build-ar-index";
import { buildVerseRoots } from "./lib/build-verse-roots";
import { buildSyntax } from "./lib/build-syntax";
import { buildMorphology } from "./lib/build-morphology";
import { SYNTAX_TAGS } from "../src/lib/morphology/syntaxTags";
import { ALL_FACETS } from "../src/lib/grammar/facets";
import { compareScope, corpusDispersion } from "../src/lib/insights/compare";
import { buildVerseRefs } from "../src/lib/insights/scope";
import { executeQcql } from "../src/lib/qcql/execute";
import { parseQcql } from "../src/lib/qcql/parse";
import { RIWAYAT, buildReadings, type RawEdition } from "./lib/build-readings";
import { TAFSIR_SLUG, buildTafsir, type RawTafsirRow } from "./lib/build-tafsir";
import { buildTreebank, parseTreebankTSV } from "./lib/build-treebank";
import { buildLane, type RawLaneEntry } from "./lib/build-lane";
import { MUJAM_SOURCE_TABLE, MUJAM_WORKS, buildMujam, type RawMujamEntry } from "./lib/build-mujam";
import { describeTag } from "../src/lib/morphology/tagLabels";
import { buildInsights } from "./lib/build-insights";
import { buildRhyme } from "./lib/build-rhyme";
import { buildDistinctiveVocab } from "./lib/build-distinctive-vocab";
import { buildCollocations } from "./lib/build-collocations";
import { buildAbjad } from "./lib/build-abjad";
import { buildCooccurrence } from "./lib/build-cooccurrence";
import { buildPatterns } from "./lib/build-patterns";
import { buildFormulas } from "./lib/build-formulas";
import { buildVerseSimilarity } from "./lib/build-verse-similarity";
import { buildDivineNamePairs } from "./lib/build-divine-name-pairs";
import { buildCorpusExportCsv } from "./lib/build-corpus-export";
import { buildCodebookJson, buildCorpusColumnsCsv } from "./lib/build-codebook";
import {
  SizeReport,
  checkSizeBudgets,
  formatBudgetViolation,
  recordGroup,
  writeJSON,
  writeText,
} from "./lib/emit";
import { ALL_TOPICS, DIVINE_NAME_TOPICS } from "../src/lib/topics/topicDefinitions";
import { topicSourceFileKey } from "../src/lib/topics/buildTopicOccurrences";
import type {
  ArIndexFile,
  ManifestFile,
  ManifestSource,
  VerseRootsFile,
} from "../src/lib/data/types";

/** Shared shape of every fawazahmed0/quran-api English edition used here. */
interface FawazEdition {
  quran: { chapter: number; verse: number; text: string }[];
}

const args = process.argv.slice(2);
const CHECK_ONLY = args.includes("--check");
const FORCE = args.includes("--force");

const MORPHOLOGY_URL =
  "https://raw.githubusercontent.com/mustafa0x/quran-morphology/master/quran-morphology.txt";
const QURAN_JSON_CHAPTER_URL = (n: number) =>
  `https://raw.githubusercontent.com/risan/quran-json/main/dist/chapters/en/${n}.json`;
const ROOTS_GLOSS_URL =
  "https://raw.githubusercontent.com/R3GENESI5/quran-bil-quran/master/app/data/roots_index.json";
// Pickthall's translation, from the same tanzil.net corpus quran-json's own
// Saheeh International text derives from -- a second English rendering
// shown alongside Saheeh International for translation comparison.
// The alternative transmissions come from the same repo, branch and URL
// shape as PICKTHALL_URL below, under the same Unlicense grant -- adding
// them needed no new host, fetch path or licence review.
const READING_URL = (slug: string) =>
  `https://raw.githubusercontent.com/fawazahmed0/quran-api/1/editions/ara-quran${slug}.min.json`;

const PICKTHALL_URL =
  "https://raw.githubusercontent.com/fawazahmed0/quran-api/1/editions/eng-mohammedmarmadu.min.json";

// Three more English witnesses, same repo/shape/licence as Pickthall above --
// chosen for stylistic and "school" spread against Saheeh International and
// Pickthall, and DELIBERATELY restricted to translators long enough dead
// that the translation itself (not just this repo's packaging) is
// unambiguously public domain: Yusuf Ali (1934, d. 1953 -- South Asian, the
// most historically influential English rendering), Rodwell (1861, d. 1900
// -- Western-academic, reorders surahs chronologically), and Sale (1734,
// d. 1736 -- the first major English translation made directly from the
// Arabic). Modern translations on the same host (Asad, Arberry, etc.) were
// considered and rejected for this reason: their translators died recently
// enough (1992, 1969) that the translation text itself is very likely still
// under copyright regardless of this repo's own Unlicense grant, which
// covers only the packaging. All three shipped here verified at
// 6,236/6,236 verse coverage (no fallback needed, unlike Pickthall's gap).
const YUSUF_ALI_URL =
  "https://raw.githubusercontent.com/fawazahmed0/quran-api/1/editions/eng-abdullahyusufal.min.json";
const RODWELL_URL =
  "https://raw.githubusercontent.com/fawazahmed0/quran-api/1/editions/eng-johnmedowsrodwe.min.json";
const SALE_URL =
  "https://raw.githubusercontent.com/fawazahmed0/quran-api/1/editions/eng-georgesale.min.json";

const SOURCES: ManifestSource[] = [
  {
    name: "Lane's Arabic-English Lexicon (1863-1893), via laneslexicon/LexiconDatabase",
    url: "https://github.com/laneslexicon/LexiconDatabase",
    license:
      "GPL-3.0. Covers 1,617 of this corpus's 1,651 roots; Lane died before finishing, and the tail is thinner.",
  },
  {
    name: "Maqayis al-Lugha (Ibn Faris, d. 395/1004), al-Mufradat (al-Raghib al-Isfahani, d. 502/1108) and al-Sihah (al-Jawhari, d. 393/1003)",
    url: "https://github.com/wizsk/arabic_lexicons",
    license:
      "The three works are pre-1500 and in the public domain. Each text was identified by verbatim cross-match against the edition-bearing OpenITI corpus (Maqayis 33/33, Mufradat 39/40, al-Sihah 35/36); the editions are named per work in the panel. Covers 1,595 of this corpus's 1,651 roots. The modern in-copyright dictionaries in the same database are excluded.",
  },
  {
    name: "Tafsir al-Jalalayn (al-Mahalli and al-Suyuti, 15th-16th c.) -- committed under references/",
    url: "https://github.com/spa5k/tafsir_api",
    license:
      "MIT (repository packaging). The commentary itself is a classical work in the public domain. Covers 6,010 of 6,236 verses.",
  },
  {
    name: "Alternative transmissions (Qalun, Warsh, al-Bazzi, Qunbul, al-Duri, al-Susi, Shu'ba)",
    url: "https://github.com/fawazahmed0/quran-api",
    license:
      "Unlicense (public domain). Non-Hafs editions are re-segmented onto Kufan verse boundaries at the source.",
  },
  {
    name: "Quran morphology (Arabic-script fork of the Quranic Arabic Corpus v0.4)",
    url: "https://github.com/mustafa0x/quran-morphology",
    license: "GPL (upstream Quranic Arabic Corpus)",
  },
  {
    name: "Uthmani text, Saheeh International translation, surah metadata",
    url: "https://github.com/risan/quran-json",
    license: "CC-BY-SA 4.0",
  },
  {
    name: "Root meanings (after Lane's Lexicon)",
    url: "https://github.com/R3GENESI5/quran-bil-quran",
    license: "MIT",
  },
  {
    name: "Pickthall English translation (via tanzil.net)",
    url: "https://github.com/fawazahmed0/quran-api",
    license: "Public domain packaging (Unlicense); translation text via tanzil.net",
  },
  {
    name: "Abdullah Yusuf Ali (1934), John Medows Rodwell (1861) and George Sale (1734) English translations",
    url: "https://github.com/fawazahmed0/quran-api",
    license:
      "Unlicense packaging; each translator died long enough ago (1953, 1900, 1736) that the translation text itself is public domain",
  },
  {
    name: "Dependency treebank (traditional iʿrāb): word-to-word grammatical relations",
    url: "https://github.com/NoorBayan/Quranic",
    license:
      "MIT. Covers 128,207 of this corpus's 130,030 segments -- see the Grammar tree panel's own note for what a gap or an elided/implied element means.",
  },
];

// Bulk downloads that are deliberately NOT part of the deployed site. Git-
// ignored; a maintainer uploads the contents to a GitHub release, and the
// About page links there (see NEXT_PUBLIC_CORPUS_EXPORT_URL).
// Tracked in the repo it comes from (lexicon.sqlite.zip, 61.6 MB), so it is
// fetched and cached like every other source rather than vendored here.
const LANE_ZIP_URL =
  "https://raw.githubusercontent.com/laneslexicon/LexiconDatabase/master/lexicon.sqlite.zip";

// The three Arabic-Arabic lexicons, from the same kind of place as Lane's:
// a zip tracked in its own repository, fetched and cached rather than
// vendored here. 48 MB compressed, 173 MB unpacked -- only three of its
// tables are read (see MUJAM_WORKS).
const MUJAM_ZIP_URL =
  "https://raw.githubusercontent.com/wizsk/arabic_lexicons/master/assets/data/db/db.sqlite.zip";

// A word-to-word dependency treebank (traditional iʿrāb) covering the whole
// Qur'an, from the same kind of place as Lane's and the Arabic lexicons: a
// .rar tracked in its own repository, fetched and cached, extracted with
// unrar-free the way unzip already handles the .zip archives above -- see
// ci.yml/deploy.yml's "Install unrar-free" step. 4.1 MB compressed, 57 MB
// unpacked (UTF-16LE; parseTreebankTSV normalizes the encoding).
const TREEBANK_RAR_URL =
  "https://raw.githubusercontent.com/NoorBayan/Quranic/main/corpus/Quranic.rar";

const TAFSIR_SRC_DIR = join(process.cwd(), "references", "tafsir", `ar-tafsir-al-${TAFSIR_SLUG}`);
const EXPORT_DIR = join(process.cwd(), "dist", "export");
const OUT_DIR = join(process.cwd(), "public", "data", "v1");

// --- invariants asserted against the known-correct corpus facts (see PLAN.md) ---
// Note: lemmas/rootedLemmas are 4783/4635, not the 4776/4629 estimated in the
// plan (a rough `sort -u` over LEM values). The pipeline counts one row per
// (root, lemma) pair, which is the semantically correct unit for index.json
// -- 6 lemma spellings are genuinely listed under two different roots in the
// source corpus (e.g. عصا under both عصو and عصي), so they get two rows.
const EXPECTED = {
  words: 77429,
  verses: 6236,
  surahs: 114,
  roots: 1651,
  lemmas: 4783,
  rootedLemmas: 4635,
  rootlessLemmas: 148,
  occurrences: 50269,
  // Segments carrying one of SYNTAX_TAGS -- 15,413 rootless particles plus
  // 1,601 rooted (1,151 of them PASS). See SyntaxIndexFile.
  syntaxRows: 17014,
  // Tafsir al-Jalalayn has no separate note for 226 of the 6,236 verses --
  // interior gaps across 56 surahs, 32 of them surah 55's repeated refrain.
  tafsirCoveredVerses: 6010,
  // Lane covers 1,617 of the 1,651 corpus roots. The 34 gaps are concentrated
  // in ك-ي, the letters he did not live to finish; the tail was assembled
  // posthumously from his notes and is far thinner (ع has 3,800 entries, ي 142).
  laneCoveredRoots: 1617,
  // At least one of the three Arabic lexicons covers 1,595 of the 1,651
  // roots. Per work: Maqayis 1,499, Mufradat 1,410, al-Sihah 1,484 -- the
  // spread is real, Mufradat being a lexicon of Qur'anic vocabulary rather
  // than of the language at large.
  mujamCoveredRoots: 1595,
  // The treebank's own real (non-elided) tokens that join onto one of this
  // corpus's 130,030 segments by (surah:ayah:word:segment). The ~1,800 gap
  // is two independently maintained corpora disagreeing on a handful of
  // segment boundaries -- see build-treebank.ts.
  treebankCoveredSegments: 128207,
  treebankTotalSegments: 130030,
  // Segments carrying at least one of case / mood / definiteness / PGN.
  // Well under the 130,030 total, because most particles and prefixes carry
  // none of the four and are deliberately not indexed. Dropped by 12,992
  // when the PGN reader stopped mistaking a preposition's repeated POS tag
  // ("P") for the plural agreement tag of the same spelling.
  morphologyRows: 89252,
  morphologyPgnTags: 24,
  // QCQL answers, asserted against the built corpus rather than in a unit
  // test: these are claims about the DATA, and a unit test that depended on
  // public/data/v1 having been built would not run on a fresh clone. Each
  // is independently derivable -- passive is the documented 1,151, and the
  // restriction count is what /syntax/ shows for RES.
  qcqlPassive: 1151,
  qcqlRestriction: 557,
  qcqlConditional: 1029,
  // Exactly one WORD in the corpus carries two rooted occurrences:
  // 20:94:2, يَبْنَؤُمَّ, from بني and أمم. QCQL matches at word
  // granularity, so this is the one position where an & of two different
  // roots can match. If a corpus change adds a second such word, the
  // language's semantics need re-examining -- hence an assertion, not a
  // comment.
  qcqlTwoRootedWords: 1,
  // Word positions carrying a verb. The three aspect facets and the two
  // voice facets each partition exactly this set, which is asserted below:
  // if a corpus change made a word both perfect and imperfect, or a verb
  // neither active nor passive, the grammar page's chips would double-count
  // or lose it silently.
  qcqlVerbPositions: 19353,
  // The sum of all 85 grammar-page facet counts. One number standing in for
  // 85, as a drift detector: any corpus or tagging change that moves any
  // facet trips it, and the per-facet numbers are then printed by the
  // failure. Not independently meaningful -- facets overlap heavily.
  //
  // Moved from 205133 to 205208 when build-roots.ts started reading each
  // occurrence's own classify() result for occurrences.json's catIdx,
  // instead of the word-form's (a homograph -- same rendered form text,
  // different tags on different occurrences -- could carry the wrong
  // category before). qcqlVerbPositions/qcqlPassive and every non-category
  // facet (case, mood, def, vf1-11, tag-*) are unaffected -- that fix only
  // ever moves an occurrence between two [cat=X] facets, or into/out of the
  // person-agreement facets (pgn-3ms etc, verb-only) as its now-corrected
  // category changes whether it belongs to a verb-conjugation facet at all.
  grammarFacetTotal: 205208,
  rootCounts: { كتب: 319, رحم: 339, علم: 854 } as Record<string, number>,
  maxMismatches: 50,
};

// Budgets below reflect the actual measured output of the real corpus (see
// `pnpm data:check` size report), not the rough pre-implementation estimates
// in PLAN.md -- those assumed lighter dedup than the data actually allows
// (e.g. forms.json carries every distinct diacritized surface form, not just
// bare stems). Kept with headroom above the current measured size so the
// budget still catches a real regression.
/**
 * The reading this build's text actually is. See ManifestReading: the app
 * previously described its text only as "the Uthmani text", which names an
 * orthography rather than a reading, and never said which of the canonical
 * readings it ships. Recorded in the manifest so it reaches the About page,
 * every citation, and anyone reading the data files directly.
 *
 * Verified against the built data rather than assumed: 6,236 verses, and
 * surahs/42.json splits حمٓ and عٓسٓقٓ into verses 1 and 2 -- the Kufan count.
 */
const READING = {
  transmission: "Hafs 'an 'Asim",
  transmissionAr: "حفص عن عاصم",
  edition: "1924 Cairo edition (Uthmani orthography)",
  verseNumbering: "Kufan",
  verseNumberingAr: "العدد الكوفي",
};

const BUDGETS_RAW_BYTES = {
  "index.json": 800 * 1024,
  "forms.json": 1000 * 1024,
  "en-index.json": 500 * 1024,
  "verse-roots.json": 700 * 1024,
  // Measured ~875 KB raw (every token of every verse, unlike verse-roots.json
  // which only carries rooted segments) -- less headroom than the other
  // budgets since there's little further to dedupe, but kept above the
  // measured size so a real regression still trips it.
  "ar-index.json": 1000 * 1024,
  // One row per rooted occurrence (~50,269), fully numeric (s,a,w,rootIdx,
  // lemmaIdx,catIdx,verbForm) -- see OccurrenceIndexFile.
  "occurrences.json": 2000 * 1024,
  // One row per syntactically-tagged segment (~17,014), columnar and fully
  // numeric apart from the 33-entry tag vocabulary -- see SyntaxIndexFile.
  "syntax.json": 400 * 1024,
  "morphology.json": 2400 * 1024,
};
const LARGEST_ROOT_BUDGET_RAW = 60 * 1024;
// The seven alternative transmissions, sharded per surah (~1.6 MB per
// riwaya). Budgeted separately and excluded from the core totals -- see the
// emit call site for why.
const READINGS_BUDGET_RAW = 14 * 1024 * 1024;
// Tafsir al-Jalalayn, sharded per surah (~3.1 MB). Budgeted separately and
// excluded from the core totals, same as readings/.
const TAFSIR_BUDGET_RAW = 6 * 1024 * 1024;
// Lane's Lexicon restricted to this corpus's roots, one shard per root
// (~21 MB raw / ~6 MB gz measured). Excluded from the core totals, as above.
const LANE_BUDGET_RAW = 32 * 1024 * 1024;
// The three Arabic lexicons restricted to this corpus's roots, one shard per
// root carrying all three (~9.3 MB of source text measured). Excluded from
// the core totals, as above.
const MUJAM_BUDGET_RAW = 16 * 1024 * 1024;
// The dependency treebank, sharded per surah, one entry per covered segment
// (~128,207 across all 114 files). Excluded from the core totals, as above.
const TREEBANK_BUDGET_RAW = 12 * 1024 * 1024;
// Raised from 9 MiB: adding Pickthall's translation to every verse grew
// surahs/*.json by ~900 KB raw (measured 9.18 MiB total). Gzipped total
// barely moved (~2.66 MiB, well under TOTAL_GZ_BUDGET) since English prose
// compresses well -- raw is what actually needed headroom.
// Raised again for occurrences.json (cross-corpus faceted search index,
// ~1.4 MB raw / ~350 KB gz measured) -- both budgets kept with headroom
// above the current measured totals, not tight to them.
// Raised a third time for syntax.json (the syntactic/rhetorical layer, ~215
// KB raw / ~34 KB gz measured). Raw is again what needed the headroom: the
// file is mostly small integers, which gzip collapses to almost nothing but
// which cost ~4 bytes each uncompressed. Before this raise the total sat at
// 12.45 of 12.5 MiB -- ~55 KiB of raw headroom, too tight to absorb any new
// index at all, which is the real reason for the increase.
// Raised a fourth time for three more English translations (Yusuf Ali,
// Rodwell, Sale) alongside Saheeh International and Pickthall -- the same
// kind of growth as the first raise above, in the same file
// (surahs/*.json), for the same reason (English prose compresses well, so
// raw needed the headroom, not gz). Measured total after adding them:
// 15.60 MiB raw / 4.24 MiB gz. Both budgets kept with headroom above that,
// not tight to it.
const TOTAL_RAW_BUDGET = 17 * 1024 * 1024;
const TOTAL_GZ_BUDGET = 4.75 * 1024 * 1024;

/**
 * Downloads and unpacks the lexicon database, caching both the archive and
 * the unpacked file under data/raw so a rebuild costs nothing.
 *
 * `unzip` is used rather than a bundled dependency: Node has no built-in zip
 * reader, and this project ships four runtime dependencies deliberately.
 */
async function fetchLaneDb(): Promise<string> {
  const dbPath = join(RAW_DIR, "lexicon.sqlite");
  if (existsSync(dbPath) && !FORCE) return dbPath;

  const zipPath = join(RAW_DIR, "lexicon.sqlite.zip");
  if (!existsSync(zipPath) || FORCE) {
    const zip = await fetchBufferWithRetry(LANE_ZIP_URL, { label: "Lane's Lexicon" });
    mkdirSync(RAW_DIR, { recursive: true });
    writeFileSync(zipPath, zip);
  }
  execFileSync("unzip", ["-o", "-j", zipPath, "lexicon.sqlite", "-d", RAW_DIR], { stdio: "pipe" });
  if (!existsSync(dbPath)) fail(`unzip did not produce ${dbPath}`);
  return dbPath;
}

/** Reads every lexicon article, grouped by Lane's own root spelling. */
function readLaneEntries(dbPath: string): Map<string, RawLaneEntry[]> {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const rows = db
      .prepare(
        "select root, word, xml, page from entry where root is not null and xml is not null order by root, nodenum",
      )
      .all() as unknown as RawLaneEntry[];
    const byRoot = new Map<string, RawLaneEntry[]>();
    for (const row of rows) {
      const list = byRoot.get(row.root);
      if (list) list.push(row);
      else byRoot.set(row.root, [row]);
    }
    return byRoot;
  } finally {
    db.close();
  }
}

/**
 * Downloads and unpacks the Arabic lexicon database, caching both the
 * archive and the unpacked file, exactly as fetchLaneDb does.
 */
async function fetchMujamDb(): Promise<string> {
  const dbPath = join(RAW_DIR, "mujam.sqlite");
  if (existsSync(dbPath) && !FORCE) return dbPath;

  const zipPath = join(RAW_DIR, "mujam.sqlite.zip");
  if (!existsSync(zipPath) || FORCE) {
    const zip = await fetchBufferWithRetry(MUJAM_ZIP_URL, { label: "the Arabic lexicons" });
    mkdirSync(RAW_DIR, { recursive: true });
    writeFileSync(zipPath, zip);
  }
  execFileSync("unzip", ["-o", "-j", zipPath, "db.sqlite", "-d", RAW_DIR], { stdio: "pipe" });
  const unzipped = join(RAW_DIR, "db.sqlite");
  if (!existsSync(unzipped)) fail(`unzip did not produce ${unzipped}`);
  renameSync(unzipped, dbPath);
  return dbPath;
}

/**
 * Downloads and unpacks the dependency treebank, caching the archive and
 * the extracted file. Unlike fetchLaneDb/fetchMujamDb the payload is a
 * single UTF-16LE-encoded CSV (Quranic.csv), not a database -- read here
 * and decoded to a UTF-8 string for parseTreebankTSV.
 */
async function fetchTreebankCsv(): Promise<string> {
  const csvPath = join(RAW_DIR, "treebank.csv");
  if (!existsSync(csvPath) || FORCE) {
    const rarPath = join(RAW_DIR, "treebank.rar");
    if (!existsSync(rarPath) || FORCE) {
      const rar = await fetchBufferWithRetry(TREEBANK_RAR_URL, { label: "the dependency treebank" });
      mkdirSync(RAW_DIR, { recursive: true });
      writeFileSync(rarPath, rar);
    }
    execFileSync("unrar", ["x", "-o+", rarPath, `${RAW_DIR}/`], { stdio: "pipe" });
    const extracted = join(RAW_DIR, "Quranic.csv");
    if (!existsSync(extracted)) fail(`unrar did not produce ${extracted}`);
    renameSync(extracted, csvPath);
  }
  return readFileSync(csvPath).toString("utf16le");
}

/**
 * Reads the three lexicons this project ships, keyed by work id.
 *
 * Only the three tables named in MUJAM_WORKS are touched. The same database
 * carries modern in-copyright dictionaries; not reading them is the point.
 */
function readMujamEntries(dbPath: string): Map<string, RawMujamEntry[]> {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const byWork = new Map<string, RawMujamEntry[]>();
    for (const work of MUJAM_WORKS) {
      const rows = db
        .prepare(
          `select word, meanings from ${MUJAM_SOURCE_TABLE[work.id]} where word is not null and meanings is not null order by id`,
        )
        .all() as unknown as RawMujamEntry[];
      byWork.set(work.id, rows);
    }
    return byWork;
  } finally {
    db.close();
  }
}

function fail(message: string): never {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

function assertEqual(label: string, actual: number, expected: number, errors: string[]) {
  if (actual !== expected) {
    errors.push(`${label}: expected ${expected}, got ${actual}`);
  }
}

async function main() {
  console.log(
    `Data pipeline starting (${CHECK_ONLY ? "check-only" : "build"} mode)${FORCE ? ", forced refetch" : ""}`,
  );

  // --- 1. Download ---
  const [morphology, rootsGloss, pickthall, yusufAli, rodwell, sale] = await Promise.all([
    fetchCached(MORPHOLOGY_URL, "quran-morphology.txt", { force: FORCE }),
    fetchCachedJSON<RootsGlossMap>(ROOTS_GLOSS_URL, "roots_index.json", { force: FORCE }),
    fetchCachedJSON<FawazEdition>(PICKTHALL_URL, "pickthall.json", { force: FORCE }),
    fetchCachedJSON<FawazEdition>(YUSUF_ALI_URL, "yusuf-ali.json", { force: FORCE }),
    fetchCachedJSON<FawazEdition>(RODWELL_URL, "rodwell.json", { force: FORCE }),
    fetchCachedJSON<FawazEdition>(SALE_URL, "sale.json", { force: FORCE }),
  ]);

  const readingEditions = new Map<string, RawEdition>(
    await Promise.all(
      RIWAYAT.map(
        async (r) =>
          [
            r.slug,
            (
              await fetchCachedJSON<RawEdition>(READING_URL(r.slug), `reading-${r.slug}.json`, {
                force: FORCE,
              })
            ).data,
          ] as const,
      ),
    ),
  );
  function byRef(edition: FawazEdition): Map<string, string> {
    const map = new Map<string, string>();
    for (const v of edition.quran) map.set(`${v.chapter}:${v.verse}`, v.text);
    return map;
  }
  const pickthallByRef = byRef(pickthall.data);
  const yusufAliByRef = byRef(yusufAli.data);
  const rodwellByRef = byRef(rodwell.data);
  const saleByRef = byRef(sale.data);
  for (const [label, map] of [
    ["Pickthall", pickthallByRef],
    ["Yusuf Ali", yusufAliByRef],
    ["Rodwell", rodwellByRef],
    ["Sale", saleByRef],
  ] as const) {
    if (map.size < EXPECTED.verses - 50) {
      console.warn(
        `Warning: ${label} translation only covers ${map.size}/${EXPECTED.verses} verses; some verses will show Saheeh International only.`,
      );
    }
  }

  const chapters: QuranJsonChapter[] = [];
  for (let n = 1; n <= 114; n++) {
    const { data } = await fetchCachedJSON<QuranJsonChapter>(
      QURAN_JSON_CHAPTER_URL(n),
      `quran-json/chapters/en/${n}.json`,
      { force: FORCE },
    );
    chapters.push(data);
  }
  chapters.sort((a, b) => a.id - b.id);
  console.log(
    `Downloaded morphology (${morphology.text.length.toLocaleString()} chars) and ${chapters.length} chapters.`,
  );

  // --- 2. Parse ---
  const words: RawWord[] = parseMorphologyTSV(morphology.text);
  const totalSegments = words.reduce((sum, w) => sum + w.segments.length, 0);
  console.log(
    `Parsed ${words.length.toLocaleString()} words / ${totalSegments.toLocaleString()} segments.`,
  );

  // --- 3. Build surahs (+ per-verse validation against quran-json) ---
  const { surahFiles, meta, mismatches } = buildSurahs(
    words,
    chapters,
    pickthallByRef,
    yusufAliByRef,
    rodwellByRef,
    saleByRef,
  );

  // --- 4. Build roots / lemmas / forms ---
  const {
    indexRoots,
    indexLemmas,
    rootFiles,
    lemmaFiles,
    formsEntries,
    occurrenceIndex,
    unmappedGlossRoots,
    unusedGlossRoots,
    rootTextToGlobalIdx,
  } = buildRoots(words, rootsGloss.data);

  if (unusedGlossRoots.length > 0) {
    console.warn(
      `Warning: ${unusedGlossRoots.length} gloss entries have no matching root in the morphology corpus (first few: ${unusedGlossRoots.slice(0, 5).join(", ")}).`,
    );
  }
  if (unmappedGlossRoots.length > 0) {
    console.warn(
      `Warning: ${unmappedGlossRoots.length} roots have no gloss (first few: ${unmappedGlossRoots.slice(0, 5).join(", ")}).`,
    );
  }

  // --- 5. Build English inverted index ---
  const indexableVerses: IndexableVerse[] = [];
  const arIndexableVerses: ArIndexableVerse[] = [];
  let globalId = 0;
  const globalIdOf = new Map<string, number>();
  for (const surahMeta of meta.surahs) {
    const surah = surahFiles.get(surahMeta.n)!;
    for (const verse of surah.verses) {
      globalIdOf.set(`${surahMeta.n}:${verse.a}`, globalId);
      indexableVerses.push({ globalId, translation: verse.t });
      arIndexableVerses.push({ globalId, tokens: verse.w });
      globalId++;
    }
  }
  const enIndex = buildEnIndex(indexableVerses);
  const arIndex: ArIndexFile = buildArIndex(arIndexableVerses);

  // --- 5b. Build the global per-verse rooted-word index ---
  const verseRoots: VerseRootsFile = buildVerseRoots(words, rootTextToGlobalIdx, globalIdOf);

  // --- 5b-i. Shard the alternative transmissions ---
  const versesPerSurah = new Map(
    [...surahFiles.entries()].map(([n, file]) => [n, file.verses.map((v) => v.a)] as const),
  );
  const readings = buildReadings(readingEditions, versesPerSurah);

  // Read from the repo, not the network: this tafsir is committed under
  // references/ (3.1 MB) and was sitting there unread.
  const tafsirRows = new Map<number, RawTafsirRow[]>(
    meta.surahs.map((sm) => [
      sm.n,
      JSON.parse(readFileSync(join(TAFSIR_SRC_DIR, `${sm.n}.json`), "utf8")) as RawTafsirRow[],
    ]),
  );
  const tafsir = buildTafsir(tafsirRows, versesPerSurah);

  // --- 5b-iv. Lane's Lexicon ---
  const lane = buildLane(
    readLaneEntries(await fetchLaneDb()),
    indexRoots.map((r) => r.ar),
  );

  // --- 5b-v. The three Arabic-Arabic lexicons ---
  const mujam = buildMujam(
    readMujamEntries(await fetchMujamDb()),
    indexRoots.map((r) => r.ar),
  );

  // --- 5b-vi. Dependency treebank (traditional iʿrāb) ---
  const treebankLocations = new Set<string>();
  for (const word of words) {
    for (const seg of word.segments) {
      treebankLocations.add(`${seg.s}:${seg.a}:${seg.w}:${seg.seg}`);
    }
  }
  const treebank = buildTreebank(parseTreebankTSV(await fetchTreebankCsv()), treebankLocations);

  // --- 5b-ii. Build the corpus-wide syntactic / rhetorical index ---
  const syntaxIndex = buildSyntax(words);
  const morphologyIndex = buildMorphology(words);

  // --- 5c. Build corpus-wide curiosities for /insights/ ---
  const insights = buildInsights(
    words,
    rootFiles,
    lemmaFiles,
    indexRoots,
    indexLemmas,
    meta.surahs.length,
    surahFiles,
  );
  const rhyme = buildRhyme(surahFiles);
  const distinctiveVocab = buildDistinctiveVocab(rootFiles, indexRoots, meta.surahs.length);
  const collocations = buildCollocations(words);
  const abjad = buildAbjad(words, meta.surahs.length, globalIdOf);
  const verseCountByRoot = new Map(indexRoots.map((r) => [r.ar, r.verseCount]));
  const cooccurrence = buildCooccurrence(words, verseCountByRoot, indexableVerses.length);
  const patterns = buildPatterns(words);
  const formulas = buildFormulas(surahFiles);
  const verseSimilarity = buildVerseSimilarity(words, globalIdOf);
  const divineNamePairs = buildDivineNamePairs(
    occurrenceIndex,
    indexRoots,
    indexLemmas,
    DIVINE_NAME_TOPICS,
  );
  const corpusExportCsv = buildCorpusExportCsv(words, surahFiles, meta);
  const corpusExportBytes = Buffer.byteLength(corpusExportCsv, "utf8");
  const codebookJson = buildCodebookJson(words.length);
  const corpusColumnsCsv = buildCorpusColumnsCsv();

  // --- 6. Validate invariants ---
  const errors: string[] = [];
  assertEqual("words", words.length, EXPECTED.words, errors);
  assertEqual("verses", indexableVerses.length, EXPECTED.verses, errors);
  assertEqual("surahs", meta.surahs.length, EXPECTED.surahs, errors);
  assertEqual("roots", indexRoots.length, EXPECTED.roots, errors);
  assertEqual("lemmas", indexLemmas.length, EXPECTED.lemmas, errors);
  assertEqual(
    "rootedLemmas",
    indexLemmas.filter((l) => l.rootIdx !== -1).length,
    EXPECTED.rootedLemmas,
    errors,
  );
  assertEqual(
    "rootlessLemmas",
    indexLemmas.filter((l) => l.rootIdx === -1).length,
    EXPECTED.rootlessLemmas,
    errors,
  );
  const totalOccurrences = indexRoots.reduce((sum, r) => sum + r.count, 0);
  assertEqual("occurrences", totalOccurrences, EXPECTED.occurrences, errors);

  const verseRootsEntryCount = verseRoots.reduce((sum, v) => sum + v.length, 0);
  assertEqual("verse-roots.json entry count", verseRootsEntryCount, EXPECTED.occurrences, errors);
  assertEqual(
    "occurrences.json row count",
    occurrenceIndex.rows.length,
    EXPECTED.occurrences,
    errors,
  );
  assertEqual("syntax.json row count", syntaxIndex.t.length, EXPECTED.syntaxRows, errors);
  assertEqual(
    "morphology.json row count",
    morphologyIndex.s.length,
    EXPECTED.morphologyRows,
    errors,
  );
  assertEqual(
    "morphology.json PGN vocabulary size",
    morphologyIndex.pgnTags.length,
    EXPECTED.morphologyPgnTags,
    errors,
  );
  for (const column of ["a", "w", "g", "c", "m", "d", "p"] as const) {
    if (morphologyIndex[column].length !== morphologyIndex.s.length) {
      errors.push(
        `morphology.json column "${column}": expected ${morphologyIndex.s.length} entries, got ${morphologyIndex[column].length}`,
      );
    }
  }
  if (
    [...morphologyIndex.pgnTags].sort().join("\u0000") !== morphologyIndex.pgnTags.join("\u0000")
  ) {
    errors.push("morphology.json pgnTags must be sorted, or its ids are not stable across builds");
  }

  // --- QCQL, run against the corpus it will actually query ---
  // The language's own grammar and set algebra are unit-tested hermetically
  // (src/test/qcql-*.test.ts). What cannot be tested there is whether it
  // returns the right ANSWERS, because that is a fact about this data.
  {
    const qcqlCorpus = {
      occurrences: occurrenceIndex,
      syntax: syntaxIndex,
      index: { roots: indexRoots, lemmas: indexLemmas },
      surahs: meta.surahs,
      morphology: morphologyIndex,
    };
    const ask = (src: string) => executeQcql(parseQcql(src), qcqlCorpus).matches;

    assertEqual("qcql [PASS]", ask("[PASS]").length, EXPECTED.qcqlPassive, errors);
    assertEqual("qcql [RES]", ask("[RES]").length, EXPECTED.qcqlRestriction, errors);
    assertEqual("qcql [COND]", ask("[COND]").length, EXPECTED.qcqlConditional, errors);

    // A root's matches must agree with the count index.json publishes for
    // it, or the query language and the rest of the app disagree about what
    // an occurrence is.
    for (const root of ["علم", "كتب", "رحم"]) {
      const published = indexRoots.find((r) => r.ar === root)?.count;
      assertEqual(`qcql [root=${root}]`, ask(`[root=${root}]`).length, published ?? -1, errors);
    }

    // Meccan and Medinan must partition a result, with nothing lost.
    assertEqual(
      "qcql meccan + medinan = unfiltered",
      ask("[PASS] :: meccan").length + ask("[PASS] :: medinan").length,
      EXPECTED.qcqlPassive,
      errors,
    );

    const seen = new Set<number>();
    const twoRooted = new Set<number>();
    for (const row of occurrenceIndex.rows) {
      const key = (row[0] * 1000 + row[1]) * 1000 + row[2];
      if (seen.has(key)) twoRooted.add(key);
      else seen.add(key);
    }
    assertEqual(
      "words carrying two rooted occurrences",
      twoRooted.size,
      EXPECTED.qcqlTwoRootedWords,
      errors,
    );
    if (twoRooted.size === 1 && !twoRooted.has((20 * 1000 + 94) * 1000 + 2)) {
      errors.push("the one two-rooted word is no longer 20:94:2; QCQL's docs name it");
    }

    // --- The grammar page's facets ---
    // Every chip on /syntax/ is a QCQL query (src/lib/grammar/facets.ts),
    // and its count is computed by running that query at build time. A
    // facet that returns nothing is a bug in the facet, not a finding about
    // the Qur'an, so an empty one fails the build here rather than showing
    // a reader a confident zero.
    const facetCounts = new Map<string, number>();
    for (const facet of ALL_FACETS) facetCounts.set(facet.id, ask(facet.q).length);

    const emptyFacets = [...facetCounts].filter(([, n]) => n === 0).map(([id]) => id);
    if (emptyFacets.length > 0) {
      errors.push(`grammar facets returning nothing: ${emptyFacets.join(", ")}`);
    }

    const facet = (id: string) => facetCounts.get(id) ?? -1;
    const verbs = ask("[pos=V]").length;
    assertEqual("qcql [pos=V]", verbs, EXPECTED.qcqlVerbPositions, errors);
    assertEqual(
      "grammar aspect facets partition the verbs",
      facet("perf") + facet("impf") + facet("impv"),
      verbs,
      errors,
    );
    assertEqual(
      "grammar voice facets partition the verbs",
      facet("active") + facet("passive"),
      verbs,
      errors,
    );
    // --- The comparison tool on /insights/ ---
    // Keyness and dispersion are computed in the browser over a scope the
    // reader picks, so no unit test can pin what they SAY about the
    // Qur'an. These assertions do, over the real corpus: the measures are
    // only worth shipping if they recover things independently known.
    {
      const refs = buildVerseRefs(meta);
      const rootCount = indexRoots.length;
      const nameOf = (rootIdx: number) => indexRoots[rootIdx]?.ar ?? "?";
      const scopeOf = (scope: Parameters<typeof compareScope>[2]) =>
        compareScope(verseRoots, refs, scope, rootCount, 5);

      const medinan = scopeOf({ kind: "revelation", value: "medinan" });
      const meccan = scopeOf({ kind: "revelation", value: "meccan" });

      // The two revelation scopes partition every rooted occurrence: each
      // is the other's reference, and nothing may fall between them.
      assertEqual(
        "keyness meccan + medinan = every occurrence",
        meccan.scopeTokens + medinan.scopeTokens,
        EXPECTED.occurrences,
        errors,
      );
      assertEqual(
        "keyness medinan's reference is the Meccan corpus",
        medinan.referenceTokens,
        meccan.scopeTokens,
        errors,
      );

      // Over-used vocabulary that any student of the Qur'an would predict.
      // Asserted as ordinal facts and floors rather than exact G² values,
      // which would pin four decimal places of a float to no purpose.
      const topOver = (r: ReturnType<typeof compareScope>, n: number) =>
        r.rows
          .filter((row) => row.keyness.overused)
          .slice(0, n)
          .map((row) => nameOf(row.rootIdx));

      const medinanTop = topOver(medinan, 8);
      if (medinanTop[0] !== "\u0623\u0644\u0647") {
        errors.push(`keyness: the top Medinan root should be أله, got ${medinanTop[0]}`);
      }
      for (const root of ["\u0646\u0641\u0642", "\u0642\u062a\u0644"]) {
        if (!medinanTop.includes(root)) {
          errors.push(
            `keyness: ${root} should be among the top Medinan roots (${medinanTop.join(" ")})`,
          );
        }
      }
      const meccanTop = topOver(meccan, 8);
      if (meccanTop[0] !== "\u0631\u0628\u0628") {
        errors.push(`keyness: the top Meccan root should be ربب, got ${meccanTop[0]}`);
      }

      // Surah 12 is one story, and the measure should recover its cast.
      const yusuf = topOver(scopeOf({ kind: "surah", n: 12 }), 6);
      for (const root of ["\u0623\u0628\u0648", "\u0633\u062c\u0646"]) {
        if (!yusuf.includes(root)) {
          errors.push(`keyness: ${root} should be key to surah 12 (${yusuf.join(" ")})`);
        }
      }

      // Dispersion must separate general vocabulary from topic vocabulary.
      const dispersionByRoot = new Map(
        corpusDispersion(verseRoots, refs, rootCount, meta.surahs.length).map((row) => [
          nameOf(row.rootIdx),
          row.dispersion,
        ]),
      );
      const spread = dispersionByRoot.get("\u0639\u0644\u0645"); // علم, everywhere
      const clumped = dispersionByRoot.get("\u0646\u0633\u0648"); // نسو, one subject
      if (!spread || !clumped) {
        errors.push("dispersion: expected roots علم and نسو to be measurable");
      } else {
        if (!(spread.dp < 0.25))
          errors.push(`dispersion: علم should be evenly spread, DP=${spread.dp}`);
        if (!(clumped.dp > 0.5))
          errors.push(`dispersion: نسو should be concentrated, DP=${clumped.dp}`);
        if (!(clumped.dp > spread.dp))
          errors.push("dispersion: نسو must be more concentrated than علم");
      }
      assertEqual("dispersion covers every root", dispersionByRoot.size, EXPECTED.roots, errors);
    }

    const facetTotal = [...facetCounts.values()].reduce((sum, n) => sum + n, 0);
    if (facetTotal !== EXPECTED.grammarFacetTotal) {
      errors.push(
        `grammar facet total: expected ${EXPECTED.grammarFacetTotal}, got ${facetTotal} (${[
          ...facetCounts,
        ]
          .map(([id, n]) => `${id}=${n}`)
          .join(" ")})`,
      );
    }
  }
  assertEqual(
    "readings shard count",
    readings.files.size,
    RIWAYAT.length * meta.surahs.length,
    errors,
  );
  assertEqual("readings riwaya count", readings.meta.riwayat.length, RIWAYAT.length, errors);
  assertEqual("tafsir shard count", tafsir.files.size, meta.surahs.length, errors);
  // Coverage is partial by nature (see buildTafsir); asserted so a source
  // change that silently drops commentary is caught, not so it reaches 6,236.
  assertEqual(
    "tafsir covered verses",
    tafsir.meta.coveredVerses,
    EXPECTED.tafsirCoveredVerses,
    errors,
  );
  // Partial by nature (see buildLane); asserted so a source or matching
  // change that silently loses articles is caught, not to reach 1,651.
  assertEqual("lane covered roots", lane.meta.coveredRoots, EXPECTED.laneCoveredRoots, errors);
  // Partial by nature, and unevenly so per work (see buildMujam); asserted
  // so a source or matching change that silently drops roots fails loudly.
  assertEqual("mujam covered roots", mujam.meta.coveredRoots, EXPECTED.mujamCoveredRoots, errors);
  assertEqual("treebank shard count", treebank.files.size, meta.surahs.length, errors);
  // Partial by nature (two independently segmented corpora, see
  // build-treebank.ts); asserted so a source or join change that silently
  // drops coverage is caught, not so it reaches 130,030.
  assertEqual(
    "treebank covered segments",
    treebank.meta.coveredSegments,
    EXPECTED.treebankCoveredSegments,
    errors,
  );
  assertEqual(
    "treebank total segments",
    treebank.meta.totalSegments,
    EXPECTED.treebankTotalSegments,
    errors,
  );
  assertEqual(
    "syntax.json tag vocabulary size",
    syntaxIndex.tags.length,
    SYNTAX_TAGS.length,
    errors,
  );
  for (const column of ["s", "a", "w", "g"] as const) {
    if (syntaxIndex[column].length !== syntaxIndex.t.length) {
      errors.push(
        `syntax.json column "${column}": expected ${syntaxIndex.t.length} entries, got ${syntaxIndex[column].length}`,
      );
    }
  }
  // describeTag() echoes the raw tag back when it knows no label, so an
  // unlabelled tag is exactly one whose English label is the code itself.
  // Checked here rather than in a unit test so a corpus change trips it too.
  for (const tag of syntaxIndex.tags) {
    if (describeTag(tag).en === tag)
      errors.push(`syntax.json tag "${tag}" has no label in tagLabels.ts`);
  }
  if (verseRoots.length !== indexableVerses.length) {
    errors.push(
      `verse-roots.json length: expected ${indexableVerses.length} (one per verse), got ${verseRoots.length}`,
    );
  }

  if (arIndex.length !== indexableVerses.length) {
    errors.push(
      `ar-index.json length: expected ${indexableVerses.length} (one per verse), got ${arIndex.length}`,
    );
  }
  const arIndexTokenCount = arIndex.reduce((sum, v) => sum + v.length, 0);
  assertEqual("ar-index.json token count", arIndexTokenCount, EXPECTED.words, errors);

  for (const [root, expectedCount] of Object.entries(EXPECTED.rootCounts)) {
    const row = indexRoots.find((r) => r.ar === root);
    if (!row) {
      errors.push(`root count check: root "${root}" not found`);
    } else {
      assertEqual(`root count for ${root}`, row.count, expectedCount, errors);
    }
  }

  if (mismatches.length > EXPECTED.maxMismatches) {
    errors.push(
      `mismatches: ${mismatches.length} verses mismatched, expected <= ${EXPECTED.maxMismatches}`,
    );
  }

  // Assert every root file's forms/lemmas indices resolve, and no root-key collisions.
  const seenRootKeys = new Map<string, string>();
  for (const row of indexRoots) {
    const prior = seenRootKeys.get(row.key);
    if (prior && prior !== row.ar) {
      errors.push(`root key collision: "${prior}" and "${row.ar}" both normalize to "${row.key}"`);
    }
    seenRootKeys.set(row.key, row.ar);
  }

  // Assert every curated topic's roots/lemmas actually resolve in this
  // corpus build -- a typo'd root/lemma key in topicDefinitions.ts would
  // otherwise silently resolve to zero verses at runtime instead of
  // failing here.
  const seenTopicSlugs = new Set<string>();
  for (const topic of ALL_TOPICS) {
    if (seenTopicSlugs.has(topic.slug)) {
      errors.push(`topic slug collision: "${topic.slug}" is used by more than one topic`);
    }
    seenTopicSlugs.add(topic.slug);
    if (topic.sources.length === 0) {
      errors.push(`topic "${topic.slug}": has no sources`);
    }
    const seenSourceKeys = new Set<string>();
    for (const source of topic.sources) {
      const sourceKey =
        topicSourceFileKey(source) + (source.kind === "rootedLemma" ? `:${source.lemmaKey}` : "");
      if (seenSourceKeys.has(sourceKey)) {
        errors.push(`topic "${topic.slug}": duplicate source ${sourceKey}`);
      }
      seenSourceKeys.add(sourceKey);

      if (source.kind === "root") {
        if (!rootFiles.has(source.root)) {
          errors.push(
            `topic "${topic.slug}": root "${source.root}" not found in this corpus build`,
          );
        }
      } else if (source.kind === "rootedLemma") {
        const rf = rootFiles.get(source.root);
        if (!rf) {
          errors.push(
            `topic "${topic.slug}": root "${source.root}" not found in this corpus build`,
          );
        } else if (!rf.lemmas.some((l) => l.key === source.lemmaKey)) {
          errors.push(
            `topic "${topic.slug}": lemma key "${source.lemmaKey}" not found under root "${source.root}"`,
          );
        }
      } else {
        if (!lemmaFiles.has(source.lemmaKey)) {
          errors.push(
            `topic "${topic.slug}": rootless lemma key "${source.lemmaKey}" not found in this corpus build`,
          );
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error(`\n${errors.length} invariant(s) failed:`);
    for (const e of errors) console.error(`  - ${e}`);
    fail("Data pipeline invariants failed.");
  }
  console.log("✓ All invariants passed.");

  // --- 7. Manifest ---
  const hashInput =
    morphology.sha256 + rootsGloss.sha256 + pickthall.sha256 + chapters.map((c) => c.id).join(",");
  const manifest: ManifestFile = {
    version: "v1",
    builtAt: new Date().toISOString(),
    hash: createHash("sha256").update(hashInput).digest("hex").slice(0, 16),
    counts: {
      segments: totalSegments,
      words: words.length,
      verses: indexableVerses.length,
      surahs: meta.surahs.length,
      roots: indexRoots.length,
      lemmas: indexLemmas.length,
      rootedLemmas: indexLemmas.filter((l) => l.rootIdx !== -1).length,
      rootlessLemmas: indexLemmas.filter((l) => l.rootIdx === -1).length,
      occurrences: totalOccurrences,
      corpusExportBytes,
    },
    sources: SOURCES,
    reading: READING,
    mismatches,
  };

  if (CHECK_ONLY) {
    console.log("\n--check mode: skipping file writes.");
    printSizeEstimate({
      surahFiles,
      meta,
      indexRoots,
      indexLemmas,
      formsEntries,
      enIndex,
      verseRoots,
      syntaxIndex,
      morphologyIndex,
      arIndex,
      occurrenceIndex,
      insights,
      rhyme,
      distinctiveVocab,
      collocations,
      abjad,
      cooccurrence,
      patterns,
      formulas,
      verseSimilarity,
      divineNamePairs,
      corpusExportBytes,
      codebookJson,
      corpusColumnsCsv,
      rootFiles,
      lemmaFiles,
      manifest,
    });
    return;
  }

  // --- 8. Emit ---
  if (existsSync(OUT_DIR)) {
    for (const entry of readdirSync(OUT_DIR)) {
      if (entry === ".gitkeep") continue;
      rmSync(join(OUT_DIR, entry), { recursive: true, force: true });
    }
  }
  mkdirSync(OUT_DIR, { recursive: true });

  const report = new SizeReport();

  const manifestSize = writeJSON(join(OUT_DIR, "manifest.json"), manifest);
  report.record("manifest.json", manifestSize.rawBytes, manifestSize.gzBytes);

  const metaSize = writeJSON(join(OUT_DIR, "meta.json"), meta);
  report.record("meta.json", metaSize.rawBytes, metaSize.gzBytes);

  const indexSize = writeJSON(join(OUT_DIR, "index.json"), {
    roots: indexRoots,
    lemmas: indexLemmas,
  });
  report.record("index.json", indexSize.rawBytes, indexSize.gzBytes);
  if (indexSize.rawBytes > BUDGETS_RAW_BYTES["index.json"]) {
    fail(
      `index.json exceeds its budget: ${indexSize.rawBytes} > ${BUDGETS_RAW_BYTES["index.json"]} bytes`,
    );
  }

  const formsSize = writeJSON(join(OUT_DIR, "forms.json"), formsEntries);
  report.record("forms.json", formsSize.rawBytes, formsSize.gzBytes);
  if (formsSize.rawBytes > BUDGETS_RAW_BYTES["forms.json"]) {
    fail(
      `forms.json exceeds its budget: ${formsSize.rawBytes} > ${BUDGETS_RAW_BYTES["forms.json"]} bytes`,
    );
  }

  const enIndexSize = writeJSON(join(OUT_DIR, "en-index.json"), enIndex);
  report.record("en-index.json", enIndexSize.rawBytes, enIndexSize.gzBytes);
  if (enIndexSize.rawBytes > BUDGETS_RAW_BYTES["en-index.json"]) {
    fail(
      `en-index.json exceeds its budget: ${enIndexSize.rawBytes} > ${BUDGETS_RAW_BYTES["en-index.json"]} bytes`,
    );
  }

  const verseRootsSize = writeJSON(join(OUT_DIR, "verse-roots.json"), verseRoots);
  report.record("verse-roots.json", verseRootsSize.rawBytes, verseRootsSize.gzBytes);
  if (verseRootsSize.rawBytes > BUDGETS_RAW_BYTES["verse-roots.json"]) {
    fail(
      `verse-roots.json exceeds its budget: ${verseRootsSize.rawBytes} > ${BUDGETS_RAW_BYTES["verse-roots.json"]} bytes`,
    );
  }

  const readingsMetaSize = writeJSON(join(OUT_DIR, "readings", "meta.json"), readings.meta);
  report.record("readings/meta.json", readingsMetaSize.rawBytes, readingsMetaSize.gzBytes);
  const readingSizes = [...readings.files.entries()].map(([key, file]) =>
    writeJSON(join(OUT_DIR, "readings", `${key}.json`), file),
  );
  // Recorded but NOT counted toward the core totals: these are an apparatus
  // a reader opts into per verse, fetched lazily and deliberately left out
  // of prefetchAll's offline warm-up. Counting ~11 MB of alternative text
  // against the core budget would mean either refusing the feature or
  // doubling the "download everything for offline" cost for every visitor,
  // neither of which reflects what this data is for. It still gets its own
  // budget, immediately below.
  const readingsRaw = readingSizes.reduce((sum, x) => sum + x.rawBytes, 0);
  const readingsGz = readingSizes.reduce((sum, x) => sum + x.gzBytes, 0);
  report.record("readings/*/*.json", readingsRaw, readingsGz, false);
  if (readingsRaw > READINGS_BUDGET_RAW) {
    fail(`readings/ exceeds its budget: ${readingsRaw} > ${READINGS_BUDGET_RAW} bytes`);
  }

  const mujamMetaSize = writeJSON(join(OUT_DIR, "mujam", "meta.json"), mujam.meta);
  report.record("mujam/meta.json", mujamMetaSize.rawBytes, mujamMetaSize.gzBytes);
  const mujamSizes = [...mujam.files.entries()].map(([root, file]) =>
    writeJSON(join(OUT_DIR, "mujam", `${root}.json`), file),
  );
  const mujamRaw = mujamSizes.reduce((sum, x) => sum + x.rawBytes, 0);
  const mujamGz = mujamSizes.reduce((sum, x) => sum + x.gzBytes, 0);
  report.record("mujam/*.json", mujamRaw, mujamGz, false);
  if (mujamRaw > MUJAM_BUDGET_RAW) {
    fail(`mujam/ exceeds its budget: ${mujamRaw} > ${MUJAM_BUDGET_RAW} bytes`);
  }

  const laneMetaSize = writeJSON(join(OUT_DIR, "lane", "meta.json"), lane.meta);
  report.record("lane/meta.json", laneMetaSize.rawBytes, laneMetaSize.gzBytes);
  const laneSizes = [...lane.files.entries()].map(([root, file]) =>
    writeJSON(join(OUT_DIR, "lane", `${root}.json`), file),
  );
  // Uncounted, like readings/ and tafsir/: one root's article is fetched when
  // that root's page is opened, and prefetchAll does not warm it.
  const laneRaw = laneSizes.reduce((sum, x) => sum + x.rawBytes, 0);
  const laneGz = laneSizes.reduce((sum, x) => sum + x.gzBytes, 0);
  report.record("lane/*.json", laneRaw, laneGz, false);
  if (laneRaw > LANE_BUDGET_RAW) {
    fail(`lane/ exceeds its budget: ${laneRaw} > ${LANE_BUDGET_RAW} bytes`);
  }

  const tafsirMetaSize = writeJSON(join(OUT_DIR, "tafsir", TAFSIR_SLUG, "meta.json"), tafsir.meta);
  report.record("tafsir/meta.json", tafsirMetaSize.rawBytes, tafsirMetaSize.gzBytes);
  const tafsirSizes = [...tafsir.files.entries()].map(([n, file]) =>
    writeJSON(join(OUT_DIR, "tafsir", TAFSIR_SLUG, `${n}.json`), file),
  );
  // Uncounted for the same reason as readings/: an apparatus opened per
  // verse, fetched lazily, and not warmed by prefetchAll.
  const tafsirRaw = tafsirSizes.reduce((sum, x) => sum + x.rawBytes, 0);
  const tafsirGz = tafsirSizes.reduce((sum, x) => sum + x.gzBytes, 0);
  report.record("tafsir/*/*.json", tafsirRaw, tafsirGz, false);
  if (tafsirRaw > TAFSIR_BUDGET_RAW) {
    fail(`tafsir/ exceeds its budget: ${tafsirRaw} > ${TAFSIR_BUDGET_RAW} bytes`);
  }

  const treebankMetaSize = writeJSON(join(OUT_DIR, "treebank", "meta.json"), treebank.meta);
  report.record("treebank/meta.json", treebankMetaSize.rawBytes, treebankMetaSize.gzBytes);
  const treebankSizes = [...treebank.files.entries()].map(([n, file]) =>
    writeJSON(join(OUT_DIR, "treebank", `${n}.json`), file),
  );
  // Uncounted for the same reason as readings/ and tafsir/: an apparatus
  // opened per verse, fetched lazily, and not warmed by prefetchAll.
  const treebankRaw = treebankSizes.reduce((sum, x) => sum + x.rawBytes, 0);
  const treebankGz = treebankSizes.reduce((sum, x) => sum + x.gzBytes, 0);
  report.record("treebank/*.json", treebankRaw, treebankGz, false);
  if (treebankRaw > TREEBANK_BUDGET_RAW) {
    fail(`treebank/ exceeds its budget: ${treebankRaw} > ${TREEBANK_BUDGET_RAW} bytes`);
  }

  const syntaxSize = writeJSON(join(OUT_DIR, "syntax.json"), syntaxIndex);
  report.record("syntax.json", syntaxSize.rawBytes, syntaxSize.gzBytes);
  if (syntaxSize.rawBytes > BUDGETS_RAW_BYTES["syntax.json"]) {
    fail(
      `syntax.json exceeds its budget: ${syntaxSize.rawBytes} > ${BUDGETS_RAW_BYTES["syntax.json"]} bytes`,
    );
  }

  // Recorded but NOT counted toward the core totals, unlike syntax.json.
  // At 1.8 MB raw it is eight times that file's size, and it is opened only
  // by the grammar browser and by a QCQL query that names one of its
  // features -- counting it would put 174 KB gzipped on every visitor's
  // offline download for an index most never touch. Same treatment as
  // lane/, tafsir/ and readings/, and the same reason.
  const morphologySize = writeJSON(join(OUT_DIR, "morphology.json"), morphologyIndex);
  report.record("morphology.json", morphologySize.rawBytes, morphologySize.gzBytes, false);
  if (morphologySize.rawBytes > BUDGETS_RAW_BYTES["morphology.json"]) {
    fail(
      `morphology.json exceeds its budget: ${morphologySize.rawBytes} > ${BUDGETS_RAW_BYTES["morphology.json"]} bytes`,
    );
  }

  const arIndexSize = writeJSON(join(OUT_DIR, "ar-index.json"), arIndex);
  report.record("ar-index.json", arIndexSize.rawBytes, arIndexSize.gzBytes);
  if (arIndexSize.rawBytes > BUDGETS_RAW_BYTES["ar-index.json"]) {
    fail(
      `ar-index.json exceeds its budget: ${arIndexSize.rawBytes} > ${BUDGETS_RAW_BYTES["ar-index.json"]} bytes`,
    );
  }

  const occurrencesSize = writeJSON(join(OUT_DIR, "occurrences.json"), occurrenceIndex);
  report.record("occurrences.json", occurrencesSize.rawBytes, occurrencesSize.gzBytes);
  if (occurrencesSize.rawBytes > BUDGETS_RAW_BYTES["occurrences.json"]) {
    fail(
      `occurrences.json exceeds its budget: ${occurrencesSize.rawBytes} > ${BUDGETS_RAW_BYTES["occurrences.json"]} bytes`,
    );
  }

  const insightsSize = writeJSON(join(OUT_DIR, "insights.json"), insights);
  report.record("insights.json", insightsSize.rawBytes, insightsSize.gzBytes);

  const rhymeSize = writeJSON(join(OUT_DIR, "rhyme.json"), rhyme);
  report.record("rhyme.json", rhymeSize.rawBytes, rhymeSize.gzBytes);

  const distinctiveVocabSize = writeJSON(join(OUT_DIR, "distinctive-vocab.json"), distinctiveVocab);
  report.record(
    "distinctive-vocab.json",
    distinctiveVocabSize.rawBytes,
    distinctiveVocabSize.gzBytes,
  );

  const collocationsSize = writeJSON(join(OUT_DIR, "collocations.json"), collocations);
  report.record("collocations.json", collocationsSize.rawBytes, collocationsSize.gzBytes);

  const abjadSize = writeJSON(join(OUT_DIR, "abjad.json"), abjad);
  report.record("abjad.json", abjadSize.rawBytes, abjadSize.gzBytes);

  const cooccurrenceSize = writeJSON(join(OUT_DIR, "cooccurrence.json"), cooccurrence);
  report.record("cooccurrence.json", cooccurrenceSize.rawBytes, cooccurrenceSize.gzBytes);

  const patternsSize = writeJSON(join(OUT_DIR, "patterns.json"), patterns);
  report.record("patterns.json", patternsSize.rawBytes, patternsSize.gzBytes);

  const formulasSize = writeJSON(join(OUT_DIR, "formulas.json"), formulas);
  report.record("formulas.json", formulasSize.rawBytes, formulasSize.gzBytes);

  const verseSimilaritySize = writeJSON(join(OUT_DIR, "verse-similarity.json"), verseSimilarity);
  report.record("verse-similarity.json", verseSimilaritySize.rawBytes, verseSimilaritySize.gzBytes);

  const divineNamePairsSize = writeJSON(join(OUT_DIR, "divine-name-pairs.json"), divineNamePairs);
  report.record(
    "divine-name-pairs.json",
    divineNamePairsSize.rawBytes,
    divineNamePairsSize.gzBytes,
  );

  // A data dictionary for corpus.csv's columns and for the files above --
  // small (a few KB), so unlike corpus.csv itself it ships as an ordinary
  // part of the app payload, at a stable URL any researcher's script can
  // fetch without going through a GitHub release.
  const codebookSize = writeJSON(join(OUT_DIR, "codebook.json"), codebookJson);
  report.record("codebook.json", codebookSize.rawBytes, codebookSize.gzBytes);
  const corpusColumnsSize = writeText(join(OUT_DIR, "corpus-columns.csv"), corpusColumnsCsv);
  report.record("corpus-columns.csv", corpusColumnsSize.rawBytes, corpusColumnsSize.gzBytes);

  // Not recorded in `report`/counted against TOTAL_RAW_BUDGET or
  // TOTAL_GZ_BUDGET on purpose: unlike every file above, this is a
  // one-time bulk download a researcher opts into, never fetched by the
  // app itself (no getX() loader, no service-worker precache entry) --
  // it shouldn't compete with the app-shell size budgets those exist to
  // protect. Printed on its own line below instead.
  // Written OUTSIDE public/ so it never reaches the deployed site. At 37.5 MB
  // it is a third of the export's bytes, it breaches Cloudflare Pages'
  // 25 MiB per-asset cap at every tier, and it is a bulk download a handful
  // of visitors ever take -- not app payload. It is published as a release
  // asset instead; see the About page and EXPORT_DIR below.
  const exportSize = writeText(join(EXPORT_DIR, "corpus.csv"), corpusExportCsv);
  console.log(
    `\ndist/export/corpus.csv     raw ${(exportSize.rawBytes / 1024 / 1024).toFixed(2)} MB  gz ${(exportSize.gzBytes / 1024 / 1024).toFixed(2)} MB` +
      `\n  (not deployed -- upload to a GitHub release and set NEXT_PUBLIC_CORPUS_EXPORT_URL)`,
  );

  const surahSizes = [...surahFiles.entries()]
    .sort(([a], [b]) => a - b)
    .map(([n, file]) => writeJSON(join(OUT_DIR, "surahs", `${n}.json`), file));
  recordGroup(report, "surahs/*.json", surahSizes);

  let largestRootSize = 0;
  let largestRootName = "";
  const rootSizes = [...rootFiles.entries()].map(([root, file]) => {
    const size = writeJSON(join(OUT_DIR, "roots", `${root}.json`), file);
    if (size.rawBytes > largestRootSize) {
      largestRootSize = size.rawBytes;
      largestRootName = root;
    }
    return size;
  });
  recordGroup(report, "roots/*.json", rootSizes);
  if (largestRootSize > LARGEST_ROOT_BUDGET_RAW) {
    fail(
      `roots/${largestRootName}.json exceeds the largest-root budget: ${largestRootSize} > ${LARGEST_ROOT_BUDGET_RAW} bytes`,
    );
  }

  const lemmaSizes = [...lemmaFiles.entries()].map(([key, file]) =>
    writeJSON(join(OUT_DIR, "lemmas", `${key}.json`), file),
  );
  recordGroup(report, "lemmas/*.json", lemmaSizes);

  report.print();

  // Per-file budgets are already enforced at each writeJSON call site
  // above (so the build fails as early as possible); this re-checks them
  // plus the two whole-output totals through the same function --check
  // uses, so the two modes can never diverge again.
  const violations = checkSizeBudgets({
    entries: report.all(),
    perFileRawBudgets: BUDGETS_RAW_BYTES,
    totalRawBudget: TOTAL_RAW_BUDGET,
    totalGzBudget: TOTAL_GZ_BUDGET,
  });
  if (violations.length > 0) {
    fail(`Size budget exceeded:\n  ${violations.map(formatBudgetViolation).join("\n  ")}`);
  }

  console.log(`\n✓ Wrote data to ${OUT_DIR}`);
  if (mismatches.length > 0) {
    console.log(
      `  (${mismatches.length} verse(s) used the morphology fallback; see manifest.json.mismatches)`,
    );
  }
}

function printSizeEstimate(data: {
  surahFiles: Map<number, unknown>;
  meta: unknown;
  indexRoots: unknown;
  indexLemmas: unknown;
  formsEntries: unknown;
  enIndex: unknown;
  verseRoots: unknown;
  syntaxIndex: unknown;
  morphologyIndex: unknown;
  arIndex: unknown;
  occurrenceIndex: unknown;
  insights: unknown;
  rhyme: unknown;
  distinctiveVocab: unknown;
  collocations: unknown;
  abjad: unknown;
  cooccurrence: unknown;
  patterns: unknown;
  formulas: unknown;
  verseSimilarity: unknown;
  divineNamePairs: unknown;
  corpusExportBytes: number;
  codebookJson: unknown;
  corpusColumnsCsv: string;
  rootFiles: Map<string, unknown>;
  lemmaFiles: Map<string, unknown>;
  manifest: unknown;
}) {
  // Serializes and gzips exactly as writeJSON() does, so --check's figures
  // are the real ones rather than an uncompressed-only estimate. Costs a
  // second or two of gzip over the whole output; worth it for a mode whose
  // entire purpose is to catch a regression before the files are written.
  const report = new SizeReport();
  const rec = (label: string, obj: unknown, counted = true) => {
    const json = JSON.stringify(obj);
    report.record(
      label,
      Buffer.byteLength(json, "utf8"),
      gzipSync(Buffer.from(json, "utf8")).length,
      counted,
    );
  };
  rec("manifest.json", data.manifest);
  rec("meta.json", data.meta);
  rec("index.json", { roots: data.indexRoots, lemmas: data.indexLemmas });
  rec("forms.json", data.formsEntries);
  rec("en-index.json", data.enIndex);
  rec("verse-roots.json", data.verseRoots);
  rec("syntax.json", data.syntaxIndex);
  // Uncounted, exactly as the real build records it -- but sized here all
  // the same, so --check enforces its per-file budget and prints it. The
  // two modes diverging is the bug this function's comments are about.
  rec("morphology.json", data.morphologyIndex, false);
  rec("ar-index.json", data.arIndex);
  rec("occurrences.json", data.occurrenceIndex);
  rec("insights.json", data.insights);
  rec("rhyme.json", data.rhyme);
  rec("distinctive-vocab.json", data.distinctiveVocab);
  rec("collocations.json", data.collocations);
  rec("abjad.json", data.abjad);
  rec("cooccurrence.json", data.cooccurrence);
  rec("patterns.json", data.patterns);
  rec("formulas.json", data.formulas);
  rec("verse-similarity.json", data.verseSimilarity);
  rec("divine-name-pairs.json", data.divineNamePairs);
  rec("codebook.json", data.codebookJson);
  {
    const raw = Buffer.byteLength(data.corpusColumnsCsv, "utf8");
    const gz = gzipSync(Buffer.from(data.corpusColumnsCsv, "utf8")).length;
    report.record("corpus-columns.csv", raw, gz);
  }
  // The real build writes one file per surah/root/lemma; --check has no
  // files to measure, so it sizes the same payloads in aggregate. surahs/
  // was previously missing entirely, which hid ~3.3 MB raw from the total.
  // Sized per member and summed, NOT as one concatenated array: the real
  // build writes 114 + 1,651 + 4,783 separate files, and gzip does far
  // better on one big array than on thousands of small documents. Sizing
  // the array understated the real gzipped total by ~560 KB (16%), which
  // is most of the gz budget's headroom -- so a gz regression could have
  // passed --check and still failed the real build.
  const recGroup = (label: string, objs: Iterable<unknown>) => {
    let raw = 0;
    let gz = 0;
    for (const obj of objs) {
      const json = JSON.stringify(obj);
      raw += Buffer.byteLength(json, "utf8");
      gz += gzipSync(Buffer.from(json, "utf8")).length;
    }
    report.record(label, raw, gz);
  };
  recGroup("surahs/*.json (est.)", data.surahFiles.values());
  recGroup("roots/*.json (est.)", data.rootFiles.values());
  recGroup("lemmas/*.json (est.)", data.lemmaFiles.values());
  report.print();

  // corpus.csv is a bulk download, not part of the app payload -- the real
  // build excludes it from the budget totals, so --check must too. Reported
  // after print() precisely so it cannot leak into the report's totals.
  console.log(
    `\ndist/export/corpus.csv     raw ${(data.corpusExportBytes / 1024 / 1024).toFixed(2)} MB (not deployed; see the About page)`,
  );

  const violations = checkSizeBudgets({
    entries: report.all(),
    perFileRawBudgets: BUDGETS_RAW_BYTES,
    totalRawBudget: TOTAL_RAW_BUDGET,
    totalGzBudget: TOTAL_GZ_BUDGET,
  });
  // report.all() holds only the counted entries, so an uncounted file's own
  // per-file budget needs a second pass -- through the same function, with
  // the whole-output budgets lifted, because by definition these do not
  // consume them. The write path enforces the same budget at its writeJSON
  // call site.
  violations.push(
    ...checkSizeBudgets({
      entries: report.allIncludingUncounted().filter((e) => !e.counted),
      perFileRawBudgets: BUDGETS_RAW_BYTES,
      totalRawBudget: Infinity,
      totalGzBudget: Infinity,
    }),
  );
  if (violations.length > 0) {
    fail(`Size budget exceeded:\n  ${violations.map(formatBudgetViolation).join("\n  ")}`);
  }
  console.log("\n\u2713 All size budgets satisfied.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
