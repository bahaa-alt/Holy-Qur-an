import type { TreebankEntry, TreebankMetaFile, TreebankSurahFile } from "../../src/lib/data/types";

/**
 * One row of NoorBayan/Quranic's per-token treebank (an extended CoNLL-X
 * table). `location` is "(surah:ayah:word:segment)" for a real, surface
 * token, or the literal string "_" for a virtual node the source inserts to
 * represent an elided/implied grammatical element (e.g. an omitted
 * predicate) -- it has no surface text and no location of its own, only
 * the verse it belongs to.
 *
 * `refTokenId` is NOT a global id: it is `tokenId`, scoped to `sentenceId`
 * (a clause-level grouping that can span multiple verses, or a verse can
 * contain several -- but never crosses a surah boundary; see
 * build-treebank.test.ts). 0 means "no head" (this token is its own
 * sentence's root).
 */
export interface RawTreebankRow {
  tid: number;
  sentenceId: string;
  tokenId: number;
  location: string;
  chapterId: number;
  verseId: number;
  uthmaniToken: string;
  relLabel: string;
  relLabelAr: string;
  refTokenId: number;
}

const REQUIRED_COLUMNS = [
  "tid",
  "sentence_id",
  "token_id",
  "location",
  "chapter_id",
  "verse_id",
  "uthmani_token",
  "rel_label",
  "rel_label_ar",
  "ref_token_id",
] as const;

/**
 * Parses the source's tab-separated table (UTF-16LE decoded to a string by
 * the caller) into rows, reading columns by NAME rather than position so a
 * reordered upstream column doesn't silently misalign the join. No
 * quoting/escaping in this format -- a naive split is correct, matching
 * parse-morphology.ts's identical assumption about quran-morphology.txt.
 */
export function parseTreebankTSV(text: string): RawTreebankRow[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/^﻿/, "").split("\n");
  if (lines.length === 0 || lines[0].trim() === "") {
    throw new Error("parseTreebankTSV: empty input");
  }

  const header = lines[0].split("\t");
  const colIndex = new Map(header.map((name, i) => [name.trim(), i]));
  for (const col of REQUIRED_COLUMNS) {
    if (!colIndex.has(col)) {
      throw new Error(`parseTreebankTSV: missing expected column "${col}"`);
    }
  }
  const at = (cols: string[], name: string) => cols[colIndex.get(name)!] ?? "";

  const rows: RawTreebankRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") continue;
    const cols = line.split("\t");
    if (cols.length !== header.length) {
      throw new Error(
        `parseTreebankTSV: row ${i} has ${cols.length} fields, expected ${header.length}`,
      );
    }
    rows.push({
      tid: Number(at(cols, "tid")),
      sentenceId: at(cols, "sentence_id"),
      tokenId: Number(at(cols, "token_id")),
      location: at(cols, "location"),
      chapterId: Number(at(cols, "chapter_id")),
      verseId: Number(at(cols, "verse_id")),
      uthmaniToken: at(cols, "uthmani_token"),
      relLabel: at(cols, "rel_label"),
      relLabelAr: at(cols, "rel_label_ar"),
      refTokenId: Number(at(cols, "ref_token_id")),
    });
  }
  return rows;
}

const LOCATION_RE = /^\((\d+):(\d+):(\d+):(\d+)\)$/;

/**
 * Joins the treebank onto this app's own segment addressing and shards it
 * per surah.
 *
 * COVERAGE IS NOT 1:1 AND THAT IS EXPECTED, same reasoning as buildTafsir:
 * two independently maintained corpora segment a handful of words
 * differently. A treebank location this app's own corpus doesn't recognize
 * is dropped (counted in the returned meta), not force-fitted -- and
 * because `validLocations` is passed in rather than derived here, a
 * systematic mismatch (wrong source, reformatted upstream file) shows up as
 * near-zero coverage, which the caller asserts against.
 *
 * A dependent's head can itself be a virtual/elided node (its `location` is
 * "_"), or point at itself (some source rows encode "no independent
 * relation" that way, e.g. a bare definite-article prefix) -- both resolve
 * to `head: null` rather than a fabricated location.
 */
export function buildTreebank(
  rows: readonly RawTreebankRow[],
  validLocations: ReadonlySet<string>,
): { meta: TreebankMetaFile; files: Map<number, TreebankSurahFile> } {
  const bySentenceToken = new Map<string, RawTreebankRow>();
  for (const row of rows) {
    bySentenceToken.set(`${row.sentenceId}:${row.tokenId}`, row);
  }

  const bySurah = new Map<number, { entries: TreebankEntry[]; elidedAyahs: Set<number> }>();
  function bucket(n: number) {
    let b = bySurah.get(n);
    if (!b) {
      b = { entries: [], elidedAyahs: new Set() };
      bySurah.set(n, b);
    }
    return b;
  }

  let covered = 0;

  for (const row of rows) {
    if (row.location === "_") {
      bucket(row.chapterId).elidedAyahs.add(row.verseId);
      continue;
    }

    const m = LOCATION_RE.exec(row.location);
    if (!m) {
      throw new Error(`buildTreebank: unparseable location "${row.location}" (tid ${row.tid})`);
    }
    const [, sStr, aStr, wStr, gStr] = m;
    const s = Number(sStr);
    const a = Number(aStr);
    const w = Number(wStr);
    const g = Number(gStr);
    if (!validLocations.has(`${s}:${a}:${w}:${g}`)) continue;

    let head: string | null = null;
    if (row.refTokenId !== 0 && row.refTokenId !== row.tokenId) {
      const headRow = bySentenceToken.get(`${row.sentenceId}:${row.refTokenId}`);
      if (headRow && headRow.location !== "_" && headRow.tid !== row.tid) {
        const hm = LOCATION_RE.exec(headRow.location);
        if (hm) head = `${hm[2]}:${hm[3]}:${hm[4]}`;
      }
    }

    bucket(s).entries.push({
      a,
      w,
      g,
      t: row.uthmaniToken.trim(),
      rel: row.relLabel,
      relAr: row.relLabelAr,
      head,
    });
    covered++;
  }

  const files = new Map<number, TreebankSurahFile>();
  for (const [n, b] of bySurah) {
    b.entries.sort((x, y) => x.a - y.a || x.w - y.w || x.g - y.g);
    files.set(n, {
      n,
      entries: b.entries,
      elidedAyahs: [...b.elidedAyahs].sort((x, y) => x - y),
    });
  }

  return { meta: { coveredSegments: covered, totalSegments: validLocations.size }, files };
}
