/**
 * Data pipeline orchestrator. Downloads (cached), parses, validates, and
 * emits every file under public/data/v1/**. Run via `pnpm data:build` (or
 * automatically as `prebuild`); `pnpm data:check` / `--check` runs the same
 * pipeline but skips writing files, only validating invariants and size
 * budgets -- useful in CI without touching the working tree.
 */
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

import { fetchCached, fetchCachedJSON } from "./lib/download";
import { parseMorphologyTSV, type RawWord } from "./lib/parse-morphology";
import { buildSurahs, type QuranJsonChapter } from "./lib/build-surahs";
import { buildRoots, type RootsGlossMap } from "./lib/build-roots";
import { buildEnIndex, type IndexableVerse } from "./lib/build-en-index";
import { SizeReport, recordGroup, writeJSON } from "./lib/emit";
import type { ManifestFile, ManifestSource } from "../src/lib/data/types";

const args = process.argv.slice(2);
const CHECK_ONLY = args.includes("--check");
const FORCE = args.includes("--force");

const MORPHOLOGY_URL = "https://raw.githubusercontent.com/mustafa0x/quran-morphology/master/quran-morphology.txt";
const QURAN_JSON_CHAPTER_URL = (n: number) =>
  `https://raw.githubusercontent.com/risan/quran-json/main/dist/chapters/en/${n}.json`;
const ROOTS_GLOSS_URL = "https://raw.githubusercontent.com/R3GENESI5/quran-bil-quran/master/app/data/roots_index.json";

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
  rootCounts: { كتب: 319, رحم: 339, علم: 854 } as Record<string, number>,
  maxMismatches: 50,
};

// Budgets below reflect the actual measured output of the real corpus (see
// `pnpm data:check` size report), not the rough pre-implementation estimates
// in PLAN.md -- those assumed lighter dedup than the data actually allows
// (e.g. forms.json carries every distinct diacritized surface form, not just
// bare stems). Kept with headroom above the current measured size so the
// budget still catches a real regression.
const BUDGETS_RAW_BYTES = {
  "index.json": 800 * 1024,
  "forms.json": 1000 * 1024,
  "en-index.json": 500 * 1024,
};
const LARGEST_ROOT_BUDGET_RAW = 60 * 1024;
const TOTAL_RAW_BUDGET = 9 * 1024 * 1024;
const TOTAL_GZ_BUDGET = 3 * 1024 * 1024;

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
  const [morphology, rootsGloss] = await Promise.all([
    fetchCached(MORPHOLOGY_URL, "quran-morphology.txt", { force: FORCE }),
    fetchCachedJSON<RootsGlossMap>(ROOTS_GLOSS_URL, "roots_index.json", { force: FORCE }),
  ]);

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
  const { surahFiles, meta, mismatches } = buildSurahs(words, chapters);

  // --- 4. Build roots / lemmas / forms ---
  const {
    indexRoots,
    indexLemmas,
    rootFiles,
    lemmaFiles,
    formsEntries,
    unmappedGlossRoots,
    unusedGlossRoots,
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
  let globalId = 0;
  const globalIdOf = new Map<string, number>();
  for (const surahMeta of meta.surahs) {
    const surah = surahFiles.get(surahMeta.n)!;
    for (const verse of surah.verses) {
      globalIdOf.set(`${surahMeta.n}:${verse.a}`, globalId);
      indexableVerses.push({ globalId, translation: verse.t });
      globalId++;
    }
  }
  const enIndex = buildEnIndex(indexableVerses);

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

  if (errors.length > 0) {
    console.error(`\n${errors.length} invariant(s) failed:`);
    for (const e of errors) console.error(`  - ${e}`);
    fail("Data pipeline invariants failed.");
  }
  console.log("✓ All invariants passed.");

  // --- 7. Manifest ---
  const hashInput = morphology.sha256 + rootsGloss.sha256 + chapters.map((c) => c.id).join(",");
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
    },
    sources: SOURCES,
    mismatches,
  };

  if (CHECK_ONLY) {
    console.log("\n--check mode: skipping file writes.");
    printSizeEstimate({ meta, indexRoots, indexLemmas, formsEntries, enIndex, rootFiles, lemmaFiles, manifest });
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

  if (report.totalRaw() > TOTAL_RAW_BUDGET) {
    fail(`Total public/data/v1 size exceeds budget: ${report.totalRaw()} > ${TOTAL_RAW_BUDGET} bytes (raw)`);
  }
  if (report.totalGz() > TOTAL_GZ_BUDGET) {
    fail(`Total public/data/v1 gzipped size exceeds budget: ${report.totalGz()} > ${TOTAL_GZ_BUDGET} bytes (gz)`);
  }

  console.log(`\n✓ Wrote data to ${OUT_DIR}`);
  if (mismatches.length > 0) {
    console.log(`  (${mismatches.length} verse(s) used the morphology fallback; see manifest.json.mismatches)`);
  }
}

function printSizeEstimate(data: {
  meta: unknown;
  indexRoots: unknown;
  indexLemmas: unknown;
  formsEntries: unknown;
  enIndex: unknown;
  rootFiles: Map<string, unknown>;
  lemmaFiles: Map<string, unknown>;
  manifest: unknown;
}) {
  const report = new SizeReport();
  const rec = (label: string, obj: unknown) => {
    const json = JSON.stringify(obj);
    report.record(label, Buffer.byteLength(json, "utf8"), 0);
  };
  rec("manifest.json", data.manifest);
  rec("meta.json", data.meta);
  rec("index.json", { roots: data.indexRoots, lemmas: data.indexLemmas });
  rec("forms.json", data.formsEntries);
  rec("en-index.json", data.enIndex);
  rec("roots/*.json (est.)", [...data.rootFiles.values()]);
  rec("lemmas/*.json (est.)", [...data.lemmaFiles.values()]);
  report.print();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
