/**
 * Data pipeline orchestrator. Downloads (cached), parses, validates, and
 * emits every file under public/data/v1/**. Run via `pnpm data:build` (or
 * automatically as `prebuild`); `pnpm data:check` / `--check` runs the same
 * pipeline but skips writing files, only validating invariants and size
 * budgets -- useful in CI without touching the working tree.
 */
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";
import { createHash } from "node:crypto";

import { fetchCached, fetchCachedJSON } from "./lib/download";
import { parseMorphologyTSV, type RawWord } from "./lib/parse-morphology";
import { buildSurahs, type QuranJsonChapter } from "./lib/build-surahs";
import { buildRoots, type RootsGlossMap } from "./lib/build-roots";
import { buildEnIndex, type IndexableVerse } from "./lib/build-en-index";
import { buildArIndex, type ArIndexableVerse } from "./lib/build-ar-index";
import { buildVerseRoots } from "./lib/build-verse-roots";
import { SYNTAX_TAGS, buildSyntax } from "./lib/build-syntax";
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
import { SizeReport, checkSizeBudgets, formatBudgetViolation, recordGroup, writeJSON, writeText } from "./lib/emit";
import { ALL_TOPICS, DIVINE_NAME_TOPICS } from "../src/lib/topics/topicDefinitions";
import { topicSourceFileKey } from "../src/lib/topics/buildTopicOccurrences";
import type { ArIndexFile, ManifestFile, ManifestSource, VerseRootsFile } from "../src/lib/data/types";

interface PickthallEdition {
  quran: { chapter: number; verse: number; text: string }[];
}

const args = process.argv.slice(2);
const CHECK_ONLY = args.includes("--check");
const FORCE = args.includes("--force");

const MORPHOLOGY_URL = "https://raw.githubusercontent.com/mustafa0x/quran-morphology/master/quran-morphology.txt";
const QURAN_JSON_CHAPTER_URL = (n: number) =>
  `https://raw.githubusercontent.com/risan/quran-json/main/dist/chapters/en/${n}.json`;
const ROOTS_GLOSS_URL = "https://raw.githubusercontent.com/R3GENESI5/quran-bil-quran/master/app/data/roots_index.json";
// Pickthall's translation, from the same tanzil.net corpus quran-json's own
// Saheeh International text derives from -- a second English rendering
// shown alongside Saheeh International for translation comparison.
const PICKTHALL_URL = "https://raw.githubusercontent.com/fawazahmed0/quran-api/1/editions/eng-mohammedmarmadu.min.json";

const SOURCES: ManifestSource[] = [
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
];

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
};
const LARGEST_ROOT_BUDGET_RAW = 60 * 1024;
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
const TOTAL_RAW_BUDGET = 14 * 1024 * 1024;
const TOTAL_GZ_BUDGET = 3.5 * 1024 * 1024;

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
  console.log(`Data pipeline starting (${CHECK_ONLY ? "check-only" : "build"} mode)${FORCE ? ", forced refetch" : ""}`);

  // --- 1. Download ---
  const [morphology, rootsGloss, pickthall] = await Promise.all([
    fetchCached(MORPHOLOGY_URL, "quran-morphology.txt", { force: FORCE }),
    fetchCachedJSON<RootsGlossMap>(ROOTS_GLOSS_URL, "roots_index.json", { force: FORCE }),
    fetchCachedJSON<PickthallEdition>(PICKTHALL_URL, "pickthall.json", { force: FORCE }),
  ]);
  const pickthallByRef = new Map<string, string>();
  for (const v of pickthall.data.quran) {
    pickthallByRef.set(`${v.chapter}:${v.verse}`, v.text);
  }
  if (pickthallByRef.size < EXPECTED.verses - 50) {
    console.warn(
      `Warning: Pickthall translation only covers ${pickthallByRef.size}/${EXPECTED.verses} verses; some verses will show Saheeh International only.`,
    );
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
  console.log(`Downloaded morphology (${morphology.text.length.toLocaleString()} chars) and ${chapters.length} chapters.`);

  // --- 2. Parse ---
  const words: RawWord[] = parseMorphologyTSV(morphology.text);
  const totalSegments = words.reduce((sum, w) => sum + w.segments.length, 0);
  console.log(`Parsed ${words.length.toLocaleString()} words / ${totalSegments.toLocaleString()} segments.`);

  // --- 3. Build surahs (+ per-verse validation against quran-json) ---
  const { surahFiles, meta, mismatches } = buildSurahs(words, chapters, pickthallByRef);

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

  // --- 5b-ii. Build the corpus-wide syntactic / rhetorical index ---
  const syntaxIndex = buildSyntax(words);

  // --- 5c. Build corpus-wide curiosities for /insights/ ---
  const insights = buildInsights(words, rootFiles, lemmaFiles, indexRoots, indexLemmas, meta.surahs.length);
  const rhyme = buildRhyme(surahFiles);
  const distinctiveVocab = buildDistinctiveVocab(words, rootFiles, indexRoots, meta.surahs.length);
  const collocations = buildCollocations(words);
  const abjad = buildAbjad(words, meta.surahs.length, globalIdOf);
  const verseCountByRoot = new Map(indexRoots.map((r) => [r.ar, r.verseCount]));
  const cooccurrence = buildCooccurrence(words, verseCountByRoot, indexableVerses.length);
  const patterns = buildPatterns(words);
  const formulas = buildFormulas(surahFiles);
  const verseSimilarity = buildVerseSimilarity(words, globalIdOf);
  const divineNamePairs = buildDivineNamePairs(occurrenceIndex, indexRoots, indexLemmas, DIVINE_NAME_TOPICS);
  const corpusExportCsv = buildCorpusExportCsv(words, surahFiles, meta);
  const corpusExportBytes = Buffer.byteLength(corpusExportCsv, "utf8");

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
  assertEqual("occurrences.json row count", occurrenceIndex.rows.length, EXPECTED.occurrences, errors);
  assertEqual("syntax.json row count", syntaxIndex.t.length, EXPECTED.syntaxRows, errors);
  assertEqual("syntax.json tag vocabulary size", syntaxIndex.tags.length, SYNTAX_TAGS.length, errors);
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
    if (describeTag(tag).en === tag) errors.push(`syntax.json tag "${tag}" has no label in tagLabels.ts`);
  }
  if (verseRoots.length !== indexableVerses.length) {
    errors.push(
      `verse-roots.json length: expected ${indexableVerses.length} (one per verse), got ${verseRoots.length}`,
    );
  }

  if (arIndex.length !== indexableVerses.length) {
    errors.push(`ar-index.json length: expected ${indexableVerses.length} (one per verse), got ${arIndex.length}`);
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
    errors.push(`mismatches: ${mismatches.length} verses mismatched, expected <= ${EXPECTED.maxMismatches}`);
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
      const sourceKey = topicSourceFileKey(source) + (source.kind === "rootedLemma" ? `:${source.lemmaKey}` : "");
      if (seenSourceKeys.has(sourceKey)) {
        errors.push(`topic "${topic.slug}": duplicate source ${sourceKey}`);
      }
      seenSourceKeys.add(sourceKey);

      if (source.kind === "root") {
        if (!rootFiles.has(source.root)) {
          errors.push(`topic "${topic.slug}": root "${source.root}" not found in this corpus build`);
        }
      } else if (source.kind === "rootedLemma") {
        const rf = rootFiles.get(source.root);
        if (!rf) {
          errors.push(`topic "${topic.slug}": root "${source.root}" not found in this corpus build`);
        } else if (!rf.lemmas.some((l) => l.key === source.lemmaKey)) {
          errors.push(
            `topic "${topic.slug}": lemma key "${source.lemmaKey}" not found under root "${source.root}"`,
          );
        }
      } else {
        if (!lemmaFiles.has(source.lemmaKey)) {
          errors.push(`topic "${topic.slug}": rootless lemma key "${source.lemmaKey}" not found in this corpus build`);
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
  const hashInput = morphology.sha256 + rootsGloss.sha256 + pickthall.sha256 + chapters.map((c) => c.id).join(",");
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

  const indexSize = writeJSON(join(OUT_DIR, "index.json"), { roots: indexRoots, lemmas: indexLemmas });
  report.record("index.json", indexSize.rawBytes, indexSize.gzBytes);
  if (indexSize.rawBytes > BUDGETS_RAW_BYTES["index.json"]) {
    fail(`index.json exceeds its budget: ${indexSize.rawBytes} > ${BUDGETS_RAW_BYTES["index.json"]} bytes`);
  }

  const formsSize = writeJSON(join(OUT_DIR, "forms.json"), formsEntries);
  report.record("forms.json", formsSize.rawBytes, formsSize.gzBytes);
  if (formsSize.rawBytes > BUDGETS_RAW_BYTES["forms.json"]) {
    fail(`forms.json exceeds its budget: ${formsSize.rawBytes} > ${BUDGETS_RAW_BYTES["forms.json"]} bytes`);
  }

  const enIndexSize = writeJSON(join(OUT_DIR, "en-index.json"), enIndex);
  report.record("en-index.json", enIndexSize.rawBytes, enIndexSize.gzBytes);
  if (enIndexSize.rawBytes > BUDGETS_RAW_BYTES["en-index.json"]) {
    fail(`en-index.json exceeds its budget: ${enIndexSize.rawBytes} > ${BUDGETS_RAW_BYTES["en-index.json"]} bytes`);
  }

  const verseRootsSize = writeJSON(join(OUT_DIR, "verse-roots.json"), verseRoots);
  report.record("verse-roots.json", verseRootsSize.rawBytes, verseRootsSize.gzBytes);
  if (verseRootsSize.rawBytes > BUDGETS_RAW_BYTES["verse-roots.json"]) {
    fail(
      `verse-roots.json exceeds its budget: ${verseRootsSize.rawBytes} > ${BUDGETS_RAW_BYTES["verse-roots.json"]} bytes`,
    );
  }

  const syntaxSize = writeJSON(join(OUT_DIR, "syntax.json"), syntaxIndex);
  report.record("syntax.json", syntaxSize.rawBytes, syntaxSize.gzBytes);
  if (syntaxSize.rawBytes > BUDGETS_RAW_BYTES["syntax.json"]) {
    fail(`syntax.json exceeds its budget: ${syntaxSize.rawBytes} > ${BUDGETS_RAW_BYTES["syntax.json"]} bytes`);
  }

  const arIndexSize = writeJSON(join(OUT_DIR, "ar-index.json"), arIndex);
  report.record("ar-index.json", arIndexSize.rawBytes, arIndexSize.gzBytes);
  if (arIndexSize.rawBytes > BUDGETS_RAW_BYTES["ar-index.json"]) {
    fail(`ar-index.json exceeds its budget: ${arIndexSize.rawBytes} > ${BUDGETS_RAW_BYTES["ar-index.json"]} bytes`);
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
  report.record("distinctive-vocab.json", distinctiveVocabSize.rawBytes, distinctiveVocabSize.gzBytes);

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
  report.record("divine-name-pairs.json", divineNamePairsSize.rawBytes, divineNamePairsSize.gzBytes);

  // Not recorded in `report`/counted against TOTAL_RAW_BUDGET or
  // TOTAL_GZ_BUDGET on purpose: unlike every file above, this is a
  // one-time bulk download a researcher opts into, never fetched by the
  // app itself (no getX() loader, no service-worker precache entry) --
  // it shouldn't compete with the app-shell size budgets those exist to
  // protect. Printed on its own line below instead.
  const exportSize = writeText(join(OUT_DIR, "export", "corpus.csv"), corpusExportCsv);
  console.log(
    `\nexport/corpus.csv          raw ${(exportSize.rawBytes / 1024 / 1024).toFixed(2)} MB  gz ${(exportSize.gzBytes / 1024 / 1024).toFixed(2)} MB (not counted toward the size budgets above)`,
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
    console.log(`  (${mismatches.length} verse(s) used the morphology fallback; see manifest.json.mismatches)`);
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
  rootFiles: Map<string, unknown>;
  lemmaFiles: Map<string, unknown>;
  manifest: unknown;
}) {
  // Serializes and gzips exactly as writeJSON() does, so --check's figures
  // are the real ones rather than an uncompressed-only estimate. Costs a
  // second or two of gzip over the whole output; worth it for a mode whose
  // entire purpose is to catch a regression before the files are written.
  const report = new SizeReport();
  const rec = (label: string, obj: unknown) => {
    const json = JSON.stringify(obj);
    report.record(label, Buffer.byteLength(json, "utf8"), gzipSync(Buffer.from(json, "utf8")).length);
  };
  rec("manifest.json", data.manifest);
  rec("meta.json", data.meta);
  rec("index.json", { roots: data.indexRoots, lemmas: data.indexLemmas });
  rec("forms.json", data.formsEntries);
  rec("en-index.json", data.enIndex);
  rec("verse-roots.json", data.verseRoots);
  rec("syntax.json", data.syntaxIndex);
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
    `\nexport/corpus.csv          raw ${(data.corpusExportBytes / 1024 / 1024).toFixed(2)} MB (not counted toward the size budgets above)`,
  );

  const violations = checkSizeBudgets({
    entries: report.all(),
    perFileRawBudgets: BUDGETS_RAW_BYTES,
    totalRawBudget: TOTAL_RAW_BUDGET,
    totalGzBudget: TOTAL_GZ_BUDGET,
  });
  if (violations.length > 0) {
    fail(`Size budget exceeded:\n  ${violations.map(formatBudgetViolation).join("\n  ")}`);
  }
  console.log("\n\u2713 All size budgets satisfied.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
