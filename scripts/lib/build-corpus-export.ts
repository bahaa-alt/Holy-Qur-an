import { classify } from "../../src/lib/morphology/classify";
import type { MetaFile, SurahFile } from "../../src/lib/data/types";
import type { RawWord } from "./parse-morphology";

const HEADER = [
  "surah",
  "ayah",
  "surah_name_en",
  "surah_name_ar",
  "revelation_type",
  "word_index",
  "word",
  "root",
  "lemma",
  "category",
  "tags",
  "translation_saheeh",
  "translation_pickthall",
].join(",");

/** Quotes a CSV field only when it needs it (contains a comma, quote, or newline), per RFC 4180. */
function csvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Builds a single downloadable CSV of the entire tagged corpus, one row
 * per word (77,429 rows) -- the "take the whole dataset home" export for
 * researchers who want to work in Excel, pandas, or R rather than through
 * this app's own pages. Every other export in this app (ExportMenu) is
 * scoped to a filtered result set; this is the unfiltered corpus.
 *
 * A word can carry more than one morphological segment (prefixes/clitics,
 * the stem, suffixes), but at most one of them carries a ROOT -- except
 * 20:94:2 (يَبْنَؤُمَّ), the corpus's one word with two rooted segments,
 * whose second root is not represented here. This mirrors the app's own
 * "occurrence" methodology (see /about): root/lemma/category/tags are
 * taken from the word's rooted segment when it has one, left blank for
 * words that are pure particles/pronouns/clitics (no root at all).
 */
export function buildCorpusExportCsv(
  words: readonly RawWord[],
  surahFiles: ReadonlyMap<number, SurahFile>,
  meta: MetaFile,
): string {
  const surahMetaByNum = new Map(meta.surahs.map((s) => [s.n, s]));
  const verseByRef = new Map<string, { t: string; pickthall?: string }>();
  for (const file of surahFiles.values()) {
    for (const v of file.verses) {
      verseByRef.set(`${file.n}:${v.a}`, { t: v.t, pickthall: v.pickthall });
    }
  }

  const lines: string[] = [HEADER];
  for (const word of words) {
    const surahMeta = surahMetaByNum.get(word.s);
    const verse = verseByRef.get(`${word.s}:${word.a}`);
    const rootedSeg = word.segments.find((seg) => seg.root !== null);

    const row = [
      String(word.s),
      String(word.a),
      surahMeta?.nameEn ?? "",
      surahMeta?.nameAr ?? "",
      surahMeta?.type ?? "",
      String(word.w),
      word.text,
      rootedSeg?.root ?? "",
      rootedSeg?.lemma ?? "",
      rootedSeg ? classify(rootedSeg.pos, rootedSeg.tags) : "",
      rootedSeg ? rootedSeg.tags.join("|") : "",
      verse?.t ?? "",
      verse?.pickthall ?? "",
    ]
      .map(csvField)
      .join(",");
    lines.push(row);
  }

  return lines.join("\r\n") + "\r\n";
}
