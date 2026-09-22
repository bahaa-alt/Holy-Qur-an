#!/usr/bin/env -S npx tsx
/**
 * A command-line front end for QCQL (src/lib/qcql), the query language
 * the /query/ page runs in the browser -- for a researcher who wants to
 * run many queries, script against results, or pull a match list into a
 * notebook, rather than clicking through the web UI one query at a time.
 *
 * The engine itself (parse + execute) is unchanged from what runs in the
 * browser: this script only adds a way to feed it data files from disk
 * (or a deployed site) and print the result as CSV or JSON.
 *
 * Usage:
 *   npx tsx scripts/qcql-cli.ts "[root=علم & cat=verb.perf] :: meccan"
 *   npx tsx scripts/qcql-cli.ts "[COND]" --format json
 *   npx tsx scripts/qcql-cli.ts "[case=acc]" --base-url https://example.com
 *
 * By default, data files are read from public/data/v1 (what `npm run
 * data:build` produces) -- so this works out of the box in a checkout
 * that has been built. Pass --base-url to fetch the same files from a
 * deployed instance instead, for a clone that has not run the data
 * pipeline.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseQcql } from "../src/lib/qcql/parse";
import { executeQcql, type QcqlCorpus } from "../src/lib/qcql/execute";
import { needsMorphology } from "../src/lib/qcql/types";
import type {
  IndexFile,
  MetaFile,
  MorphologyIndexFile,
  OccurrenceIndexFile,
  SurahFile,
  SyntaxIndexFile,
} from "../src/lib/data/types";

interface Args {
  query: string;
  format: "csv" | "json";
  dataDir: string | null;
  baseUrl: string | null;
  withText: boolean;
  limit: number | null;
}

function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  let format: Args["format"] = "csv";
  let dataDir: string | null = null;
  let baseUrl: string | null = null;
  let withText = false;
  let limit: number | null = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--format") format = argv[++i] as Args["format"];
    else if (arg === "--data-dir") dataDir = argv[++i];
    else if (arg === "--base-url") baseUrl = argv[++i];
    else if (arg === "--with-text") withText = true;
    else if (arg === "--limit") limit = Number(argv[++i]);
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else positional.push(arg);
  }

  if (positional.length !== 1) {
    printHelp();
    process.exit(1);
  }
  if (format !== "csv" && format !== "json") {
    console.error(`Unknown --format "${format}"; expected csv or json.`);
    process.exit(1);
  }
  return { query: positional[0], format, dataDir, baseUrl, withText, limit };
}

function printHelp() {
  console.error(
    [
      "Usage: npx tsx scripts/qcql-cli.ts <query> [options]",
      "",
      "Options:",
      "  --format csv|json   Output format (default: csv)",
      "  --data-dir <path>   Read data files from this directory (default: public/data/v1)",
      "  --base-url <url>    Fetch data files from this URL instead of a local directory",
      "                      (e.g. a deployed instance's origin, no trailing slash)",
      "  --with-text         Also fetch each match's surah file and include the verse text",
      "                      (slower: one file per distinct surah matched)",
      "  --limit <n>         Stop after n matches",
      "",
      "Examples:",
      '  npx tsx scripts/qcql-cli.ts "[root=علم & cat=verb.perf] :: meccan"',
      '  npx tsx scripts/qcql-cli.ts "[COND]" --format json --limit 20',
    ].join("\n"),
  );
}

/** Loads one data file, from a local directory or a remote base URL. */
async function loadFile<T>(name: string, args: Args): Promise<T> {
  if (args.baseUrl) {
    const url = `${args.baseUrl.replace(/\/$/, "")}/data/v1/${name}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
    return (await res.json()) as T;
  }
  const dir = args.dataDir ?? join(process.cwd(), "public", "data", "v1");
  return JSON.parse(readFileSync(join(dir, name), "utf-8")) as T;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  let query;
  try {
    query = parseQcql(args.query);
  } catch (err) {
    console.error(`Query error: ${(err as Error).message}`);
    process.exit(1);
  }

  const [occurrences, syntax, index, meta] = await Promise.all([
    loadFile<OccurrenceIndexFile>("occurrences.json", args),
    loadFile<SyntaxIndexFile>("syntax.json", args),
    loadFile<IndexFile>("index.json", args),
    loadFile<MetaFile>("meta.json", args),
  ]);
  const morphology = needsMorphology(query)
    ? await loadFile<MorphologyIndexFile>("morphology.json", args)
    : undefined;

  const corpus: QcqlCorpus = { occurrences, syntax, index, surahs: meta.surahs, morphology };
  const result = executeQcql(query, corpus);
  const matches = args.limit !== null ? result.matches.slice(0, args.limit) : result.matches;

  // Cross-reference occurrences.json for root/lemma/category on matches
  // that are rooted occurrences -- free, since it is already loaded, and
  // it is the one enrichment a bare (s, a, w) match list cannot answer
  // on its own.
  const occByKey = new Map(occurrences.rows.map((r) => [`${r[0]}:${r[1]}:${r[2]}`, r]));

  const surahTextCache = new Map<number, SurahFile>();
  async function verseText(s: number, a: number, w: number): Promise<string> {
    let file = surahTextCache.get(s);
    if (!file) {
      file = await loadFile<SurahFile>(`surahs/${s}.json`, args);
      surahTextCache.set(s, file);
    }
    return file.verses.find((v) => v.a === a)?.w[w - 1] ?? "";
  }

  interface Row {
    s: number;
    a: number;
    w: number;
    root: string;
    lemma: string;
    category: string;
    text: string;
  }
  const rows: Row[] = [];
  for (const m of matches) {
    const occ = occByKey.get(`${m.s}:${m.a}:${m.w}`);
    rows.push({
      s: m.s,
      a: m.a,
      w: m.w,
      root: occ ? index.roots[occ[3]].ar : "",
      lemma: occ ? index.lemmas[occ[4]].lemma : "",
      category: occ ? occurrences.cats[occ[5]] : "",
      text: args.withText ? await verseText(m.s, m.a, m.w) : "",
    });
  }

  console.error(
    `${result.matches.length.toLocaleString()} match(es) across ${result.verseCount.toLocaleString()} verse(s)${
      args.limit !== null && args.limit < result.matches.length ? ` (showing ${args.limit})` : ""
    }`,
  );

  if (args.format === "json") {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }

  const columns: (keyof Row)[] = args.withText
    ? ["s", "a", "w", "root", "lemma", "category", "text"]
    : ["s", "a", "w", "root", "lemma", "category"];
  const csvField = (v: string | number) => {
    const s = String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  console.log(columns.join(","));
  for (const row of rows) console.log(columns.map((c) => csvField(row[c])).join(","));
}

void main();
